import { builder } from '../../builder-instance.js';

// Define the SurveyTranslation object type
builder.prismaObject('SurveyTranslation', {
  description: "Translations for a Survey's fields.",
  fields: (t) => ({
    surveyId: t.exposeInt('survey_id'),
    languageCode: t.exposeString('language_code'),
    name: t.exposeString('name'), // Translated survey name
    survey: t.relation('survey'), // Relation back to Survey
  }),
}); 