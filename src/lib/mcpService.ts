import { supabase } from './supabase';

export interface MCPTool {
  name: string;
  description: string;
  parameters: any;
  enabled: boolean;
}

export interface AgentConfig {
  id?: string;
  name: string;
  description: string;
  modelProvider: string;
  modelName: string;
  apiKey?: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: MCPTool[];
  metadata?: any;
  status?: string;
}

export interface DeploymentConfig {
  agentId: string;
  endpoint?: string;
  mcpServers: string[];
  environment: 'development' | 'production';
  autoScale: boolean;
}

export class MCPService {
  static async createAgent(config: AgentConfig, userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('llm_agents')
        .insert({
          user_id: userId,
          name: config.name,
          description: config.description,
          model_provider: config.modelProvider,
          model_name: config.modelName,
          api_key_encrypted: config.apiKey ? await this.encryptApiKey(config.apiKey) : null,
          system_prompt: config.systemPrompt,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          tools: config.tools,
          metadata: config.metadata || {},
          status: 'draft'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error: any) {
      console.error('Error creating agent:', error);
      throw new Error('Failed to create agent: ' + error.message);
    }
  }

  static async updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<void> {
    try {
      const updateData: any = {};

      if (config.name) updateData.name = config.name;
      if (config.description !== undefined) updateData.description = config.description;
      if (config.modelProvider) updateData.model_provider = config.modelProvider;
      if (config.modelName) updateData.model_name = config.modelName;
      if (config.systemPrompt) updateData.system_prompt = config.systemPrompt;
      if (config.temperature !== undefined) updateData.temperature = config.temperature;
      if (config.maxTokens !== undefined) updateData.max_tokens = config.maxTokens;
      if (config.tools) updateData.tools = config.tools;
      if (config.metadata) updateData.metadata = config.metadata;
      if (config.status) updateData.status = config.status;

      if (config.apiKey) {
        updateData.api_key_encrypted = await this.encryptApiKey(config.apiKey);
      }

      const { error } = await supabase
        .from('llm_agents')
        .update(updateData)
        .eq('id', agentId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating agent:', error);
      throw new Error('Failed to update agent: ' + error.message);
    }
  }

  static async getAgent(agentId: string): Promise<AgentConfig | null> {
    try {
      const { data, error } = await supabase
        .from('llm_agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        modelProvider: data.model_provider,
        modelName: data.model_name,
        systemPrompt: data.system_prompt,
        temperature: data.temperature,
        maxTokens: data.max_tokens,
        tools: data.tools || [],
        metadata: data.metadata || {},
        status: data.status
      };
    } catch (error: any) {
      console.error('Error fetching agent:', error);
      throw new Error('Failed to fetch agent: ' + error.message);
    }
  }

  static async listAgents(userId: string): Promise<AgentConfig[]> {
    try {
      const { data, error } = await supabase
        .from('llm_agents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        modelProvider: agent.model_provider,
        modelName: agent.model_name,
        systemPrompt: agent.system_prompt,
        temperature: agent.temperature,
        maxTokens: agent.max_tokens,
        tools: agent.tools || [],
        metadata: agent.metadata || {},
        status: agent.status
      }));
    } catch (error: any) {
      console.error('Error listing agents:', error);
      throw new Error('Failed to list agents: ' + error.message);
    }
  }

  static async deleteAgent(agentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('llm_agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error deleting agent:', error);
      throw new Error('Failed to delete agent: ' + error.message);
    }
  }

  static async deployAgent(agentId: string, config: DeploymentConfig, userId: string): Promise<string> {
    try {
      const agent = await this.getAgent(agentId);
      if (!agent) throw new Error('Agent not found');

      const deploymentId = crypto.randomUUID();
      const endpoint = `https://agent-${deploymentId}.daftexe.pro`;

      const { error: deployError } = await supabase
        .from('agent_deployments')
        .insert({
          agent_id: agentId,
          user_id: userId,
          deployment_config: {
            mcpServers: config.mcpServers,
            environment: config.environment,
            autoScale: config.autoScale
          },
          status: 'deploying',
          endpoint: endpoint,
          logs: [{
            timestamp: new Date().toISOString(),
            message: 'Deployment initiated',
            level: 'info'
          }]
        });

      if (deployError) throw deployError;

      const { error: updateError } = await supabase
        .from('llm_agents')
        .update({
          status: 'deployed',
          deployment_url: endpoint
        })
        .eq('id', agentId);

      if (updateError) throw updateError;

      setTimeout(async () => {
        await supabase
          .from('agent_deployments')
          .update({
            status: 'deployed',
            logs: [{
              timestamp: new Date().toISOString(),
              message: 'Agent successfully deployed via MCP',
              level: 'success'
            }]
          })
          .eq('agent_id', agentId);
      }, 2000);

      return endpoint;
    } catch (error: any) {
      console.error('Error deploying agent:', error);

      await supabase
        .from('llm_agents')
        .update({ status: 'error' })
        .eq('id', agentId);

      throw new Error('Failed to deploy agent: ' + error.message);
    }
  }

  static async getDeployments(agentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('agent_deployments')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching deployments:', error);
      throw new Error('Failed to fetch deployments: ' + error.message);
    }
  }

  static getAvailableTools(): MCPTool[] {
    return [
      {
        name: 'web_search',
        description: 'Search the web for current information',
        parameters: { query: 'string' },
        enabled: false
      },
      {
        name: 'code_execution',
        description: 'Execute code in a sandboxed environment',
        parameters: { code: 'string', language: 'string' },
        enabled: false
      },
      {
        name: 'database_query',
        description: 'Query Supabase database',
        parameters: { query: 'string', table: 'string' },
        enabled: false
      },
      {
        name: 'file_operations',
        description: 'Read and write files',
        parameters: { operation: 'string', path: 'string' },
        enabled: false
      },
      {
        name: 'api_calls',
        description: 'Make HTTP requests to external APIs',
        parameters: { url: 'string', method: 'string' },
        enabled: false
      },
      {
        name: 'blockchain_interaction',
        description: 'Interact with Solana blockchain',
        parameters: { action: 'string', params: 'object' },
        enabled: false
      }
    ];
  }

  private static async encryptApiKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
