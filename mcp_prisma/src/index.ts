import "reflect-metadata";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createYoga } from "graphql-yoga";
import fetch from "node-fetch";
import { createServer } from "node:http";
import { resolvers } from "@generated/type-graphql";
import { buildSchema } from "type-graphql";
import { PrismaClient } from "@prisma/client";
import getPort from "get-port";

// GraphQL response interface
interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

// GraphQL Server Setup
async function startGraphQLServer(prisma: PrismaClient, graphqlPort: number) {
  const schema = await buildSchema({
    resolvers,
    validate: false,
  });
  const yoga = createYoga<{
    context: {
      prisma: PrismaClient;
    };
  }>({
    schema, // from previous step
    context: () => ({ prisma }),
  });

  const graphqlServer = createServer(yoga);

  // Start the GraphQL server
  graphqlServer.listen(graphqlPort, () => {
    console.error(
      `[Server] GraphQL server started at http://localhost:${graphqlPort}/graphql`
    );
  });
}

// MCP Server Setup
function createMcpServer() {
  return new McpServer({
    name: "SurveyDesignerServer",
    version: "0.1.0",
    description: "MCP server for Survey Designer application",
    metadata: {
      projectType: "Survey Designer Application",
      projectDescription: "A survey designer application",
      instructions:
        "You are a survey designer application. Before using the GraphQL tool, always introspect the schema to find the exact query or mutation you need to run. Only then should you execute the operation. Do not guess or assume the schema; always verify first.",
    },
  });
}

function registerGraphQLTool(server: McpServer, getGraphqlPort: () => number) {
  const GraphQLOperationSchema = z.object({
    query: z.string().describe("The GraphQL query or mutation string"),
    variables: z
      .record(z.unknown())
      .optional()
      .describe("Variables for the GraphQL operation"),
  });

  server.tool(
    "graphql",
    "Execute a GraphQL operation, introspect the schema first to find the exact query or mutation you need to run. Only then should you execute the operation. Do not guess or assume the schema; always verify first.",
    GraphQLOperationSchema.shape,
    async ({ query, variables = {} }) => {
      const graphqlPort = getGraphqlPort();
      console.error("[Server] Executing GraphQL operation:", query);

      try {
        const response = await fetch(`http://localhost:${graphqlPort}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            variables,
          }),
        });

        const result = (await response.json()) as GraphQLResponse;

        if (result.errors && result.errors.length > 0) {
          console.error("[Server] GraphQL Error:", result.errors);
          throw new Error(result.errors[0].message);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.data || {}, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `Error executing GraphQL operation: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}

// Main Entrypoint
async function startServers() {
  console.error("[Server] Starting MCP server with stdio transport...");
  const prisma = new PrismaClient();
  const graphqlPort: number = process.env.PORT
    ? Number.parseInt(process.env.PORT, 10)
    : await getPort({ port: 9999 });

  // Start GraphQL server
  await startGraphQLServer(prisma, graphqlPort);

  // MCP server setup
  const server = createMcpServer();
  registerGraphQLTool(server, () => graphqlPort);

  // Start MCP server
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    console.error("[Server] MCP server connected and listening on stdio.");
  } catch (error) {
    console.error("[Server] Failed to connect MCP server:", error);
    process.exit(1); // Exit if connection fails
  }
}

// Start both servers
startServers().catch((err) => {
  console.error("[Server] Error starting servers:", err);
  process.exit(1);
});
