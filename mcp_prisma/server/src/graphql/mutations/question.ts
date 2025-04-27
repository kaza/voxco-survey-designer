import { builder } from '../../builder-instance.js';

// Define the input type for addQuestion
const AddQuestionInput = builder.inputType('AddQuestionInput', {
  fields: (t) => ({
    blockId: t.id({ required: true, description: "The ID of the block to add the question to." }),
    name: t.string({ required: true, description: "The internal name/identifier for the question." }),
    type: t.string({ required: true, description: "The type of the question (e.g., 'NumericAnswer', 'RadioButton')." }),
    text: t.string({ required: true, description: "The initial question text/label." }),
    languageCode: t.string({ required: true, description: "The language code for the initial text (e.g., 'en')." }),
    isPageBreak: t.boolean({ description: "Does this question represent a page break?" }), // Optional
    // orderIndex will be determined automatically
  }),
});

// Define the addQuestion mutation field
builder.mutationField('addQuestion', (t) =>
  t.prismaField({
    description: "Adds a new question to the end of the specified block's question list, along with its initial translation.",
    type: 'Question', // Return type is the created Question object
    args: {
      input: t.arg({ type: AddQuestionInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const blockId = parseInt(String(args.input.blockId), 10);
      const { name, type, text, languageCode, isPageBreak } = args.input;

      // Basic validation
      if (!name || !type || !text || !languageCode) {
        throw new Error("Block ID, name, type, text, and languageCode are required.");
      }
      // TODO: Validate languageCode format? Check if it exists in SurveyLanguage?
      // TODO: Validate question type against an enum/list?

      // Determine the next orderIndex within the block
      const existingQuestionsCount = await ctx.prisma.question.count({
        where: { block_id: blockId },
      });
      const orderIndex = existingQuestionsCount; // 0-based index

      // Create the question and its initial translation in one transaction
      const newQuestion = await ctx.prisma.question.create({
        data: {
          name,
          type,
          block_id: blockId,
          order_index: orderIndex,
          is_page_break: isPageBreak ?? false, // Default to false if not provided
          // Create the initial translation via nested write
          translations: {
            create: {
              language_code: languageCode,
              text: text,
            },
          },
        },
        // Include relations based on the GraphQL query selection set
        ...query,
      });

      return newQuestion;
    },
  })
);

// Define the input type for updateQuestion
const UpdateQuestionInput = builder.inputType('UpdateQuestionInput', {
  fields: (t) => ({
    name: t.string({ description: "The updated internal name/identifier." }),
    type: t.string({ description: "The updated question type." }),
    isPageBreak: t.boolean({ description: "Set whether this question acts as a page break." }),
    orderIndex: t.int({ 
      description: "The desired 0-based position within the block. Providing this will shift other questions in the same block.",
    }),
    // Note: Updating question text requires mutating QuestionTranslation
  }),
});

// Define the updateQuestion mutation field
builder.mutationField('updateQuestion', (t) =>
  t.prismaField({
    type: 'Question', // Return type is the updated Question object
    args: {
      id: t.arg.id({ required: true, description: "The ID of the question to update." }),
      input: t.arg({ type: UpdateQuestionInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const questionId = parseInt(String(args.id), 10);
      const { name, type, isPageBreak, orderIndex: newOrderIndex } = args.input;

      // --- Simple Update Data (without order) ---
      const simpleUpdateData: { name?: string; type?: string; is_page_break?: boolean } = {};
      let needsReorder = false;

      if (name !== null && name !== undefined) {
        simpleUpdateData.name = name;
      }
      if (type !== null && type !== undefined) {
        // TODO: Validate type?
        simpleUpdateData.type = type;
      }
      if (isPageBreak !== null && isPageBreak !== undefined) {
        simpleUpdateData.is_page_break = isPageBreak;
      }
      if (newOrderIndex !== null && newOrderIndex !== undefined) {
        needsReorder = true;
      }

      // --- Handle Reordering if orderIndex is provided ---
      if (needsReorder) {
        if (newOrderIndex === null || newOrderIndex === undefined || newOrderIndex < 0) {
           throw new Error("A valid, non-negative 0-based orderIndex must be provided for reordering.");
        }
        
        return ctx.prisma.$transaction(async (tx) => {
          // 1. Fetch the question being moved and its block context
          const questionToMove = await tx.question.findUnique({
            where: { id: questionId },
            select: { order_index: true, block_id: true },
          });

          if (!questionToMove) {
            throw new Error(`Question with ID ${questionId} not found.`);
          }

          const currentOrderIndex = questionToMove.order_index;
          const blockId = questionToMove.block_id;

          // No change in order needed
          if (newOrderIndex === currentOrderIndex) {
             return tx.question.update({ 
               where: { id: questionId }, 
               data: { ...simpleUpdateData }, // Apply simple updates if any
               ...query 
             });
          }

          // 2. Fetch all sibling questions within the same block
          const siblingQuestions = await tx.question.findMany({
            where: { block_id: blockId },
            select: { id: true, order_index: true },
            orderBy: { order_index: 'asc' },
          });

          // 3. Validate new index
          if (newOrderIndex >= siblingQuestions.length) {
            throw new Error(`Invalid orderIndex ${newOrderIndex}. Maximum allowed index for this block is ${siblingQuestions.length - 1}.`);
          }

          // 4. Determine direction and update siblings
          const updates: Promise<any>[] = [];

          if (newOrderIndex < currentOrderIndex) {
            // Moving UP: Increment indices >= newIndex and < oldIndex
            updates.push(tx.question.updateMany({
              where: {
                block_id: blockId,
                order_index: { gte: newOrderIndex, lt: currentOrderIndex },
              },
              data: {
                order_index: { increment: 1 },
              },
            }));
          } else { // newOrderIndex > currentOrderIndex
            // Moving DOWN: Decrement indices > oldIndex and <= newIndex
            updates.push(tx.question.updateMany({
              where: {
                block_id: blockId,
                order_index: { gt: currentOrderIndex, lte: newOrderIndex },
              },
              data: {
                order_index: { decrement: 1 },
              },
            }));
          }
          
          // 5. Update the target question itself
          updates.push(tx.question.update({
             where: { id: questionId },
             data: {
               ...simpleUpdateData,
               order_index: newOrderIndex,
             },
             ...query, // Apply selection set
          }));

          // Execute sibling updates first, then the target update
          await Promise.all(updates.slice(0, -1)); 
          const finalUpdatedQuestion = await updates[updates.length - 1];

          return finalUpdatedQuestion;
        });

      } else {
        // --- Simple Update Only (no orderIndex change) ---
        if (Object.keys(simpleUpdateData).length === 0) {
           throw new Error("No update data provided.");
        }
        return ctx.prisma.question.update({
          where: { id: questionId },
          data: simpleUpdateData,
          ...query,
        });
      }
    },
  })
);

// Define the deleteQuestion mutation field
builder.mutationField('deleteQuestion', (t) =>
  t.prismaField({
    description: "Deletes a question and adjusts the order index of subsequent questions in the same block.",
    type: 'Question', // Return the data of the question that was deleted
    args: {
      id: t.arg.id({ required: true, description: "The ID of the question to delete." }),
    },
    resolve: async (query, _root, args, ctx) => {
      const questionId = parseInt(String(args.id), 10);

      // Use a transaction for atomicity
      return ctx.prisma.$transaction(async (tx) => {
        // 1. Find the question to get its data and context before deleting
        const questionToDelete = await tx.question.findUnique({
          where: { id: questionId },
          ...query, // Fetch fields based on the GraphQL query selection set
        });

        if (!questionToDelete) {
          throw new Error(`Question with ID ${questionId} not found.`);
        }

        // Store necessary info for reordering before deleting
        const deletedOrderIndex = questionToDelete.order_index;
        const blockId = questionToDelete.block_id;

        // 2. Delete the question (Prisma handles related records like translations/settings)
        await tx.question.delete({ where: { id: questionId } });

        // 3. Update the order index of subsequent questions in the same block
        await tx.question.updateMany({
          where: {
            block_id: blockId,
            order_index: { gt: deletedOrderIndex },
          },
          data: {
            order_index: { decrement: 1 },
          },
        });

        // 4. Return the data of the question that was deleted (fetched before deletion)
        return questionToDelete;
      });
    },
  })
); 