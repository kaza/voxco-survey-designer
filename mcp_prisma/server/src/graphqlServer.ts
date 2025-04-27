import type { Express } from "express";
import { PrismaClient } from "@prisma/client";
import { createYoga } from "graphql-yoga";
import { getTimestamp } from "./utils/timestamp.js"; // Import the utility function
import { schema } from './builder.js'; 

// ++ Define the Yoga server type ++
type YogaServer = ReturnType<typeof createYoga<{ context: { prisma: PrismaClient } }>>;

// ++ Update function signature to return the Yoga server instance ++
export async function setupGraphQLServer(app: Express, prisma: PrismaClient): Promise<YogaServer> {
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

  return graphqlServer; // ++ Return the Yoga server instance ++
} 