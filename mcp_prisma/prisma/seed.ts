// prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma';
// Import model types specifically for type annotations
import type { Question, ChoiceListItem } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Survey 1: Customer Feedback (EN/FR) ---
  const survey1 = await prisma.survey.create({
    data: {
      name: 'Customer Feedback EN/FR',
      schema_version: '2.0.0',
      config_version: 1,
      use_s2: true,
      default_language: 'en',
      languages: {
        create: [{ language_code: 'en' }, { language_code: 'fr' }],
      },
      settings: {
        create: [
          { setting_key: 'ALLOW_BACKWARD_JUMPS', setting_value: 'true' },
          { setting_key: 'SURVEY_ACCESS_MODE', setting_value: 'OpenAccess' },
        ],
      },
      blocks: {
        create: [
          {
            name: 'Feedback Block',
            order_index: 0,
            settings: {
              create: [{ setting_key: 'Description', setting_value: 'Main feedback section' }],
            },
            questions: {
              create: [
                {
                  name: 'Q1_Rating',
                  type: 'RadioButton',
                  order_index: 0,
                  settings: {
                    create: [{ setting_key: 'AnswerRequired', setting_value: 'Yes' }],
                  },
                  choice_items: {
                    create: [
                      { value: 'Good', position: 0, setting_exclusive: false, setting_visible: true },
                      { value: 'Average', position: 1, setting_exclusive: false, setting_visible: true },
                      { value: 'Poor', position: 2, setting_exclusive: false, setting_visible: true },
                    ],
                  },
                },
                {
                  name: 'Q2_Comment',
                  type: 'OpenEnd', // Assuming an open-end type exists
                  order_index: 1,
                  is_page_break: true,
                }
              ],
            },
          },
        ],
      },
    },
    // Include nested relations to get their IDs for translation linking
    include: {
      settings: true,
      languages: true,
      blocks: {
        include: {
          settings: true,
          questions: {
            include: {
              settings: true,
              choice_items: true,
            },
          },
        },
      },
    },
  });
  console.log(`Created Survey 1 with id: ${survey1.id}`);

  // --- Survey 2: Product Interest (EN/DE) ---
  const survey2 = await prisma.survey.create({
    data: {
      name: 'Product Interest EN/DE',
      schema_version: '2.0.0',
      config_version: 2,
      use_s2: false,
      default_language: 'en',
      languages: {
        create: [{ language_code: 'en' }, { language_code: 'de' }],
      },
      settings: {
        create: [
          { setting_key: 'ALLOW_SAVE_AND_CONTINUE', setting_value: 'NoCookie' },
        ],
      },
      blocks: {
        create: [
          {
            name: 'Product Info',
            order_index: 0,
            questions: {
              create: [
                {
                  name: 'Q1_Interest',
                  type: 'RadioButton',
                  order_index: 0,
                  choice_items: {
                    create: [
                      { value: 'Yes', position: 0 },
                      { value: 'No', position: 1 },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: { // Include relations to get IDs
      blocks: { include: { questions: { include: { choice_items: true } } } },
      languages: true,
      settings: true,
    }
  });
  console.log(`Created Survey 2 with id: ${survey2.id}`);

  // --- Survey 3: Simple English Survey (EN Only) ---
  const survey3 = await prisma.survey.create({
    data: {
      name: 'Simple English Survey',
      schema_version: '2.0.0',
      config_version: 1,
      use_s2: true,
      default_language: 'en',
      languages: {
        create: [{ language_code: 'en' }],
      },
      blocks: {
        create: [
          {
            name: 'General',
            order_index: 0,
            questions: {
              create: [
                {
                  name: 'Q1_Age',
                  type: 'NumericAnswer',
                  order_index: 0,
                  // No choices needed
                },
              ],
            },
          },
        ],
      },
    },
    include: { // Include relations to get IDs
      blocks: { include: { questions: true } },
      languages: true,
    }
  });
  console.log(`Created Survey 3 with id: ${survey3.id}`);


  // --- Add Translations Separately ---
  // This approach is often clearer for polymorphic relations

  // Translations for Survey 1
  const q1_s1 = survey1.blocks[0].questions.find(q => q.name === 'Q1_Rating');
  const q2_s1 = survey1.blocks[0].questions.find(q => q.name === 'Q2_Comment');
  const choice_good_s1 = q1_s1?.choice_items.find(c => c.value === 'Good');
  const choice_avg_s1 = q1_s1?.choice_items.find(c => c.value === 'Average');
  const choice_poor_s1 = q1_s1?.choice_items.find(c => c.value === 'Poor');

  if (q1_s1 && q2_s1 && choice_good_s1 && choice_avg_s1 && choice_poor_s1) {
    await prisma.translation.createMany({
      data: [
        // Survey Name
        { element_type: 'Survey', element_id: survey1.id, surveyId: survey1.id, text_key: 'name', language_code: 'en', translated_text: 'Customer Feedback EN/FR' },
        { element_type: 'Survey', element_id: survey1.id, surveyId: survey1.id, text_key: 'name', language_code: 'fr', translated_text: 'Feedback Client FR/EN' },
        // Block Name
        { element_type: 'Block', element_id: survey1.blocks[0].id, blockId: survey1.blocks[0].id, text_key: 'name', language_code: 'en', translated_text: 'Feedback Block' },
        { element_type: 'Block', element_id: survey1.blocks[0].id, blockId: survey1.blocks[0].id, text_key: 'name', language_code: 'fr', translated_text: 'Bloc de Feedback' },
        // Question 1 Text
        { element_type: 'Question', element_id: q1_s1.id, questionId: q1_s1.id, text_key: 'TEXT', language_code: 'en', translated_text: 'How was your experience?' },
        { element_type: 'Question', element_id: q1_s1.id, questionId: q1_s1.id, text_key: 'TEXT', language_code: 'fr', translated_text: 'Comment était votre expérience?' },
        // Question 2 Text
        { element_type: 'Question', element_id: q2_s1.id, questionId: q2_s1.id, text_key: 'TEXT', language_code: 'en', translated_text: 'Any additional comments?' },
        { element_type: 'Question', element_id: q2_s1.id, questionId: q2_s1.id, text_key: 'TEXT', language_code: 'fr', translated_text: 'Des commentaires additionnels?' },
        // Choice Texts for Q1
        { element_type: 'ChoiceListItem', element_id: choice_good_s1.id, choiceListItemId: choice_good_s1.id, text_key: 'TEXT', language_code: 'en', translated_text: 'Good' },
        { element_type: 'ChoiceListItem', element_id: choice_good_s1.id, choiceListItemId: choice_good_s1.id, text_key: 'TEXT', language_code: 'fr', translated_text: 'Bon' },
        { element_type: 'ChoiceListItem', element_id: choice_avg_s1.id, choiceListItemId: choice_avg_s1.id, text_key: 'TEXT', language_code: 'en', translated_text: 'Average' },
        { element_type: 'ChoiceListItem', element_id: choice_avg_s1.id, choiceListItemId: choice_avg_s1.id, text_key: 'TEXT', language_code: 'fr', translated_text: 'Moyen' },
        { element_type: 'ChoiceListItem', element_id: choice_poor_s1.id, choiceListItemId: choice_poor_s1.id, text_key: 'TEXT', language_code: 'en', translated_text: 'Poor' },
        { element_type: 'ChoiceListItem', element_id: choice_poor_s1.id, choiceListItemId: choice_poor_s1.id, text_key: 'TEXT', language_code: 'fr', translated_text: 'Pauvre' },
      ],
    });
    console.log(`Added Translations for Survey 1`);
  } else {
     console.warn(`Could not find all elements for Survey 1 translations.`);
  }


  // Translations for Survey 2
  const q1_s2 = survey2.blocks[0].questions.find(q => q.name === 'Q1_Interest');
  const choice_yes_s2 = q1_s2?.choice_items.find(c => c.value === 'Yes');
  const choice_no_s2 = q1_s2?.choice_items.find(c => c.value === 'No');

  if (q1_s2 && choice_yes_s2 && choice_no_s2) {
    await prisma.translation.createMany({
      data: [
        // Survey Name
        { element_type: 'Survey', element_id: survey2.id, surveyId: survey2.id, text_key: 'name', language_code: 'en', translated_text: 'Product Interest EN/DE' },
        { element_type: 'Survey', element_id: survey2.id, surveyId: survey2.id, text_key: 'name', language_code: 'de', translated_text: 'Produktinteresse DE/EN' },
        // Question 1 Text
        { element_type: 'Question', element_id: q1_s2.id, questionId: q1_s2.id, text_key: 'TEXT', language_code: 'en', translated_text: 'Are you interested in our new product?' },
        { element_type: 'Question', element_id: q1_s2.id, questionId: q1_s2.id, text_key: 'TEXT', language_code: 'de', translated_text: 'Sind Sie an unserem neuen Produkt interessiert?' },
        // Choice Texts for Q1
        { element_type: 'ChoiceListItem', element_id: choice_yes_s2.id, choiceListItemId: choice_yes_s2.id, text_key: 'TEXT', language_code: 'en', translated_text: 'Yes' },
        { element_type: 'ChoiceListItem', element_id: choice_yes_s2.id, choiceListItemId: choice_yes_s2.id, text_key: 'TEXT', language_code: 'de', translated_text: 'Ja' },
        { element_type: 'ChoiceListItem', element_id: choice_no_s2.id, choiceListItemId: choice_no_s2.id, text_key: 'TEXT', language_code: 'en', translated_text: 'No' },
        { element_type: 'ChoiceListItem', element_id: choice_no_s2.id, choiceListItemId: choice_no_s2.id, text_key: 'TEXT', language_code: 'de', translated_text: 'Nein' },
      ],
    });
    console.log(`Added Translations for Survey 2`);
  } else {
    console.warn(`Could not find all elements for Survey 2 translations.`);
  }

  // Translations for Survey 3
  const q1_s3 = survey3.blocks[0].questions.find(q => q.name === 'Q1_Age');
  if (q1_s3) {
    await prisma.translation.createMany({
      data: [
        // Survey Name
        { element_type: 'Survey', element_id: survey3.id, surveyId: survey3.id, text_key: 'name', language_code: 'en', translated_text: 'Simple English Survey' },
        // Question 1 Text
        { element_type: 'Question', element_id: q1_s3.id, questionId: q1_s3.id, text_key: 'TEXT', language_code: 'en', translated_text: 'What is your age?' },
      ],
    });
    console.log(`Added Translations for Survey 3`);
  } else {
     console.warn(`Could not find all elements for Survey 3 translations.`);
  }


  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

