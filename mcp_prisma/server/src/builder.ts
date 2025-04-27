// Main schema file - imports builder instance and registers types/queries/mutations

import { builder } from './builder-instance.js'; // Import the initialized builder

// Import types and mutations AFTER builder is created
import './graphql/types/Survey.js'; // Import Survey type definition
import './graphql/types/SurveySetting.js'; // Import SurveySetting type definition
import './graphql/types/SurveyTranslation.js'; // Import SurveyTranslation type definition
import './graphql/types/SurveyLanguage.js'; // Import SurveyLanguage type definition
import './graphql/types/Block.js'; // Import Block type definition
import './graphql/types/BlockTranslation.js'; // Import BlockTranslation type definition
import './graphql/types/BlockSetting.js'; // Import BlockSetting type definition
import './graphql/types/Question.js'; // Import Question type definition
import './graphql/types/QuestionTranslation.js'; // Import QuestionTranslation type definition
import './graphql/types/QuestionSetting.js'; // Import QuestionSetting type definition
import './graphql/types/ChoiceListItem.js'; // Import ChoiceListItem type definition
import './graphql/types/ChoiceListItemTranslation.js'; // Import ChoiceListItemTranslation type definition

// Import mutation files
import './graphql/mutations/survey.js'; // Import to register survey mutations
import './graphql/mutations/block.js'; // Import to register block mutations
import './graphql/mutations/question.js'; // Import to register question mutations
import './graphql/mutations/choiceListItem.js'; // Import to register choice list item mutations
// Import other mutation files here later

// Initialize the Query type (required)
builder.queryType({
  description: "The root query type",
  fields: (t) => ({
    surveys: t.prismaField({
      type: ['Survey'],
      resolve: async (query, _root, _args, ctx) => {
        const resolverName = 'surveys';
        console.time(resolverName);
        console.log(`[Query] Starting ${resolverName}...`, { queryArgs: _args }); // Log args if needed

        try {
          const result = await ctx.prisma.survey.findMany({ ...query });
          console.log(`[Query] Finished ${resolverName}. Found ${result.length} surveys.`);
          return result;
        } catch (error) {
          console.error(`[Query] Error in ${resolverName}:`, error);
          throw error;
        } finally {
          console.timeEnd(resolverName);
        }
      },
    }),
  })
});

// Initialize the Mutation type
builder.mutationType({
  description: "The root mutation type",
  fields: (t) => ({}), // Fields are added by the imported files
});

// Generate the GraphQLSchema object
export const schema = builder.toSchema();