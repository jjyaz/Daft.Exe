/*
  # daft.exe Database Schema

  ## Overview
  Complete schema for daft.exe Windows 98 emulator with blockchain, AI, and security features.

  ## New Tables
  
  ### Core Tables
  - `users` - User profiles with wallet addresses
  - `memecoins` - AI-generated tokens from Daft Generator
  - `nfts` - NFT gallery items with pixel art metadata
  - `transactions` - Cross-chain transaction history
  - `ai_agents` - Autonomous trading agents
  - `security_scans` - Smart contract vulnerability reports
  - `zk_proofs` - Zero-knowledge proof records
  - `bridge_operations` - Cross-chain bridge transactions
  - `training_sessions` - AI/AGI training results
  - `threat_alerts` - Security scanner findings

  ## Security
  - Enable RLS on all tables
  - Policies for authenticated user access
  - Public read for certain marketplace data
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  username text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Memecoins table
CREATE TABLE IF NOT EXISTS memecoins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  symbol text NOT NULL,
  supply text NOT NULL,
  description text,
  contract_address text,
  deployed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE memecoins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memecoins"
  ON memecoins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memecoins"
  ON memecoins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view deployed memecoins"
  ON memecoins FOR SELECT
  USING (deployed = true);

-- NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  description text,
  image_url text,
  price_sol text,
  mint_address text,
  listed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own NFTs"
  ON nfts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view listed NFTs"
  ON nfts FOR SELECT
  USING (listed = true);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  from_chain text NOT NULL,
  to_chain text NOT NULL,
  amount text NOT NULL,
  token text NOT NULL,
  status text DEFAULT 'pending',
  tx_hash text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- AI Agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  type text NOT NULL,
  status text DEFAULT 'standby',
  performance text DEFAULT '0%',
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  last_active timestamptz
);

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agents"
  ON ai_agents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Security scans table
CREATE TABLE IF NOT EXISTS security_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  contract_address text NOT NULL,
  vulnerabilities jsonb DEFAULT '[]',
  risk_score integer DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE security_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scans"
  ON security_scans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scans"
  ON security_scans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ZK Proofs table
CREATE TABLE IF NOT EXISTS zk_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  proof_type text NOT NULL,
  proof_data text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE zk_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own proofs"
  ON zk_proofs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Bridge operations table
CREATE TABLE IF NOT EXISTS bridge_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  agent_id uuid REFERENCES ai_agents(id),
  from_chain text NOT NULL,
  to_chain text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bridge_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bridge operations"
  ON bridge_operations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Training sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  dataset text NOT NULL,
  learning_rate numeric DEFAULT 0.001,
  accuracy text,
  iterations integer DEFAULT 0,
  status text DEFAULT 'pending',
  results jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own training sessions"
  ON training_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Threat alerts table
CREATE TABLE IF NOT EXISTS threat_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  threat_type text NOT NULL,
  severity text NOT NULL,
  description text,
  detected_at timestamptz DEFAULT now()
);

ALTER TABLE threat_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON threat_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create alerts"
  ON threat_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
