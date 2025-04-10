import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "SurveyDesignerServer",
  version: "0.1.0" // Initial version
});

// Add an echo resource
server.resource(
  "echo",
  new ResourceTemplate("echo://{message}", { list: undefined }),
  async (uri, { message }) => {
    console.log(`[Server] Responding to resource request: ${uri.href}`);
    return {
      contents: [{
        uri: uri.href,
        text: `Resource echo: ${message}`
      }]
    };
  }
);

// Add an echo tool
server.tool(
  "echo",
  { message: z.string().describe("The message to echo back.") },
  async ({ message }) => {
    console.log(`[Server] Executing tool 'echo' with message: ${message}`);
    return {
      content: [{ type: "text", text: `Tool echo: ${message}` }]
    };
  }
);

// Add an echo prompt
server.prompt(
  "echo",
  { message: z.string().describe("The message to include in the prompt.") },
  ({ message }) => {
    console.log(`[Server] Generating prompt 'echo' with message: ${message}`);
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please process this message: ${message}`
        }
      }]
    };
  }
);

async function startServer() {
  console.log("[Server] Starting MCP server with stdio transport...");
  // Start receiving messages on stdin and sending messages on stdout
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    console.log("[Server] Connected and listening on stdio.");
  } catch (error) {
    console.error("[Server] Failed to connect:", error);
    process.exit(1); // Exit if connection fails
  }
}

startServer(); 