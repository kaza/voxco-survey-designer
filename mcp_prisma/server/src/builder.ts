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
    useS2: t.exposeBoolean('use_s2'),
    defaultLanguage: t.exposeString('default_language'),
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