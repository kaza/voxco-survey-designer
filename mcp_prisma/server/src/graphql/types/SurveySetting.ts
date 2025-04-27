import { builder } from '../../builder-instance.js';

// Define the SurveySetting object type
builder.prismaObject('SurveySetting', {
  description: "Settings specific to a survey, represented as key-value pairs.",
  fields: (t) => ({
    // Expose component fields of the composite primary key
    surveyId: t.exposeInt('survey_id'),
    settingKey: t.exposeString('setting_key'),

    // Expose other fields
    settingValue: t.exposeString('setting_value', { nullable: true }), // Prisma type is String?

    // Expose the relation back to Survey
    survey: t.relation('survey'),

    // Omit translations relation for now, requires specific handling
    // translations: t.relation('translations')
  }),
}); 