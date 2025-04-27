import { builder } from '../../builder-instance.js';

// Define the Block object type
builder.prismaObject('Block', {
  description: "Represents a block or section within a survey.",
  fields: (t) => ({
    id: t.exposeID('id'),
    surveyId: t.exposeInt('survey_id'), // Expose the foreign key
    name: t.exposeString('name'),
    orderIndex: t.exposeInt('order_index'),
    skipLogic: t.exposeString('skip_logic', { nullable: true }), // Prisma type is String?

    // Expose relations
    survey: t.relation('survey'), // Relation back to Survey
    settings: t.relation('settings'), // Relation to BlockSetting
    questions: t.relation('questions'), // Relation to Question
    translations: t.relation('translations'), // Expose the relation to BlockTranslation

    // Omit translations relation for now
    // translations: t.relation('translations')
  }),
}); 