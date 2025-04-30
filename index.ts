#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch, { Request, Response } from 'node-fetch';
import { VERSION } from './common/version.js';
import { GetFlowData, getFlowData, NodeChainSchema, updateFlow } from './operations/createNode.js';

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
      {
        name: 'get_flow_data',
        description: 'Gets the current Langflow workflow data',
        inputSchema: zodToJsonSchema(GetFlowData),
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
        }

      case 'get_flow_data':
        try {
          const flowData = await getFlowData();
          return {
            type: 'text',
            content: [{ type: 'text', text: `Flow data:\n${JSON.stringify(flowData, null, 2)}` }],
          };
        } catch (error) {
          return {
            type: 'text',
            content: [{ type: 'text', text: `Flow data:\n${JSON.stringify(error, null, 2)}` }],
          };
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
