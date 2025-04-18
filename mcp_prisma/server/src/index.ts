import "reflect-metadata";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { PrismaClient } from "@prisma/client";
import { createServer as createHttpServer } from "node:http";
import { createYoga } from "graphql-yoga";
import fetch from "node-fetch";
import { buildSchema } from "type-graphql";
import getPort from "get-port";
import { resolvers } from "@generated/type-graphql";

// Import MCP related functions
import { createMcpServer, setupMcpEndpoints, createMCPTools } from "./mcpServer.js";

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

async function main() {
  console.log("Starting server...");

  const port = process.env.PORT
    ? Number.parseInt(process.env.PORT, 10)
    : await getPort({ port: 4000 });

  const graphqlPort = port; // Use the same port for GraphQL

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // Setup MCP Server and Endpoints
  const mcpServer = createMcpServer();
  setupMcpEndpoints(app, mcpServer, () => graphqlPort);

  // AI Chat endpoint
  app.post("/api/chat", async (req: Request, res: Response) => {
    console.log("--- /api/chat endpoint hit ---");
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
        google: google("gemini-2.5-pro-preview-03-25"),
      };
      
      //console.info("Model:", model);
      // Continue with normal flow
      const tools = await createMCPTools(port);
      //console.info("tools:", tools);
      
      const result = streamText({
        model: modelMap[model],
        messages,
        system:
          "You are a survey designer application. Be as supportive as possible. "
          +"If you need to use the GraphQL tool, always introspect the schema to find "
          +"the exact query or mutation you need to run. Only then should you execute the "
          +"operation. Do not guess or assume the schema; always verify first. "
          +"Keep the query for introspection short and concise. Prefer Human readable responses.",

        //temperature: 0.3,
        //maxTokens: 5000,
        //frequencyPenalty: 0.5,
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
  const prisma = new PrismaClient();
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
