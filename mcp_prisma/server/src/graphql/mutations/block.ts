import { builder } from '../../builder-instance.js';

// Define the input type for addBlock
const AddBlockInput = builder.inputType('AddBlockInput', {
  fields: (t) => ({
    surveyId: t.id({ required: true, description: "The ID of the survey to add the block to." }),
    name: t.string({ required: true, description: "The name of the new block." }),
    // orderIndex will be determined automatically by the resolver
  }),
});

// Define the addBlock mutation field
builder.mutationField('addBlock', (t) =>
  t.prismaField({
    description: "Adds a new block to the end of the specified survey's block list. Use 'updateBlock' to change its position later.",
    type: 'Block', // Return type is the created Block object
    args: {
      input: t.arg({ type: AddBlockInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const surveyId = parseInt(String(args.input.surveyId), 10);
      const { name } = args.input;

      // Basic validation
      if (!name) {
        throw new Error("Block name is required.");
      }

      // Determine the next orderIndex
      const existingBlocksCount = await ctx.prisma.block.count({
        where: { survey_id: surveyId },
      });
      const orderIndex = existingBlocksCount; // 0-based index for the next item

      // Create the block using Prisma client
      const newBlock = await ctx.prisma.block.create({
        data: {
          name,
          survey_id: surveyId,
          order_index: orderIndex,
          // skip_logic can be null/undefined by default
        },
        // Include relations based on the GraphQL query selection set
        ...query,
      });

      return newBlock;
    },
  })
);

// Define the input type for updateBlock
const UpdateBlockInput = builder.inputType('UpdateBlockInput', {
  fields: (t) => ({
    name: t.string({ description: "The updated name of the block." }),
    skipLogic: t.string({ description: "The updated skip logic expression (nullable)." }),
    orderIndex: t.int({ 
      description: "The desired 0-based position for the block within its survey. Providing this will shift other blocks accordingly.",
    }),
  }),
});

// Define the updateBlock mutation field
builder.mutationField('updateBlock', (t) =>
  t.prismaField({
    type: 'Block', // Return type is the updated Block object
    args: {
      id: t.arg.id({ required: true, description: "The ID of the block to update." }),
      input: t.arg({ type: UpdateBlockInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const blockId = parseInt(String(args.id), 10);
      const { name, skipLogic, orderIndex: newOrderIndex } = args.input;

      // --- Simple Update Data (without order) ---
      const simpleUpdateData: { name?: string; skip_logic?: string | null } = {};
      let needsReorder = false;

      if (name !== null && name !== undefined) {
        simpleUpdateData.name = name;
      }
      // Allow setting skipLogic to null explicitly
      if (skipLogic !== undefined) { 
        simpleUpdateData.skip_logic = skipLogic;
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
          // 1. Fetch the block being moved and its survey context
          const blockToMove = await tx.block.findUnique({
            where: { id: blockId },
            select: { order_index: true, survey_id: true },
          });

          if (!blockToMove) {
            throw new Error(`Block with ID ${blockId} not found.`);
          }

          const currentOrderIndex = blockToMove.order_index;
          const surveyId = blockToMove.survey_id;

          // No change in order needed
          if (newOrderIndex === currentOrderIndex) {
             return tx.block.update({ 
               where: { id: blockId }, 
               data: { ...simpleUpdateData }, // Apply simple updates if any
               ...query 
             });
          }

          // 2. Fetch all sibling blocks for bounds checking and shifting
          const siblingBlocks = await tx.block.findMany({
            where: { survey_id: surveyId },
            select: { id: true, order_index: true },
            orderBy: { order_index: 'asc' },
          });

          // 3. Validate new index
          if (newOrderIndex >= siblingBlocks.length) {
            throw new Error(`Invalid orderIndex ${newOrderIndex}. Maximum allowed index is ${siblingBlocks.length - 1}.`);
          }

          // 4. Determine direction and update siblings
          const updates: Promise<any>[] = [];

          if (newOrderIndex < currentOrderIndex) {
            // Moving UP (towards start): Increment indices from newIndex up to (but not including) oldIndex
            updates.push(tx.block.updateMany({
              where: {
                survey_id: surveyId,
                order_index: { gte: newOrderIndex, lt: currentOrderIndex },
              },
              data: {
                order_index: { increment: 1 },
              },
            }));
          } else { // newOrderIndex > currentOrderIndex
            // Moving DOWN (towards end): Decrement indices from (oldIndex + 1) up to newIndex
            updates.push(tx.block.updateMany({
              where: {
                survey_id: surveyId,
                order_index: { gt: currentOrderIndex, lte: newOrderIndex },
              },
              data: {
                order_index: { decrement: 1 },
              },
            }));
          }
          
          // 5. Update the target block itself (name, skipLogic, and final orderIndex)
          updates.push(tx.block.update({
             where: { id: blockId },
             data: {
               ...simpleUpdateData,
               order_index: newOrderIndex,
             },
             ...query, // Apply selection set to the final update result
          }));

          // Execute sibling updates first, then the final target update
          await Promise.all(updates.slice(0, -1)); 
          const finalUpdatedBlock = await updates[updates.length - 1];

          return finalUpdatedBlock;
        });

      } else {
        // --- Simple Update Only (no orderIndex change) ---
        if (Object.keys(simpleUpdateData).length === 0) {
           // If only ID was provided, maybe fetch and return the block?
           // Or throw error? Let's throw for now.
           throw new Error("No update data provided.");
        }
        return ctx.prisma.block.update({
          where: { id: blockId },
          data: simpleUpdateData,
          ...query,
        });
      }
    },
  })
);

// Define the deleteBlock mutation field
builder.mutationField('deleteBlock', (t) =>
  t.prismaField({
    type: 'Block', // Return type is the deleted Block object
    args: {
      id: t.arg.id({ required: true, description: "The ID of the block to delete." }),
    },
    resolve: async (query, _root, args, ctx) => {
      const blockId = parseInt(String(args.id), 10);

      return ctx.prisma.$transaction(async (tx) => {
        // 1. Fetch the block to get its data and context before deleting
        // Include ...query here to ensure we fetch fields requested by the client
        const blockToDelete = await tx.block.findUnique({
          where: { id: blockId },
          ...query, // Fetch fields based on the GraphQL query selection set
        });

        if (!blockToDelete) {
          throw new Error(`Block with ID ${blockId} not found.`);
        }

        // Store necessary info for reordering before deleting
        const deletedOrderIndex = blockToDelete.order_index;
        const surveyId = blockToDelete.survey_id;

        // 2. Delete the block
        await tx.block.delete({ where: { id: blockId } });

        // 3. Update the order index of subsequent blocks in the same survey
        await tx.block.updateMany({
          where: {
            survey_id: surveyId,
            order_index: { gt: deletedOrderIndex },
          },
          data: {
            order_index: { decrement: 1 },
          },
        });

        // 4. Return the data of the block that was deleted (fetched before deletion)
        return blockToDelete;
      });
    },
  })
);