import { z } from 'zod';
import { createNodeRequest } from '../common/utils.js';

// Type exports
const LLMSchema = z.object({
  id: z.string(),
  name: z.string(),
  template: z.null(),
});

const PromptSchema = z.object({
  id: z.string(),
  name: z.string(),
  template: z.null(),
});

const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const NodeChainSchema = z.object({
  type: z.string(),
  params: z.object({
    llm: LLMSchema,
    prompt: PromptSchema,
  }),
  position: PositionSchema,
  id: z.string(),
  name: z.string(),
});

const LANGFLOW_URL = process.env.LANGFLOW_URL;
const WORKFLOW_ID = process.env.LANGFLOW_WORKFLOW_ID;
const API_KEY = process.env.API_KEY;

export async function createNode({ ...rest }: z.infer<typeof NodeChainSchema>) {
  const url = `${LANGFLOW_URL}/api/v1/flows/${WORKFLOW_ID}/add_node`;
  const response = await createNodeRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: {
      rest,
    },
  });

  return NodeChainSchema.parse(response);
}
