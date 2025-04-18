import type { Express } from "express";
import { PrismaClient } from "@prisma/client";
import { createYoga } from "graphql-yoga";
import { buildSchema } from "type-graphql";
import { resolvers } from "@generated/type-graphql"; // Assuming this path remains correct relative to the build output or tsconfig paths
import { getTimestamp } from "./utils/timestamp.js"; // Import the utility function

async function buildGraphQLSchema() {
  return await buildSchema({ resolvers, validate: false });
}

export async function setupGraphQLServer(app: Express, prisma: PrismaClient) {
  const schema = await buildGraphQLSchema();
  const graphqlServer = createYoga<{
    context: {
      prisma: PrismaClient;
    };
  }>({
    schema,
    context: () => ({ prisma }),
    graphqlEndpoint: '/graphql', // Explicitly set the endpoint
  });

  // @ts-ignore Yoga types might conflict slightly with Express request handler types
  app.use(graphqlServer.graphqlEndpoint, graphqlServer);

  console.log(
    `${getTimestamp()} [Server] GraphQL endpoint setup at ${graphqlServer.graphqlEndpoint}`
  );
} 