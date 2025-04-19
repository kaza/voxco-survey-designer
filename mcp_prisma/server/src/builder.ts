import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated'; // Assuming default location
import { PrismaClient } from '@prisma/client';
import DirectivesPlugin from '@pothos/plugin-directives';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects'; // Often useful with scalars/directives
import { DateTimeResolver } from 'graphql-scalars'; // Import standard DateTime scalar

// Instantiate Prisma Client
export const prisma = new PrismaClient({});

// ++ Define the context type ++
export interface PothosContext {
  prisma: PrismaClient;
}

// Create a new Pothos Schema Builder
export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes; // Link Prisma types to Pothos
  // ++ Add scalar types ++
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
  };
  // ++ Add context type ++
  Context: PothosContext;
}>({
  // ++ Add the necessary plugins ++
  plugins: [PrismaPlugin, DirectivesPlugin, SimpleObjectsPlugin],
  prisma: {
    client: prisma, // Pass the Prisma client instance
    // Expose Prisma models under their names (e.g., builder.prismaObject('User', ...))
    exposeDescriptions: true, // Expose /// comments from schema.prisma as descriptions
    filterConnectionTotalCount: true, // Optional: Enable total count for connections
    // onUnusedQuery: process.env.NODE_ENV === 'production' ? null : 'warn', // Optional: Warn about unused queries
  },
});

// ++ Add the DateTime scalar explicitly ++
builder.addScalarType("DateTime", DateTimeResolver, {});

// ++ Define the Survey object type based on the Prisma model ++
// ++ Moved *before* queryType definition ++
builder.prismaObject('Survey', {
  fields: (t) => ({
    id: t.exposeID('id'), // Expose 'id' as GraphQL ID type
    name: t.exposeString('name'),
    createdAt: t.expose('created_at', { type: 'DateTime' }), // Expose DateTime field
    configVersion: t.exposeInt('config_version'),
   // useS2: t.exposeBoolean('use_s2'),
    defaultLanguage: t.exposeString('default_language'),
    settings: t.relation('settings'), // Expose the relation to SurveySetting
    languages: t.relation('languages'), // Expose the relation to SurveyLanguage
    blocks: t.relation('blocks'), // Expose the relation to Block
  }),
});

// ++ Define the SurveySetting object type ++
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

// ++ Define the SurveyLanguage object type ++
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

// ++ Define the Block object type ++
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

    // Omit translations relation for now
    // translations: t.relation('translations')
  }),
});

// ++ Define the BlockSetting object type ++
builder.prismaObject('BlockSetting', {
  description: "Settings specific to a block, represented as key-value pairs.",
  fields: (t) => ({
    // Expose component fields of the composite primary key
    blockId: t.exposeInt('block_id'),
    settingKey: t.exposeString('setting_key'),

    // Expose other fields
    settingValue: t.exposeString('setting_value', { nullable: true }), // Prisma type is String?

    // Expose the relation back to Block
    block: t.relation('block'),

    // Omit translations relation for now
    // translations: t.relation('translations')
  }),
});

// ++ Define the Question object type ++
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

    // Omit translations relation for now
    // translations: t.relation('translations')
  }),
});

// ++ Define the QuestionSetting object type ++
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

// ++ Define the ChoiceListItem object type ++
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

    // Omit translations relation for now
    // translations: t.relation('translations')
  }),
});

// Initialize the Query type (required)
builder.queryType({
  // Optionally add descriptions for the Query type itself
  description: "The root query type",
  // ++ Add a query field to fetch all surveys ++
  fields: (t) => ({
    surveys: t.prismaField({
      type: ['Survey'], // Return a list of Survey objects
      resolve: (query, _root, _args, ctx) => // Use Prisma context (ctx)
        ctx.prisma.survey.findMany({ ...query }), // Fetch all surveys
    }),
  })
});

// Initialize the Mutation type (optional, but good practice)
// builder.mutationType({
//   description: "The root mutation type",
//   // Add fields here later, e.g., builder.mutationField(...)
// });

// Generate the GraphQLSchema object
export const schema = builder.toSchema(); 