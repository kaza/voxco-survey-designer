import "reflect-metadata"; // Must be imported first
import type { Express } from "express";
import { PrismaClient } from "@prisma/client";
import { createYoga } from "graphql-yoga";
import { buildSchema, NonEmptyArray } from "type-graphql";
import { Query, Resolver, ObjectType, Field } from "type-graphql";

// Define a fallback resolver and type if the generated ones aren't available
@ObjectType()
class Hello {
  @Field(() => String)
  message!: string; // Add explicit type for the Field decorator
}

@Resolver()
class HelloResolver {
  @Query(() => Hello)
  hello() {
    return { message: "Hello World! This is a fallback resolver." };
  }
}

// Fallback resolver to use when generated ones aren't available
const fallbackResolvers = [HelloResolver] as const;

// Try to import the generated resolvers
let resolvers: NonEmptyArray<Function> = fallbackResolvers as unknown as NonEmptyArray<Function>;

// Import this after the fallback resolver is defined
import { getTimestamp } from "./utils/timestamp.js"; // Import the utility function

// A dynamic import needs to be in an async context, so wrap it in an async function
async function loadResolvers(): Promise<NonEmptyArray<Function>> {
  try {
    // Try dynamic import with a more flexible path handling
    const modulePath = "./generated/type-graphql/index.js";
    // @ts-ignore - Ignore module not found error, we handle it in the catch block
    const { resolvers: generatedResolvers } = await import(modulePath);
    
    if (Array.isArray(generatedResolvers) && generatedResolvers.length > 0) {
      console.log("Using generated resolvers");
      return generatedResolvers as NonEmptyArray<Function>;
    } else {
      console.warn("Generated resolvers array was empty, using fallback resolver");
      return resolvers;
    }
  } catch (error) {
    console.warn("Could not import generated resolvers, using fallback resolver instead");
    return resolvers;
  }
}

// Export the function so it can be imported elsewhere
export async function buildGraphQLSchema() {
  const schemaResolvers = await loadResolvers();
  return await buildSchema({
    resolvers: schemaResolvers,
    validate: false, // Recommended by typegraphql-prisma docs
  });
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