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
const FLOW_ID = process.env.FLOW_ID;
export const LANGFLOW_API_KEY = process.env.API_KEY;

export async function updateFlow(nodesData: z.infer<typeof NodeChainSchema>) {
  try {
    const url = `${LANGFLOW_URL}/api/v1/flows/${FLOW_ID}`;
    console.log('Request URL:', url);
    console.log('Request payload:', JSON.stringify(nodesData.json, null, 2));

    const requestOptions = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: NodeChainSchema.parse(nodesData).json,
    };

    console.log('Request options:', JSON.stringify(requestOptions, null, 2));

    const rawResponse = await createNodeRequest(url, requestOptions);
    console.log('Raw API response:', JSON.stringify(rawResponse, null, 2));

    if (!rawResponse) {
      throw new Error('No response received from API');
    }

    // const parsed = NodeChainSchema.parse(rawResponse);
    // console.log('Parsed response:', JSON.stringify(parsed, null, 2));

    return rawResponse;
  } catch (error) {
    console.error(`Error in updateNode: ${LANGFLOW_URL}/api/v1/flows/${FLOW_ID}`, error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}
export async function getFlowData() {
  try {
    const url = `${LANGFLOW_URL}/api/v1/flows/${FLOW_ID}`;

    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const rawResponse = await createNodeRequest(url, requestOptions);

    if (!rawResponse) {
      throw new Error('No response received from API');
    }

    return rawResponse;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}
