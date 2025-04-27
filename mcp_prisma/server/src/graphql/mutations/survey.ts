import { builder } from '../../builder-instance.js'; // Import the shared builder instance


// Define the input type for createSurvey
const CreateSurveyInput = builder.inputType('CreateSurveyInput', {
  fields: (t) => ({
    name: t.string({ required: true, description: "The name of the survey." }),
    defaultLanguage: t.string({ required: true, description: "The default language code (e.g., 'en', 'fr')." }),
    // We can add more fields later as needed, like initial settings or languages
  }),
});

// Define the createSurvey mutation field
builder.mutationField('createSurvey', (t) =>
  t.prismaField({
    type: 'Survey', // Return type is the created Survey object
    args: {
      input: t.arg({ type: CreateSurveyInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const resolverName = 'createSurvey';
      console.time(resolverName);
      console.log(`[Mutation] Starting ${resolverName}...`, { input: args.input });

      try {
        const { name, defaultLanguage } = args.input;

        // Basic validation (can be expanded)
        if (!name || !defaultLanguage) {
          // Consider more specific error types if needed
          throw new Error("Survey name and default language are required.");
        }

        // Create the survey using Prisma client from context
        const newSurvey = await ctx.prisma.survey.create({
          data: {
            name,
            default_language: defaultLanguage,
            config_version: 1, // Default initial config version
            use_s2: false, // Explicitly set required field 'use_s2'
            // Automatically add the default language to the SurveyLanguage table
            languages: {
              create: {
                language_code: defaultLanguage,
              },
            },
          },
          // Include relations based on the GraphQL query selection set
          ...query,
        });

        console.log(`[Mutation] Finished ${resolverName}.`);
        return newSurvey;
      } catch (error) {
        console.error(`[Mutation] Error in ${resolverName}:`, error);
        throw error; // Re-throw the error to be handled by GraphQL server
      } finally {
        console.timeEnd(resolverName);
      }
    },
  })
);

// Define the input type for updateSurvey
const UpdateSurveyInput = builder.inputType('UpdateSurveyInput', {
  fields: (t) => ({
    name: t.string({ description: "The updated name of the survey." }), // Optional field
    defaultLanguage: t.string({ description: "The updated default language code." }), // Optional field
    // Add other fields that can be updated later (e.g., config_version? use_s2?)
  }),
});

// Define the updateSurvey mutation field
builder.mutationField('updateSurvey', (t) =>
  t.prismaField({
    type: 'Survey', // Return type is the updated Survey object
    args: {
      id: t.arg.id({ required: true, description: "The ID of the survey to update." }),
      input: t.arg({ type: UpdateSurveyInput, required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const resolverName = 'updateSurvey';
      console.time(resolverName);
      console.log(`[Mutation] Starting ${resolverName}...`, { id: args.id, input: args.input });

      try {
        const surveyId = parseInt(String(args.id), 10); // Pothos ID is string, Prisma needs Int
        const { name, defaultLanguage } = args.input;

        // Construct the data object carefully to only include provided fields
        const dataToUpdate: { name?: string; default_language?: string } = {};
        if (name !== null && name !== undefined) {
          dataToUpdate.name = name;
        }
        if (defaultLanguage !== null && defaultLanguage !== undefined) {
          // TODO: Add validation? Check if language exists in SurveyLanguage?
          dataToUpdate.default_language = defaultLanguage;
        }

        // Prevent update if no actual data is provided
        if (Object.keys(dataToUpdate).length === 0) {
          throw new Error("No update data provided.");
          // Alternatively, could return the existing survey without updating
          // return ctx.prisma.survey.findUniqueOrThrow({ where: { id: surveyId }, ...query });
        }

        // Update the survey using Prisma client
        const updatedSurvey = await ctx.prisma.survey.update({
          where: {
            id: surveyId,
          },
          data: dataToUpdate,
          // Include relations based on the GraphQL query selection set
          ...query,
        });

        console.log(`[Mutation] Finished ${resolverName}.`);
        return updatedSurvey;
      } catch (error) {
        console.error(`[Mutation] Error in ${resolverName}:`, error);
        throw error;
      } finally {
        console.timeEnd(resolverName);
      }
    },
  })
);

// Define the deleteSurvey mutation field
builder.mutationField('deleteSurvey', (t) =>
  t.prismaField({
    type: 'Survey', // Return the deleted Survey object
    args: {
      id: t.arg.id({ required: true, description: "The ID of the survey to delete." }),
    },
    resolve: async (query, _root, args, ctx) => {
      const resolverName = 'deleteSurvey';
      console.time(resolverName);
      console.log(`[Mutation] Starting ${resolverName}...`, { id: args.id });

      try {
        const surveyId = parseInt(String(args.id), 10);

        // Delete the survey using Prisma client
        // Prisma will handle cascading deletes based on schema relations
        const deletedSurvey = await ctx.prisma.survey.delete({
          where: {
            id: surveyId,
          },
          // We can still use the query selection set here, although the
          // primary use is often just confirming the deletion via the ID.
          // If relations are included, Prisma might need to fetch them before deleting.
          ...query,
        });

        // We could also return a simple boolean or the ID:
        // await ctx.prisma.survey.delete({ where: { id: surveyId } });
        // return true; // or return args.id;

        console.log(`[Mutation] Finished ${resolverName}.`);
        return deletedSurvey;
      } catch (error) {
        console.error(`[Mutation] Error in ${resolverName}:`, error);
        throw error;
      } finally {
        console.timeEnd(resolverName);
      }
    },
  })
);