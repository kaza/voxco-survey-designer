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
import fetch from "node-fetch";
import getPort from "get-port";

// Import utility function
import { getTimestamp } from "./utils/timestamp.js";

// Import MCP related functions
import { createMcpServer, setupMcpEndpoints, createMCPTools } from "./mcpServer.js";
// Import the new GraphQL setup function
import { setupGraphQLServer } from "./graphqlServer.js";

// System prompt for the AI chat
const CHAT_SYSTEM_PROMPT = 
  "You are a survey designer application. Be as supportive as possible. " +
  "If you need to use the GraphQL tool, always introspect the schema to find " +
  "the exact query or mutation you need to run. Only then should you execute the " +
  "operation. Do not guess or assume the schema; always verify first. " +
  "Keep the query for introspection short and concise. Prefer Human readable responses.";

// Helper function to get the AI model instance
type SupportedModel = "openai" | "claude" | "google";

function getAIModel(modelName: SupportedModel) {
  const modelMap = {
    openai: openai("gpt-4.1"),
    claude: anthropic("claude-3-7-sonnet-20250219"),
    google: google("gemini-2.5-pro-preview-03-25"),
  };
  
  if (!modelMap[modelName]) {
    console.warn(`${getTimestamp()} Unsupported model requested: ${modelName}. Defaulting to OpenAI.`);
    return modelMap.openai; // Or throw an error, depending on desired behavior
  }
  return modelMap[modelName];
}

async function main() {
  console.log(`${getTimestamp()} Starting server...`);

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
    console.log(`${getTimestamp()} --- /api/chat endpoint hit ---`);
    try {
      let { messages, model } = req.body as {
        messages: { role: "user" | "assistant" | "system"; content: string }[];
        model: "openai" | "claude" | "google";
      };

      const selectedModel = getAIModel(model);
      
      const tools = await createMCPTools(port);
      
      const result = streamText({
        model: selectedModel,
        messages,
        system: CHAT_SYSTEM_PROMPT,
        tools: tools,
        maxSteps: 15,
      });

      result.pipeDataStreamToResponse(res);
    } catch (error) {
      console.error(`${getTimestamp()} Error in chat API:`, error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Setup Prisma Client
  const prisma = new PrismaClient();

  // Setup GraphQL Server using the imported function
  await setupGraphQLServer(app, prisma);

  // Start HTTP server
  const httpServer = createHttpServer(app);
  httpServer.listen(port, () => {
    console.log(`${getTimestamp()} [Server] Ready on http://localhost:${port}`);
    console.log(
      `${getTimestamp()} [Server] MCP SSE endpoints: GET http://localhost:${port}/sse, POST http://localhost:${port}/messages`
    );
    console.log(
      `${getTimestamp()} [Server] AI Chat endpoint at http://localhost:${port}/api/chat`
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
  console.error(`${getTimestamp()} [Server] Error starting server:`, err);
  process.exit(1);
});
