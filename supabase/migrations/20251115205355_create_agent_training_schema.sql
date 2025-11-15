/*
  # Agent Training Center Schema

  1. New Tables
    - `llm_agents`
      - `id` (uuid, primary key) - Unique agent identifier
      - `user_id` (uuid, foreign key) - Owner of the agent
      - `name` (text) - Agent name
      - `description` (text) - Agent description
      - `model_provider` (text) - LLM provider (openai, anthropic, etc)
      - `model_name` (text) - Specific model (gpt-4, claude-3, etc)
      - `api_key_encrypted` (text) - Encrypted API key
      - `system_prompt` (text) - System instructions for the agent
      - `temperature` (numeric) - Temperature setting (0-2)
      - `max_tokens` (integer) - Max tokens per response
      - `tools` (jsonb) - MCP tools configuration
      - `metadata` (jsonb) - Additional configuration
      - `status` (text) - Agent status (draft, active, deployed, error)
      - `deployment_url` (text) - Deployed agent endpoint
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `agent_training_sessions`
      - `id` (uuid, primary key) - Session identifier
      - `agent_id` (uuid, foreign key) - Associated agent
      - `user_id` (uuid, foreign key) - User who trained
      - `training_data` (jsonb) - Training examples and feedback
      - `performance_metrics` (jsonb) - Accuracy, response time, etc
      - `created_at` (timestamptz) - Session timestamp

    - `agent_deployments`
      - `id` (uuid, primary key) - Deployment identifier
      - `agent_id` (uuid, foreign key) - Deployed agent
      - `user_id` (uuid, foreign key) - Deployer
      - `deployment_config` (jsonb) - MCP deployment configuration
      - `status` (text) - Deployment status
      - `endpoint` (text) - Deployment endpoint
      - `logs` (jsonb) - Deployment logs
      - `created_at` (timestamptz) - Deployment timestamp
      - `updated_at` (timestamptz) - Last update

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own agents
    - Add policies for viewing shared/public agents
*/

-- Create llm_agents table
CREATE TABLE IF NOT EXISTS llm_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  model_provider text NOT NULL DEFAULT 'openai',
  model_name text NOT NULL DEFAULT 'gpt-4',
  api_key_encrypted text,
  system_prompt text DEFAULT 'You are a helpful AI assistant.',
  temperature numeric DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens integer DEFAULT 1000 CHECK (max_tokens > 0),
  tools jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'deployed', 'error')),
  deployment_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_training_sessions table
CREATE TABLE IF NOT EXISTS agent_training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES llm_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  training_data jsonb DEFAULT '[]'::jsonb,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create agent_deployments table
CREATE TABLE IF NOT EXISTS agent_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES llm_agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  deployment_config jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'deploying', 'deployed', 'failed')),
  endpoint text,
  logs jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE llm_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_deployments ENABLE ROW LEVEL SECURITY;

-- Policies for llm_agents
CREATE POLICY "Users can view own agents"
  ON llm_agents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own agents"
  ON llm_agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents"
  ON llm_agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents"
  ON llm_agents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for agent_training_sessions
CREATE POLICY "Users can view own training sessions"
  ON agent_training_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own training sessions"
  ON agent_training_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for agent_deployments
CREATE POLICY "Users can view own deployments"
  ON agent_deployments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own deployments"
  ON agent_deployments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deployments"
  ON agent_deployments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_llm_agents_user_id ON llm_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_agents_status ON llm_agents(status);
CREATE INDEX IF NOT EXISTS idx_agent_training_sessions_agent_id ON agent_training_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_deployments_agent_id ON agent_deployments(agent_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_llm_agents_updated_at
  BEFORE UPDATE ON llm_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_deployments_updated_at
  BEFORE UPDATE ON agent_deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();