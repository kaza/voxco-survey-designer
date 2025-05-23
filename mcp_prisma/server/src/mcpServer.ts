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
import { printSchema, type GraphQLSchema } from 'graphql'; // ++ Import printSchema and GraphQLSchema type ++


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

// Extracted function to handle GraphQL operations
async function executeGraphQLOperation(
  { query, variables }: { query: string; variables?: Record<string, unknown> },
  getGraphqlPort: () => number
): Promise<{ content: { type: "text"; text: string }[] }> {
  const graphqlPort = getGraphqlPort();
  console.error(`${getTimestamp()} [MCP Server] Executing GraphQL operation:`, query);

  try {
    const response = await fetch(`http://localhost:${graphqlPort}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: variables || {}, // Ensure variables is an object
      }),
    });

    const result = (await response.json()) as GraphQLResponse;

    if (result.errors && result.errors.length > 0) {
      console.error(`${getTimestamp()} [MCP Server] GraphQL Error:`, result.errors);
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
    console.error(`${getTimestamp()} [MCP Server] Error executing GraphQL operation for query:`, query);
    console.error(`${getTimestamp()} [MCP Server] Variables:`, variables);
    console.error(`${getTimestamp()} [MCP Server] GraphQL Execution Error:`, error);
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
    // Use the extracted named function
    (args) => executeGraphQLOperation(args, getGraphqlPort)
  );
}

// ++ Define a named function for getting the schema SDL, with explicit return type ++
async function getPothosSchemaSDL(schema: GraphQLSchema): Promise<{ content: { type: "text"; text: string }[] }> {
  try {
    const schemaSDL = printSchema(schema);
    console.log(`${getTimestamp()} [MCP Server] Providing GraphQL schema from Pothos builder`);
    return {
      content: [
        {
          type: "text",
          text: schemaSDL,
        },
      ],
    };
  } catch (error: unknown) {
    console.error(`${getTimestamp()} [MCP Server] Error printing Pothos schema:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error printing schema";
    return {
      content: [
        {
          type: "text",
          text: `Error retrieving schema: ${errorMessage}`,
        },
      ],
    };
  }
}

// ++ Modify the GraphQL Schema tool registration function to accept the schema object ++
export function registerGraphQLSchemaTool(
  server: McpServer,
  schema: GraphQLSchema // ++ Accept the Pothos schema object ++
): void {
  const GetSchemaToolSchema = z.object({}); // No parameters needed

  server.tool(
    "get_graphql_schema",
    "Retrieve the full GraphQL schema definition (built using Pothos).", // Updated description
    GetSchemaToolSchema.shape,
    // -- Use the named function as the handler --
    () => getPothosSchemaSDL(schema) // Call the named function
  );
}
// ++ End of GraphQL Schema tool registration modification ++

// ++ Add the Echo tool registration function ++
export function registerEchoTool(server: McpServer): void {
  const EchoToolSchema = z.object({
    message: z.string().describe("The message to echo back"),
  });

  server.tool(
    "echo",
    "Echoes back the provided message with a timestamp.",
    EchoToolSchema.shape,
    async ({ message }: { message: string }) => {
      const timestamp = getTimestamp();
      console.log(`${timestamp} [MCP Server] Echoing message: ${message}`);
      return {
        content: [
          {
            type: "text",
            text: `echo ${timestamp} ${message}`,
          },
        ],
      };
    }
  );
}
// ++ End of Echo tool registration function ++

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
export function setupMcpEndpoints(
  app: Express,
  mcpServer: McpServer,
  getGraphqlPort: () => number,
  schema: GraphQLSchema // ++ Accept the Pothos schema object ++
): Map<string, SSEServerTransport> {
  const transports = new Map<string, SSEServerTransport>();
  registerGraphQLTool(mcpServer, getGraphqlPort); // Register GraphQL operation tool
  registerEchoTool(mcpServer); // Register Echo tool
  // ++ Pass the schema object to the registration function ++
  registerGraphQLSchemaTool(mcpServer, schema);

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