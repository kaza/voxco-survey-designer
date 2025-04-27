// prisma/seed.ts
// import { PrismaClient, Question, ChoiceListItem } from '../src/generated/prisma.js';
import { PrismaClient, Question, ChoiceListItem } from '@prisma/client';
// Import model types specifically for type annotations

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
  const q1_s1 = survey1.blocks[0].questions.find((q: Question) => q.name === 'Q1_Rating');
  const q2_s1 = survey1.blocks[0].questions.find((q: Question) => q.name === 'Q2_Comment');
  const choice_good_s1 = q1_s1?.choice_items.find((c: ChoiceListItem) => c.value === 'Good');
  const choice_avg_s1 = q1_s1?.choice_items.find((c: ChoiceListItem) => c.value === 'Average');
  const choice_poor_s1 = q1_s1?.choice_items.find((c: ChoiceListItem) => c.value === 'Poor');

  if (q1_s1 && q2_s1 && choice_good_s1 && choice_avg_s1 && choice_poor_s1) {
    // Create Survey Translations
    await prisma.surveyTranslation.createMany({
      data: [
        { survey_id: survey1.id, language_code: 'en', name: 'Customer Feedback EN/FR' },
        { survey_id: survey1.id, language_code: 'fr', name: 'Feedback Client FR/EN' },
      ],
    });
    // Create Block Translations
    await prisma.blockTranslation.createMany({
      data: [
        { block_id: survey1.blocks[0].id, language_code: 'en', name: 'Feedback Block' },
        { block_id: survey1.blocks[0].id, language_code: 'fr', name: 'Bloc de Feedback' },
      ],
    });
    // Create Question Translations
    await prisma.questionTranslation.createMany({
        data: [
          { question_id: q1_s1.id, language_code: 'en', text: 'How was your experience?' },
          { question_id: q1_s1.id, language_code: 'fr', text: 'Comment était votre expérience?' },
          { question_id: q2_s1.id, language_code: 'en', text: 'Any additional comments?' },
          { question_id: q2_s1.id, language_code: 'fr', text: 'Des commentaires additionnels?' },
        ]
    });
    // Create ChoiceListItem Translations
    await prisma.choiceListItemTranslation.createMany({
        data: [
          { choice_list_item_id: choice_good_s1.id, language_code: 'en', label: 'Good' },
          { choice_list_item_id: choice_good_s1.id, language_code: 'fr', label: 'Bon' },
          { choice_list_item_id: choice_avg_s1.id, language_code: 'en', label: 'Average' },
          { choice_list_item_id: choice_avg_s1.id, language_code: 'fr', label: 'Moyen' },
          { choice_list_item_id: choice_poor_s1.id, language_code: 'en', label: 'Poor' },
          { choice_list_item_id: choice_poor_s1.id, language_code: 'fr', label: 'Pauvre' },
        ]
    });

    console.log(`Added Translations for Survey 1`);
  } else {
     console.warn(`Could not find all elements for Survey 1 translations.`);
  }


  // Translations for Survey 2
  const q1_s2 = survey2.blocks[0].questions.find((q: Question) => q.name === 'Q1_Interest');
  const choice_yes_s2 = q1_s2?.choice_items.find((c: ChoiceListItem) => c.value === 'Yes');
  const choice_no_s2 = q1_s2?.choice_items.find((c: ChoiceListItem) => c.value === 'No');

  if (q1_s2 && choice_yes_s2 && choice_no_s2) {
    // Create Survey Translations
    await prisma.surveyTranslation.createMany({
      data: [
        { survey_id: survey2.id, language_code: 'en', name: 'Product Interest EN/DE' },
        { survey_id: survey2.id, language_code: 'de', name: 'Produktinteresse DE/EN' },
      ],
    });
    // Create Question Translations
    await prisma.questionTranslation.createMany({
        data: [
          { question_id: q1_s2.id, language_code: 'en', text: 'Are you interested in our new product?' },
          { question_id: q1_s2.id, language_code: 'de', text: 'Sind Sie an unserem neuen Produkt interessiert?' },
        ]
    });
    // Create ChoiceListItem Translations
    await prisma.choiceListItemTranslation.createMany({
        data: [
          { choice_list_item_id: choice_yes_s2.id, language_code: 'en', label: 'Yes' },
          { choice_list_item_id: choice_yes_s2.id, language_code: 'de', label: 'Ja' },
          { choice_list_item_id: choice_no_s2.id, language_code: 'en', label: 'No' },
          { choice_list_item_id: choice_no_s2.id, language_code: 'de', label: 'Nein' },
        ]
    });
    console.log(`Added Translations for Survey 2`);
  } else {
    console.warn(`Could not find all elements for Survey 2 translations.`);
  }

  // Translations for Survey 3
  const q1_s3 = survey3.blocks[0].questions.find((q: Question) => q.name === 'Q1_Age');
  if (q1_s3) {
    // Create Survey Translations
    await prisma.surveyTranslation.createMany({
      data: [
        { survey_id: survey3.id, language_code: 'en', name: 'Simple English Survey' },
      ],
    });
    // Create Question Translations
    await prisma.questionTranslation.createMany({
        data: [
          { question_id: q1_s3.id, language_code: 'en', text: 'What is your age?' },
        ]
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

