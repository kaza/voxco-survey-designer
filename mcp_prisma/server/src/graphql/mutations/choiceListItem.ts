import { builder } from '../../builder-instance.js';

// Define the input type for addChoiceListItem
const AddChoiceListItemInput = builder.inputType('AddChoiceListItemInput', {
  fields: (t) => ({
    questionId: t.id({ required: true, description: "The ID of the question to add this choice item to." }),
    value: t.string({ required: true, description: "The internal value/code for this choice." }),
    label: t.string({ required: true, description: "The initial display label for this choice." }),
    languageCode: t.string({ required: true, description: "The language code for the initial label." }),
    // Optional settings
    settingVisible: t.boolean({ description: "Initial visibility setting." }),
    settingExclusive: t.boolean({ description: "Initial exclusivity setting." }),
    // Position is determined automatically
  }),
});

// Define the addChoiceListItem mutation field
builder.mutationField('addChoiceListItem', (t) =>
  t.prismaField({
    description: "Adds a new choice item to the end of the specified question's list, along with its initial translation.",
    type: 'ChoiceListItem', // Return type is the created ChoiceListItem object
    args: {
      input: t.arg({ type: AddChoiceListItemInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const questionId = parseInt(String(args.input.questionId), 10);
      const { value, label, languageCode, settingVisible, settingExclusive } = args.input;

      // Basic validation
      if (!value || !label || !languageCode) {
        throw new Error("Question ID, value, label, and languageCode are required.");
      }
      // TODO: Check if question type allows choice items?

      // Determine the next position within the question
      const existingItemsCount = await ctx.prisma.choiceListItem.count({
        where: { question_id: questionId },
      });
      const position = existingItemsCount; // 0-based index

      // Create the choice item and its initial translation
      const newItem = await ctx.prisma.choiceListItem.create({
        data: {
          question_id: questionId,
          value,
          position,
          setting_visible: settingVisible, // Nullable, defaults if undefined
          setting_exclusive: settingExclusive, // Nullable, defaults if undefined
          // Create the initial translation
          translations: {
            create: {
              language_code: languageCode,
              label: label,
            },
          },
        },
        ...query, // Include relations based on the GraphQL query
      });

      return newItem;
    },
  })
);

// --- updateChoiceListItem and deleteChoiceListItem mutations will be added later --- 