import { builder } from '../../builder-instance.js';

// Define the ChoiceListItem object type
builder.prismaObject('ChoiceListItem', {
  description: "Represents a single choice item for a question (e.g., an option in a radio button list).",
  fields: (t) => ({
    id: t.exposeID('id'),
    questionId: t.exposeInt('question_id'), // Expose the foreign key
    value: t.exposeString('value'), // The choice value (e.g., the code)
    position: t.exposeInt('position'), // Display order
    settingVisible: t.exposeBoolean('setting_visible', { nullable: true }), // Prisma type is Boolean?
    settingExclusive: t.exposeBoolean('setting_exclusive', { nullable: true }), // Prisma type is Boolean?

    // Expose the relation back to Question
    question: t.relation('question'),
    translations: t.relation('translations'), // Expose the relation to ChoiceListItemTranslation

    // Omit translations relation for now
    // translations: t.relation('translations')
  }),
}); 