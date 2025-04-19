import "reflect-metadata";
import type { Request, Response, Express } from "express";
import { experimental_createMCPClient } from "ai";
import { z } from "zod";
import fetch from "node-fetch";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { PrismaClient } from "@prisma/client"; // Added import
import { log } from "node:console";
import { getTimestamp } from "./utils/timestamp.js"; // Import the utility function
import { default_api } from "default_api"
import * as fs from "node:fs"; // Added for file system access
import * as path from "node:path"; // Added for path manipulation
import { buildGraphQLSchema } from "./graphqlServer.js"; // Import the schema builder
import { printSchema } from "graphql"; // Import printSchema

// Helper function to get MM:SS timestamp
// function getTimestamp(): string {
//   const now = new Date();
//   const minutes = String(now.getMinutes()).padStart(2, '0');
//   const seconds = String(now.getSeconds()).padStart(2, '0');
//   return `[${minutes}:${seconds}]`;
// }

// GraphQL response interface (Copied from index.ts, consider moving to a shared types file later)
interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

// Function to create the MCP server instance
export function createMcpServer(): McpServer {
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

// Function to handle the GraphQL operation execution logic
async function handleGraphQLOperation(
  { query, variables = {} }: { query: string; variables?: Record<string, unknown> },
  getGraphqlPort: () => number
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const graphqlPort = getGraphqlPort();
  console.error(`${getTimestamp()} [MCP Server] Executing GraphQL operation:`, query);

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
      console.error(`${getTimestamp()} [MCP Server] GraphQL Error:`, result.errors);
      throw new Error(result.errors[0].message);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result.data || {}, null, 2),
        },
      ],
    };
  } catch (error: unknown) {
    console.error(`${getTimestamp()} [MCP Server] Error executing GraphQL operation for query:`, query);
    console.error(`${getTimestamp()} [MCP Server] Variables:`, variables);
    console.error(`${getTimestamp()} [MCP Server] GraphQL Execution Error:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text" as const,
          text: `Error executing GraphQL operation: ${errorMessage}`,
        },
      ],
    };
  }
}

// Function to register the GraphQL tool
export function registerGraphQLTool(server: McpServer, getGraphqlPort: () => number): void {
  const GraphQLOperationSchema = z.object({
    query: z.string().describe("The GraphQL query or mutation string"),
    variables: z
      .record(z.unknown())
      .optional()
      .describe("Variables for the GraphQL operation"),
  });

  server.tool(
    "graphql",
    "Execute a GraphQL operation, introspect the schema first to find the exact query or mutation you need to run."
    +" Only then should you execute the operation. Do not guess or assume the schema; always verify first.",
    GraphQLOperationSchema.shape,
    (args) => handleGraphQLOperation(args, getGraphqlPort) // Use the named function
  );
}

// Function to handle the Echo tool logic
async function handleEchoTool(): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const timestamp = getTimestamp();
  console.log(`${timestamp} [MCP Server] Executing Echo tool`);
  return {
    content: [
      {
        type: "text" as const, // Ensure type is literal "text"
        text: `echo ${timestamp}`,
      },
    ],
  };
}

// Function to register the Echo tool
export function registerEchoTool(server: McpServer): void {
  server.tool(
    "echo",
    "Responds with 'echo' and the current server time.",
    {}, // No input schema needed
    handleEchoTool // Use the named function
  );
}

// --- New Tool: Get Minimal Schema --- (Now generates dynamically)

// Function to handle the Get Minimal Schema tool logic
async function handleGetSchemaTool(): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const timestamp = getTimestamp();
  console.log(`${timestamp} [MCP Server] Executing GetSchema tool - Generating schema dynamically`);

  try {
    // 1. Build the schema object using the configured builder
    const schema = await buildGraphQLSchema();
    // 2. Print the schema object to SDL string
    const schemaAsString = printSchema(schema);

    return {
      content: [
        {
          type: "text" as const,
          text: schemaAsString,
        },
      ],
    };
  } catch (error: unknown) {
    console.error(`${timestamp} [MCP Server] Error generating GraphQL schema dynamically:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      content: [
        {
          type: "text" as const,
          text: `Error retrieving GraphQL schema: ${errorMessage}`,
        },
      ],
    };
  }
}

// Function to register the Get Minimal Schema tool
export function registerGetSchemaTool(server: McpServer): void {
  server.tool(
    "getMinimalSchema",
    "Retrieves the pre-generated, minimal GraphQL schema definition (SDL). Takes no arguments.",
    {}, // No input schema needed
    handleGetSchemaTool // Use the named function
  );
}

// --- End New Tool ---

// Function to create MCP tools client-side
export async function createMCPTools(mcpPort: number) { // Assuming MCP runs on the same port for now
  const mcpClient = await experimental_createMCPClient({
    transport: {
      type: "sse",
      url: `http://localhost:${mcpPort}/sse`, // Use dynamic port
    },
  });
  return mcpClient.tools();
}

// Function to setup MCP endpoints on the Express app
export function setupMcpEndpoints(app: Express, mcpServer: McpServer, getGraphqlPort: () => number): Map<string, SSEServerTransport> {
  const transports = new Map<string, SSEServerTransport>();
  registerGraphQLTool(mcpServer, getGraphqlPort); // Register tool here
  registerEchoTool(mcpServer); // Register the new echo tool
  registerGetSchemaTool(mcpServer); // Register the schema tool

  // SSE endpoint for MCP
  app.get("/sse", async (_req: Request, res: Response) => {
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    res.on("close", () => {
      transports.delete(transport.sessionId);
      console.log(`${getTimestamp()} [MCP Server] Transport closed for session ${transport.sessionId}`);
    });
    console.log(`${getTimestamp()} [MCP Server] New transport connecting for session ${transport.sessionId}`);
    await mcpServer.connect(transport);
    console.log(`${getTimestamp()} [MCP Server] Transport connected for session ${transport.sessionId}`);
  });

  // POST endpoint for MCP messages
  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (transport) {
        console.log(`${getTimestamp()} [MCP Server] Handling POST message for session ${sessionId}`);
      await transport.handlePostMessage(req, res, req.body);
    } else {
      console.error(`${getTimestamp()} [MCP Server] No transport found for sessionId ${sessionId}`);
      res.status(400).send("No transport found for sessionId");
    }
  });

  return transports; // Return transports map if needed elsewhere, though maybe not
} 