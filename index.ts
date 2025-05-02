#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch from 'node-fetch';
import { VERSION } from './common/version.js';
import {
  AgentFlowInputSchema,
  AgentFlowService,
  AgentFlowUpdateSchema,
  GetAllFlowsSchema,
  GetFlowSchema,
} from './operations/workflow.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import 'dotenv/config';

const AgentFlow = new AgentFlowService();

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

// // 2. Connect transport to server
// server.connect(transport);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'add_flow',
        description: 'Adds a new node or edge to the Langflow workflow',
        inputSchema: zodToJsonSchema(AgentFlowInputSchema),
      },
      {
        name: 'update_flow',
        description: 'Updates a node or edge in the Langflow workflow',
        inputSchema: zodToJsonSchema(AgentFlowUpdateSchema),
      },
      {
        name: 'get_flow',
        description: 'Gets the current Langflow workflow data',
        inputSchema: zodToJsonSchema(GetFlowSchema),
      },
      {
        name: 'get_all_flows',
        description: 'Gets all the workflows',
        inputSchema: zodToJsonSchema(GetAllFlowsSchema),
      },
      {
        name: 'delete_flow',
        description: 'Deletes a node or edge from the Langflow workflow',
        inputSchema: zodToJsonSchema(GetFlowSchema),
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
      case 'add_flow':
        try {
          const args = AgentFlowInputSchema.parse(request.params.arguments);
          const node = await AgentFlow.AddFlow(args);
          return {
            type: 'text',
            content: [{ type: 'text', text: `Flow added:\n${JSON.stringify(node, null, 2)}` }],
          };
        } catch (error) {
          return {
            type: 'text',
            content: [{ type: 'text', text: `Error adding flow :\n${JSON.stringify(error, null, 2)}` }],
          };
        }

      case 'update_flow':
        try {
          const args = AgentFlowUpdateSchema.parse(request.params.arguments);
          const node = await AgentFlow.UpdateFlow(args.id, args);
          return {
            type: 'text',
            content: [{ type: 'text', text: `Flow updated:\n${JSON.stringify(node, null, 2)}` }],
          };
        } catch (error) {
          return {
            type: 'text',
            content: [{ type: 'text', text: `Error updating flow:\n${JSON.stringify(error, null, 2)}` }],
          };
        }

      case 'get_flow':
        try {
          const args = GetFlowSchema.parse(request.params.arguments);
          const flowData = await AgentFlow.GetFlow(args);
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

      case 'get_all_flows':
        try {
          const flowData = await AgentFlow.GetAllFlows();
          return {
            type: 'text',
            content: [{ type: 'text', text: `Flows data:\n${JSON.stringify(flowData, null, 2)}` }],
          };
        } catch (error) {
          return {
            type: 'text',
            content: [{ type: 'text', text: `Flows data:\n${JSON.stringify(error, null, 2)}` }],
          };
        }

      case 'delete_flow':
        try {
          const args = GetFlowSchema.parse(request.params.arguments);
          const flowData = await AgentFlow.DeleteFlow(args);
          return {
            type: 'text',
            content: [{ type: 'text', text: `Deleted flow:\n${JSON.stringify(flowData, null, 2)}` }],
          };
        } catch (error) {
          return {
            type: 'text',
            content: [{ type: 'text', text: `Deleted flow:\n${JSON.stringify(error, null, 2)}` }],
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

// 3. Modify /mcp endpoint
// app.get('/mcp', (req, res) => {
//   // if (!transport) {
//   //   res.status(500).send('Transport not initialized');
//   //   return;
//   // }

//   transport.handleRequest(req, res);
// });

// app.post('/messages', (req, res) => {
//   if (transport) {
//     transport.handlePostMessage(req, res);
//   }
// });

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});

// LANGFLOW_URL=http://localhost:7860 FLOW_ID=289acde4-00cc-4176-8601-9708c4e82a71 API_KEY=sk-z0YzSmyhCr5ef9c_5hUVGvW_l6Gpkx0Mb_FjeXHnd1g npx @mohdsuhail007/server-verbilio

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });
