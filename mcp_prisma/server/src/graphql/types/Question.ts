import { builder } from '../../builder-instance.js';

// Define the Question object type
builder.prismaObject('Question', {
  description: "Represents a question within a survey block.",
  fields: (t) => ({
    id: t.exposeID('id'),
    blockId: t.exposeInt('block_id'), // Expose the foreign key
    name: t.exposeString('name'),
    type: t.exposeString('type'), // e.g., 'NumericAnswer', 'RadioButton'
    orderIndex: t.exposeInt('order_index'),
    isPageBreak: t.exposeBoolean('is_page_break', { nullable: true }), // Prisma type is Boolean?

    // Expose relations
    block: t.relation('block'), // Relation back to Block
    settings: t.relation('settings'), // Relation to QuestionSetting
    choiceItems: t.relation('choice_items'), // Relation to ChoiceListItem
    translations: t.relation('translations'), // Expose the relation to QuestionTranslation

    // Omit translations relation for now
    // translations: t.relation('translations')
  }),
}); 