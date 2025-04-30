#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch, { Request, Response } from 'node-fetch';
import { VERSION } from './common/version.js';
import { NodeChainSchema, updateFlow } from './operations/createNode.js';

if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof global.fetch;
}

const server = new Server(
  {
    name: 'verbilio-langflow-mcp',
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'update_flow',
        description: 'Updates a node or edge in the Langflow workflow',
        inputSchema: zodToJsonSchema(NodeChainSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    console.log('🚀 ~ request:', request);
    if (!request.params.arguments) {
      throw new Error('Arguments are required');
    }

    switch (request.params.name) {
      case 'update_flow':
        try {
          const args = NodeChainSchema.parse(request.params.arguments);
          const node = await updateFlow(args);
          return {
            type: 'text',
            content: [{ type: 'text', text: `Flow updated:\n${JSON.stringify(node, null, 2)}` }],
          };
        } catch (error) {
          return {
            type: 'text',
            content: [{ type: 'text', text: `Flow updated:\n${JSON.stringify(error, null, 2)}` }],
          };
          console.log('🚀 ~ error:', error);
        }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }

    throw error;
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});
