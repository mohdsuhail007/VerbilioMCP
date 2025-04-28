import { z } from 'zod';
import { createNodeRequest } from '../common/utils.js';

// Type exports
// const LLMSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   template: z.null(),
// });

// const PromptSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   template: z.null(),
// });

// const PositionSchema = z.object({
//   x: z.number(),
//   y: z.number(),
// });

export const NodeChainSchema = z.object({
  json: z.any(),
});

const LANGFLOW_URL = process.env.LANGFLOW_URL;
const WORKFLOW_ID = process.env.LANGFLOW_WORKFLOW_ID;
const API_KEY = process.env.API_KEY;

export async function updateNode(nodesData: z.infer<typeof NodeChainSchema>) {
  // const url = `${LANGFLOW_URL}/api/v1/flows/${WORKFLOW_ID}/add_node`;
  try {
    const url = 'http://localhost:3000/api/v1/flows/289acde4-00cc-4176-8601-9708c4e82a71';
    const response = await createNodeRequest(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: {
        ...nodesData.json,
      },
    });
    console.log(response, null, 2);

    return NodeChainSchema.parse(response);
  } catch (error) {
    console.log('🚀 ~ updateNode ~ error:', error);
  }
}
