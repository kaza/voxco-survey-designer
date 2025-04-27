import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import DirectivesPlugin from '@pothos/plugin-directives';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import PrismaUtilsPlugin from '@pothos/plugin-prisma-utils';
import { DateTimeResolver } from 'graphql-scalars';
import { GraphQLJSON } from 'graphql-scalars';
import { PrismaClient } from '@prisma/client';

// Export Prisma client for convenience if needed elsewhere, or keep it scoped
export const prisma = new PrismaClient({});

// Define the context type based on the Prisma Client
export interface PothosContext {
  prisma: PrismaClient;
}

// Create and export the Pothos Schema Builder instance
export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Scalars: {
    DateTime: {
      Input: Date;
      Output: Date;
    };
    JSON: {
      Input: any;
      Output: any;
    };
  };
  Context: PothosContext;
}>({
  plugins: [
    PrismaPlugin,
    DirectivesPlugin,
    SimpleObjectsPlugin,
    PrismaUtilsPlugin
  ],
  prisma: {
    client: prisma,
    exposeDescriptions: true,
    // filterConnectionTotalCount: true,
    // Consider adding onUnusedQuery option for development
    // onUnusedQuery: process.env.NODE_ENV === 'production' ? null : 'warn',
  },
});

// Add the DateTime scalar immediately after builder creation
// This ensures it's available before types/fields try to use it
builder.addScalarType("DateTime", DateTimeResolver, {});

// Add JSON scalar type
builder.addScalarType("JSON", GraphQLJSON, {}); 