import React, { useState, useEffect } from 'react';
import { Brain, Cpu, Zap, Settings, Rocket, Trash2, Edit2, Save, X } from 'lucide-react';
import { MCPService, AgentConfig, MCPTool } from '../lib/mcpService';

interface TrainingCenterProps {
  userId: string;
}

export default function TrainingCenter({ userId }: TrainingCenterProps) {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<AgentConfig>({
    name: '',
    description: '',
    modelProvider: 'openai',
    modelName: 'gpt-4',
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
    maxTokens: 1000,
    tools: MCPService.getAvailableTools(),
    metadata: {}
  });

  useEffect(() => {
    loadAgents();
  }, [userId]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const agentList = await MCPService.listAgents(userId);
      setAgents(agentList);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedAgent(null);
    setFormData({
      name: '',
      description: '',
      modelProvider: 'openai',
      modelName: 'gpt-4',
      systemPrompt: 'You are a helpful AI assistant.',
      temperature: 0.7,
      maxTokens: 1000,
      tools: MCPService.getAvailableTools(),
      metadata: {}
    });
  };

  const handleEdit = (agent: AgentConfig) => {
    setSelectedAgent(agent);
    setIsEditing(true);
    setIsCreating(false);
    setFormData({ ...agent });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (isEditing && selectedAgent?.id) {
        await MCPService.updateAgent(selectedAgent.id, formData);
        setSuccess('Agent updated successfully!');
      } else {
        await MCPService.createAgent(formData, userId);
        setSuccess('Agent created successfully!');
      }

      await loadAgents();
      setIsCreating(false);
      setIsEditing(false);
      setSelectedAgent(null);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      setLoading(true);
      await MCPService.deleteAgent(agentId);
      await loadAgents();
      setSuccess('Agent deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async (agentId: string) => {
    try {
      setLoading(true);
      setError('');
      const endpoint = await MCPService.deployAgent(
        agentId,
        {
          agentId,
          mcpServers: ['supabase', 'web-search', 'code-execution'],
          environment: 'production',
          autoScale: true
        },
        userId
      );
      setSuccess(`Agent deployed successfully at ${endpoint}`);
      await loadAgents();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToolToggle = (toolName: string) => {
    setFormData({
      ...formData,
      tools: formData.tools.map(tool =>
        tool.name === toolName ? { ...tool, enabled: !tool.enabled } : tool
      )
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedAgent(null);
  };

  if (isCreating || isEditing) {
    return (
      <div className="h-full flex flex-col bg-gray-100">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6" />
              <h2 className="text-xl font-bold">
                {isEditing ? 'Edit Agent' : 'Create New Agent'}
              </h2>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/20 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Agent Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My AI Assistant"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what this agent does..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Model Provider</label>
                <select
                  value={formData.modelProvider}
                  onChange={(e) => setFormData({ ...formData, modelProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="mistral">Mistral</option>
                  <option value="local">Local Model</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Model Name</label>
                <select
                  value={formData.modelName}
                  onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {formData.modelProvider === 'openai' && (
                    <>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                  {formData.modelProvider === 'anthropic' && (
                    <>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku">Claude 3 Haiku</option>
                    </>
                  )}
                  {formData.modelProvider === 'google' && (
                    <>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-ultra">Gemini Ultra</option>
                    </>
                  )}
                  {formData.modelProvider === 'mistral' && (
                    <>
                      <option value="mistral-large">Mistral Large</option>
                      <option value="mistral-medium">Mistral Medium</option>
                    </>
                  )}
                  {formData.modelProvider === 'local' && (
                    <option value="llama-2">Llama 2</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">API Key (Optional)</label>
              <input
                type="password"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Leave blank to use system default
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">System Prompt</label>
              <textarea
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="You are a helpful AI assistant..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Temperature: {formData.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Higher = more creative</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                  max="8000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">MCP Tools</label>
              <div className="space-y-2">
                {formData.tools.map((tool) => (
                  <div
                    key={tool.name}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{tool.name.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="text-sm text-gray-600">{tool.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tool.enabled}
                        onChange={() => handleToolToggle(tool.name)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading || !formData.name}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Agent'}
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-300 hover:bg-gray-400 rounded-lg font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6" />
            <h2 className="text-xl font-bold">Agent Training Center</h2>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 flex items-center gap-2 font-semibold"
          >
            <Zap className="w-4 h-4" />
            New Agent
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && agents.length === 0 ? (
          <div className="text-center py-12">
            <Cpu className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
            <p className="text-gray-600">Loading agents...</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Brain className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Agents Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first AI agent with custom LLM configuration and MCP tools.
            </p>
            <button
              onClick={handleCreateNew}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto font-semibold"
            >
              <Zap className="w-5 h-5" />
              Create Your First Agent
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      {agent.name}
                      <span className={`text-xs px-2 py-1 rounded ${
                        agent.status === 'deployed' ? 'bg-green-100 text-green-800' :
                        agent.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        agent.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.status}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600">{agent.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(agent)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id!)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {agent.modelProvider} / {agent.modelName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {agent.tools.filter(t => t.enabled).length} tools enabled
                    </span>
                  </div>
                </div>

                {agent.status !== 'deployed' && (
                  <button
                    onClick={() => handleDeploy(agent.id!)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                  >
                    <Rocket className="w-4 h-4" />
                    {loading ? 'Deploying...' : 'Deploy via MCP'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
