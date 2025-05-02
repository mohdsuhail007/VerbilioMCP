import { z } from 'zod';
import supabase from '../db.js';

// Schema definitions
export const FlowsSchema = z.string().min(1, 'Flow is required').describe('Flow data as JSON string');

export const AgentFlowInputSchema = z.object({
  flow_name: z.string().min(1, 'Flow name is required').describe('Name of the flow'),
  flows: FlowsSchema,
});

export const AgentFlowUpdateSchema = z.object({
  id: z.number().int().positive().describe('Flow ID to update'),
  flow_name: z.string().min(1, 'Flow name is required').describe('New name for the flow'),
  flows: FlowsSchema,
});

export const GetFlowSchema = z.object({
  id: z.number().int().positive().describe('Flow ID to retrieve'),
});

export const GetAllFlowsSchema = z.object({}).describe('Get all flows (no parameters needed)');

// Type exports
export type Flows = z.infer<typeof FlowsSchema>;
export type AgentFlowInput = z.infer<typeof AgentFlowInputSchema>;
export type AgentFlowUpdate = z.infer<typeof AgentFlowUpdateSchema>;

export interface AgentFlow {
  id: number;
  created_at: Date;
  flows: Flows;
  flow_name: string;
}

/**
 * Custom error class for flow-related operations
 */
export class FlowError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: unknown) {
    super(message);
    this.name = 'FlowError';
  }
}

/**
 * Service class for managing Langflow workflows
 */
export class AgentFlowService {
  /**
   * Get a flow by ID
   * @param params The flow lookup parameters
   * @returns The flow data or null if not found
   * @throws {FlowError} If validation fails or database error occurs
   */
  async GetFlow(params: z.infer<typeof GetFlowSchema>): Promise<AgentFlow | null> {
    try {
      if (!Number.isInteger(params.id) || params.id <= 0) {
        throw new FlowError('Invalid flow ID', 'INVALID_ID');
      }

      const { data: flows, error } = await supabase.from('agent_flows').select('*').eq('id', params.id);

      if (error) {
        throw new FlowError('Database error', 'DB_ERROR', error);
      }

      if (!flows || flows.length === 0) {
        throw new FlowError('Flow not found', 'NOT_FOUND');
      }

      const flow = flows[0];

      try {
        FlowsSchema.parse(flow.flows);
      } catch (validationError) {
        console.warn(`Retrieved flow ${params.id} has invalid schema:`, validationError);
      }

      return flow;
    } catch (error) {
      if (error instanceof FlowError) {
        throw error;
      }
      throw new FlowError(`Failed to get flow ${params.id}`, 'GET_FLOW_ERROR', error);
    }
  }

  /**
   * Add a new flow
   * @param flowData The flow data to add
   * @returns The created flow
   * @throws {FlowError} If validation fails or database error occurs
   */
  async AddFlow(flowData: AgentFlowInput): Promise<AgentFlow> {
    try {
      const { data: result, error } = await supabase
        .from('agent_flows')
        .insert({
          flow_name: flowData.flow_name,
          flows: flowData.flows,
        })
        .select('*');

      if (error) {
        throw new FlowError('Failed to create flow', 'INSERT_ERROR', error);
      }

      if (!result || !result.length) {
        throw new FlowError('No flow created', 'CREATE_ERROR');
      }

      return result[0];
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new FlowError(`Validation failed: ${formattedErrors}`, 'VALIDATION_ERROR');
      }

      if (error instanceof FlowError) {
        throw error;
      }

      throw new FlowError('Failed to add flow', 'ADD_FLOW_ERROR', error);
    }
  }

  /**
   * Update an existing flow
   * @param id Flow ID to update
   * @param flowData Updated flow data
   * @returns The updated flow or null if not found
   * @throws {FlowError} If validation fails or database error occurs
   */
  async UpdateFlow(id: number, flowData: AgentFlowUpdate): Promise<AgentFlow | null> {
    try {
      const existingFlow = await this.GetFlow({ id });
      if (!existingFlow) {
        return null;
      }

      const { data, error } = await supabase
        .from('agent_flows')
        .update({
          flow_name: flowData.flow_name,
          flows: flowData.flows,
        })
        .eq('id', id)
        .select('*');

      if (error) {
        throw new FlowError('Failed to update flow', 'UPDATE_ERROR', error);
      }

      if (!data || !data.length) {
        return existingFlow;
      }

      return data[0];
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        throw new FlowError(`Validation failed: ${formattedErrors}`, 'VALIDATION_ERROR');
      }

      if (error instanceof FlowError) {
        throw error;
      }

      throw new FlowError(`Failed to update flow ${id}`, 'UPDATE_FLOW_ERROR', error);
    }
  }

  /**
   * Get all flows
   * @returns List of all flows
   * @throws {FlowError} If database error occurs
   */
  async GetAllFlows() {
    try {
      const { data, error } = await supabase.from('agent_flows').select('*').order('created_at', { ascending: false });

      if (error) {
        throw new FlowError('Failed to fetch flows', 'FETCH_ERROR', error);
      }

      return data || [];
    } catch (error) {
      if (error instanceof FlowError) {
        throw error;
      }
      throw new FlowError('Failed to get all flows', 'GET_ALL_ERROR', error);
    }
  }

  /**
   * Delete a flow
   * @param params The flow deletion parameters
   * @returns True if deleted successfully
   * @throws {FlowError} If validation fails or database error occurs
   */
  async DeleteFlow(params: z.infer<typeof GetFlowSchema>): Promise<boolean> {
    try {
      if (!Number.isInteger(params.id) || params.id <= 0) {
        throw new FlowError('Invalid flow ID', 'INVALID_ID');
      }

      const { error } = await supabase.from('agent_flows').delete().eq('id', params.id);

      if (error) {
        throw new FlowError('Failed to delete flow', 'DELETE_ERROR', error);
      }

      return true;
    } catch (error) {
      if (error instanceof FlowError) {
        throw error;
      }
      throw new FlowError(`Failed to delete flow ${params.id}`, 'DELETE_FLOW_ERROR', error);
    }
  }
}

// Export a singleton instance
export const agentFlowService = new AgentFlowService();
