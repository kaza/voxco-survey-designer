import { builder } from '../../builder-instance.js';
import { prisma } from '../../prisma-client.js'; // Import prisma client

// Define the input type for updateChoiceListItemTranslation
const UpdateChoiceListItemTranslationInput = builder.inputType('UpdateChoiceListItemTranslationInput', {
  fields: (t) => ({
    text: t.string({ required: true, description: "The updated translated text for the choice list item." }),
  }),
});

// Define the updateChoiceListItemTranslation mutation field
builder.mutationField('updateChoiceListItemTranslation', (t) =>
  t.prismaField({
    description: "Updates the text for a specific choice list item translation.",
    type: 'ChoiceListItemTranslation', // Return type
    args: {
      choiceListItemId: t.arg.int({ required: true, description: "The ID of the choice list item." }),
      languageCode: t.arg.string({ required: true, description: "The language code of the translation to update (e.g., 'en')." }),
      input: t.arg({ type: UpdateChoiceListItemTranslationInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { choiceListItemId, languageCode } = args;
      const { text } = args.input;

      if (!text) {
        throw new Error("Text is required for updating the translation.");
      }

      // Use the composite key to find and update the specific translation
      const updatedTranslation = await ctx.prisma.choiceListItemTranslation.update({
        where: {
          choice_list_item_id_language_code: { // Prisma's convention for composite keys
            choice_list_item_id: choiceListItemId,
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
          throw new Error(`ChoiceListItemTranslation not found for choiceListItemId: ${choiceListItemId} and languageCode: ${languageCode}`);
      }

      return updatedTranslation;
    },
  })
); 