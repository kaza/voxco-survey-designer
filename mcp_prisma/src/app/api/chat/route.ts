import { experimental_createMCPClient } from "ai";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { NextRequest } from "next/server";
import { port } from "../../../../server";

export async function POST(req: NextRequest) {
  // TODO: Update the transport config to match your MCP server setup
  const mcpClient = await experimental_createMCPClient({
    transport: {
      type: "sse", // Change to 'stdio' if your MCP server is local and supports stdio
      url: `http://localhost:${port}/sse`, // Update this to your MCP server's SSE endpoint
    },
  });

  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"), // Or your preferred model
    messages,
    tools: await mcpClient.tools(),
  });

  return result.toDataStreamResponse();
}
