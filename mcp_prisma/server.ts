import "reflect-metadata";
import express from "express";
import type { Request, Response } from "express";
import next from "next";
import { createServer as createHttpServer } from "node:http";
import { createYoga } from "graphql-yoga";
import fetch from "node-fetch";
import { buildSchema } from "type-graphql";
import { PrismaClient } from "@prisma/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import getPort from "get-port";
import { z } from "zod";
import { resolvers } from "./src/generated/type-graphql/index.js";

// GraphQL response interface
interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

// GraphQL Server Setup
async function createGraphQLServer(prisma: PrismaClient) {
  const schema = await buildSchema({ resolvers, validate: false });
  return createYoga<{
    context: {
      prisma: PrismaClient;
    };
  }>({
    schema,
    context: () => ({ prisma }),
  });
}

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
        const response = await fetch(
          `http://localhost:${graphqlPort}/graphql`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              variables,
            }),
          }
        );

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

export const port = process.env.PORT
  ? Number.parseInt(process.env.PORT, 10)
  : await getPort({ port: 3000 });

async function main() {
  console.log("Starting server...");
  const dev = process.env.NODE_ENV !== "production";
  const app = next({ dev });
  const handle = app.getRequestHandler();
  const prisma = new PrismaClient();

  // Dynamic port selection

  const graphqlPort = port; // Use the same port for GraphQL and Next.js

  await app.prepare();
  const server = express();
  server.use(express.json());

  // MCP SSE session map
  const mcpServer = createMcpServer();
  registerGraphQLTool(mcpServer, () => graphqlPort);
  const transports = new Map<string, SSEServerTransport>();

  // SSE endpoint for MCP
  server.get("/sse", async (_req: Request, res: Response) => {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => {
      transports.delete(transport.sessionId);
    });
    await mcpServer.connect(transport);
  });

  // POST endpoint for MCP messages
  server.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (transport) {
      await transport.handlePostMessage(req, res);
    } else {
      res.status(400).send("No transport found for sessionId");
    }
  });

  const graphqlServer = await createGraphQLServer(prisma);

  // @ts-ignore
  server.use(graphqlServer.graphqlEndpoint, graphqlServer);

  // Next.js pages and API routes
  server.all(/(.*)/, (req: Request, res: Response) => handle(req, res));

  // Start GraphQL server

  // Start HTTP server
  const httpServer = createHttpServer(server);
  httpServer.listen(port, () => {
    console.error(`[Server] Ready on http://localhost:${port}`);
    console.error(
      `[Server] GraphQL endpoint at http://localhost:${port}/graphql`
    );
    console.error(
      `[Server] MCP SSE endpoints: GET http://localhost:${port}/sse, POST http://localhost:${port}/messages`
    );
  });
}

main().catch((err) => {
  console.error("[Server] Error starting unified server:", err);
  process.exit(1);
});
