import "reflect-metadata";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { experimental_createMCPClient, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { PrismaClient } from "@prisma/client";
import { createServer as createHttpServer } from "node:http";
import { createYoga } from "graphql-yoga";
import fetch from "node-fetch";
import { buildSchema } from "type-graphql";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import getPort from "get-port";
import { z } from "zod";
import { resolvers } from "@generated/type-graphql";

// GraphQL response interface
interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

const prisma = new PrismaClient();

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

// AI MCP Tools setup
async function createMCPTools() {
  const mcpClient = await experimental_createMCPClient({
    transport: {
      type: "sse",
      url: "http://localhost:4000/sse",
    },
  });
  return mcpClient.tools();
}

async function main() {
  console.log("Starting server...");

  // Dynamic port selection
  const port = process.env.PORT
    ? Number.parseInt(process.env.PORT, 10)
    : await getPort({ port: 4000 });

  const graphqlPort = port; // Use the same port for GraphQL

  // Express setup
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // MCP SSE session map
  const mcpServer = createMcpServer();
  registerGraphQLTool(mcpServer, () => graphqlPort);
  const transports = new Map<string, SSEServerTransport>();

  // SSE endpoint for MCP
  app.get("/sse", async (_req: Request, res: Response) => {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => {
      transports.delete(transport.sessionId);
    });
    await mcpServer.connect(transport);
  });

  // POST endpoint for MCP messages
  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (transport) {
      await transport.handlePostMessage(req, res, req.body);
    } else {
      res.status(400).send("No transport found for sessionId");
    }
  });

  // AI Chat endpoint
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      let { messages, model } = req.body as {
        messages: { role: "user" | "assistant" | "system"; content: string }[];
        model: "openai" | "claude" | "google";
      };

      // Limit context window to last 5 messages
      if (messages.length > 10) {
        messages = [
          // Keep system message if it exists
          ...messages.filter((m) => m.role === "system"),
          // Keep last 5 non-system messages
          ...messages.filter((m) => m.role !== "system").slice(-5),
        ];
      }

      const modelMap = {
        openai: openai("gpt-4.1"),
        claude: anthropic("claude-3-7-sonnet-20250219"),
        google: google("gemini-2.5-pro-exp-03-25"),
      };

      // Continue with normal flow
      const tools = await createMCPTools();
      const result = streamText({
        model: modelMap[model],
        messages,
        system:
          "You are a survey designer application. Be concise and direct in your responses. If you need to use the GraphQL tool, always introspect the schema to find the exact query or mutation you need to run. Only then should you execute the operation. Do not guess or assume the schema; always verify first. Keep the query for introspection short and concise. Prefer Human readable responses.",
        temperature: 0.3,
        maxTokens: 500,
        frequencyPenalty: 0.5,
        tools: tools,
        maxSteps: 15,
      });

      result.pipeDataStreamToResponse(res);
    } catch (error) {
      console.error("Error in chat API:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Add GraphQL server
  const graphqlServer = await createGraphQLServer(prisma);
  // @ts-ignore
  app.use("/graphql", graphqlServer);

  // Start HTTP server
  const httpServer = createHttpServer(app);
  httpServer.listen(port, () => {
    console.log(`[Server] Ready on http://localhost:${port}`);
    console.log(
      `[Server] GraphQL endpoint at http://localhost:${port}/graphql`
    );
    console.log(
      `[Server] MCP SSE endpoints: GET http://localhost:${port}/sse, POST http://localhost:${port}/messages`
    );
    console.log(
      `[Server] AI Chat endpoint at http://localhost:${port}/api/chat`
    );
  });

  // Graceful shutdown to close the Prisma client
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[Server] Error starting server:", err);
  process.exit(1);
});
