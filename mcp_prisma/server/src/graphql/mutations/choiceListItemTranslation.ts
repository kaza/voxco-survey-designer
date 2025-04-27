import { builder } from '../../builder-instance.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Define the input type for createChoiceListItemTranslation
const CreateChoiceListItemTranslationInput = builder.inputType('CreateChoiceListItemTranslationInput', {
  fields: (t) => ({
    text: t.string({ required: true, description: "The translated text for the choice list item." }),
  }),
});

// Define the input type for updateChoiceListItemTranslation
const UpdateChoiceListItemTranslationInput = builder.inputType('UpdateChoiceListItemTranslationInput', {
  fields: (t) => ({
    text: t.string({ required: true, description: "The updated translated text for the choice list item." }),
  }),
});

// Define the createChoiceListItemTranslation mutation field
builder.mutationField('createChoiceListItemTranslation', (t) =>
  t.prismaField({
    description: "Creates a new translation for a specific choice list item.",
    type: 'ChoiceListItemTranslation',
    args: {
      choiceListItemId: t.arg.int({ required: true, description: "The ID of the choice list item." }),
      languageCode: t.arg.string({ required: true, description: "The language code of the translation (e.g., 'en')." }),
      input: t.arg({ type: CreateChoiceListItemTranslationInput, required: true, description: "The translation data for the choice list item." }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { choiceListItemId, languageCode } = args;
      const { text } = args.input;

      if (!text) {
        throw new Error("Text is required for creating a translation.");
      }

      try {
        // First check if the translation already exists
        const existingTranslation = await ctx.prisma.choiceListItemTranslation.findUnique({
          where: {
            choice_list_item_id_language_code: {
              choice_list_item_id: choiceListItemId,
              language_code: languageCode,
            },
          },
        });

        if (existingTranslation) {
          throw new Error(`Translation for choice list item ID ${choiceListItemId} in language ${languageCode} already exists.`);
        }

        // Create the new translation
        const newTranslation = await ctx.prisma.choiceListItemTranslation.create({
          data: {
            choice_list_item: {
              connect: {
                id: choiceListItemId,
              },
            },
            language_code: languageCode,
            label: text,
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
        throw new Error(`Failed to create choice list item translation: ${(error as Error).message}`);
      }
    },
  })
);

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

      try {
        // Use the composite key to find and update the specific translation
        const updatedTranslation = await ctx.prisma.choiceListItemTranslation.update({
          where: {
            choice_list_item_id_language_code: { // Prisma's convention for composite keys
              choice_list_item_id: choiceListItemId,
              language_code: languageCode,
            },
          },
          data: {
            label: text,
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
        throw new Error(`Failed to update choice list item translation: ${(error as Error).message}`);
      }
    },
  })
); 