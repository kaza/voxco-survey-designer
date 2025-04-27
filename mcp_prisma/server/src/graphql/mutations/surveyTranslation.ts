import { builder } from '../../builder-instance.js';
import { prisma } from '../../prisma-client.js'; // Import prisma client
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Define the input type for updateSurveyTranslation
const UpdateSurveyTranslationInput = builder.inputType('UpdateSurveyTranslationInput', {
  fields: (t) => ({
    title: t.string({ description: "The updated translated title for the survey." }),
    description: t.string({ description: "The updated translated description for the survey." }),
    // Add other translatable fields if needed later
  }),
});

// Define the updateSurveyTranslation mutation field
builder.mutationField('updateSurveyTranslation', (t) =>
  t.prismaField({
    description: "Updates the translatable fields (e.g., title, description) for a specific survey translation.",
    type: 'SurveyTranslation', // Return type
    args: {
      surveyId: t.arg.int({ required: true, description: "The ID of the survey." }),
      languageCode: t.arg.string({ required: true, description: "The language code of the translation to update (e.g., 'en')." }),
      input: t.arg({ type: UpdateSurveyTranslationInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { surveyId, languageCode } = args;
      const { title, description } = args.input;

      // Prepare update data, only including fields that were provided
      const updateData: { title?: string; description?: string } = {};
      if (title !== null && title !== undefined) {
        updateData.title = title;
      }
      if (description !== null && description !== undefined) {
        updateData.description = description;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("At least one field (title or description) must be provided for updating the translation.");
      }

      try {
        // Use the composite key to find and update the specific translation
        const updatedTranslation = await ctx.prisma.surveyTranslation.update({
          where: {
            survey_id_language_code: { // Prisma's convention for composite keys
              survey_id: surveyId,
              language_code: languageCode,
            },
          },
          data: updateData,
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
        throw new Error(`Failed to update survey translation: ${(error as Error).message}`);
      }
    },
  })
); 