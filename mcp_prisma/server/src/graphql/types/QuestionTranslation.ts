import { builder } from '../../builder-instance.js';

// Define the QuestionTranslation object type
builder.prismaObject('QuestionTranslation', {
  description: "Translations for a Question's fields.",
  fields: (t) => ({
    questionId: t.exposeInt('question_id'),
    languageCode: t.exposeString('language_code'),
    text: t.exposeString('text'), // Translated question text
    question: t.relation('question'), // Relation back to Question
  }),
}); 