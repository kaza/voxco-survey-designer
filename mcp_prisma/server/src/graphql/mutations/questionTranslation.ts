import { builder } from '../../builder-instance.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Define the input type for createQuestionTranslation
const CreateQuestionTranslationInput = builder.inputType('CreateQuestionTranslationInput', {
  fields: (t) => ({
    text: t.string({ required: true, description: "The translated text for the question." }),
  }),
});

// Define the input type for updateQuestionTranslation
const UpdateQuestionTranslationInput = builder.inputType('UpdateQuestionTranslationInput', {
  fields: (t) => ({
    text: t.string({ required: true, description: "The updated translated text for the question." }),
  }),
});

// Define the createQuestionTranslation mutation field
builder.mutationField('createQuestionTranslation', (t) =>
  t.prismaField({
    description: "Creates a new translation for a specific question.",
    type: 'QuestionTranslation',
    args: {
      questionId: t.arg.int({ required: true, description: "The ID of the question." }),
      languageCode: t.arg.string({ required: true, description: "The language code of the translation (e.g., 'en')." }),
      input: t.arg({ type: CreateQuestionTranslationInput, required: true, description: "The translation data for the question." }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { questionId, languageCode } = args;
      const { text } = args.input;

      if (!text) {
        throw new Error("Text is required for creating a translation.");
      }

      try {
        // First check if the translation already exists
        const existingTranslation = await ctx.prisma.questionTranslation.findUnique({
          where: {
            question_id_language_code: {
              question_id: questionId,
              language_code: languageCode,
            },
          },
        });

        if (existingTranslation) {
          throw new Error(`Translation for question ID ${questionId} in language ${languageCode} already exists.`);
        }

        // Create the new translation
        const newTranslation = await ctx.prisma.questionTranslation.create({
          data: {
            question: {
              connect: {
                id: questionId,
              },
            },
            language_code: languageCode,
            text: text,
          },
          ...query,
        });

        return newTranslation;
      } catch (error: unknown) {
        if (error instanceof PrismaClientKnownRequestError) {
          // Preserve the original Prisma error
          throw error;
        }
        // For other types of errors, still throw a sensible error
        throw new Error(`Failed to create translation: ${(error as Error).message}`);
      }
    },
  })
);

// Define the updateQuestionTranslation mutation field
builder.mutationField('updateQuestionTranslation', (t) =>
  t.prismaField({
    description: "Updates the text for a specific question translation.",
    type: 'QuestionTranslation', // Return type is the updated QuestionTranslation object
    args: {
      questionId: t.arg.int({ required: true, description: "The ID of the question." }),
      languageCode: t.arg.string({ required: true, description: "The language code of the translation to update (e.g., 'en')." }),
      input: t.arg({ type: UpdateQuestionTranslationInput, required: true, description: "The updated translation data for the question." }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { questionId, languageCode } = args;
      const { text } = args.input;

      if (!text) {
        throw new Error("Text is required for updating the translation.");
      }

      try {
        // Use the composite key to find and update the specific translation
        const updatedTranslation = await ctx.prisma.questionTranslation.update({
          where: {
            question_id_language_code: { // Prisma's convention for composite keys
              question_id: questionId,
              language_code: languageCode,
            },
          },
          data: {
            text: text,
          },
          // Include fields based on the GraphQL query selection set
          ...query,
        });

        return updatedTranslation;
      } catch (error: unknown) {
        // Pass through the original Prisma error for better error details
        if (error instanceof PrismaClientKnownRequestError) {
          // Preserve the original Prisma error
          throw error;
        }
        // For other types of errors, still throw a sensible error
        throw new Error(`Failed to update translation: ${(error as Error).message}`);
      }
    },
  })
); 