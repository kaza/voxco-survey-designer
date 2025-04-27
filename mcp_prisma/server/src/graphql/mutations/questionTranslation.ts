import { builder } from '../../builder-instance.js';
import { prisma } from '../../prisma-client.js'; // Import prisma client

// Define the input type for updateQuestionTranslation
const UpdateQuestionTranslationInput = builder.inputType('UpdateQuestionTranslationInput', {
  fields: (t) => ({
    text: t.string({ required: true, description: "The updated translated text for the question." }),
  }),
});

// Define the updateQuestionTranslation mutation field
builder.mutationField('updateQuestionTranslation', (t) =>
  t.prismaField({
    description: "Updates the text for a specific question translation.",
    type: 'QuestionTranslation', // Return type is the updated QuestionTranslation object
    args: {
      questionId: t.arg.int({ required: true, description: "The ID of the question." }),
      languageCode: t.arg.string({ required: true, description: "The language code of the translation to update (e.g., 'en')." }),
      input: t.arg({ type: UpdateQuestionTranslationInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { questionId, languageCode } = args;
      const { text } = args.input;

      if (!text) {
        throw new Error("Text is required for updating the translation.");
      }

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

      if (!updatedTranslation) {
          throw new Error(`QuestionTranslation not found for questionId: ${questionId} and languageCode: ${languageCode}`);
      }

      return updatedTranslation;
    },
  })
); 