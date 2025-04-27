import { builder } from '../../builder-instance.js';

// Define the QuestionSetting object type
builder.prismaObject('QuestionSetting', {
  description: "Settings specific to a question, represented as key-value pairs.",
  fields: (t) => ({
    // Expose component fields of the composite primary key
    questionId: t.exposeInt('question_id'),
    settingKey: t.exposeString('setting_key'),

    // Expose other fields
    settingValue: t.exposeString('setting_value', { nullable: true }), // Prisma type is String?

    // Expose the relation back to Question
    question: t.relation('question'),

    // Omit translations relation for now
    // translations: t.relation('translations')
  }),
}); 