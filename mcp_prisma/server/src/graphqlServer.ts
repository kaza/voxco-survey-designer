import "reflect-metadata"; // Must be imported first
import type { Express } from "express";
import { PrismaClient } from "@prisma/client";
import { createYoga } from "graphql-yoga";
import { buildSchema } from "type-graphql";
import { getTimestamp } from "./utils/timestamp.js";

// Export the function so it can be imported elsewhere
export async function buildGraphQLSchema() {
  try {
    // We need to dynamically import the resolvers to avoid import errors
    // when the generated files don't exist or have issues
    const { resolvers } = await import("./generated/type-graphql/index.js");
    if (!resolvers || resolvers.length === 0) {
      throw new Error("No resolvers found in the generated TypeGraphQL code");
    }
    
    return await buildSchema({
      resolvers,
      validate: false, // Recommended by typegraphql-prisma docs
    });
  } catch (error) {
    console.error("Failed to build GraphQL schema:", error);
    throw error;
  }
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