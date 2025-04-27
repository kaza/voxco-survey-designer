import { builder } from '../../builder-instance.js';

// Define the SurveyLanguage object type
builder.prismaObject('SurveyLanguage', {
  description: "Languages available for a specific survey.",
  fields: (t) => ({
    // Expose component fields of the composite primary key
    surveyId: t.exposeInt('survey_id'),
    languageCode: t.exposeString('language_code'),

    // Expose the relation back to Survey
    survey: t.relation('survey'),
  }),
}); 