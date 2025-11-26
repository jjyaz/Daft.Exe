/*
  # Create ZK-ML Prediction Markets System

  This migration creates a comprehensive prediction markets system that integrates
  with existing AI agents, ZK proofs, and swarm intelligence features.

  ## 1. New Tables

  ### `prediction_markets`
  - `id` (uuid, primary key)
  - `creator_id` (uuid, foreign key to users)
  - `title` (text) - Market question/title
  - `description` (text) - Detailed description
  - `category` (text) - price, volume, event, performance
  - `market_type` (text) - binary, scalar, categorical
  - `resolution_source` (text) - oracle, ai_consensus, manual
  - `target_asset` (text) - Token/asset being predicted
  - `resolution_criteria` (jsonb) - How market resolves
  - `resolution_value` (numeric, nullable) - Final resolved value
  - `total_volume` (numeric) - Total prediction volume
  - `total_participants` (integer) - Number of participants
  - `prize_pool` (numeric) - Total prize pool in SOL
  - `entry_fee` (numeric) - Fee to participate
  - `status` (text) - open, locked, resolving, resolved, cancelled
  - `opens_at` (timestamptz) - When predictions open
  - `locks_at` (timestamptz) - When predictions close
  - `resolves_at` (timestamptz) - When market resolves
  - `resolved_at` (timestamptz, nullable)
  - `metadata` (jsonb) - Additional market config
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `market_predictions`
  - `id` (uuid, primary key)
  - `market_id` (uuid, foreign key to prediction_markets)
  - `user_id` (uuid, foreign key to users)
  - `agent_swarm_id` (uuid, nullable, foreign key to agent_swarms)
  - `prediction_value` (numeric) - The prediction
  - `confidence` (numeric) - Confidence level 0-100
  - `stake_amount` (numeric) - Amount staked in SOL
  - `prediction_proof` (text) - ZK proof of prediction
  - `strategy_hash` (text) - Hash of strategy (keeps strategy private)
  - `ai_analysis` (jsonb) - AI agent analysis data
  - `encrypted_details` (text) - Encrypted prediction details
  - `revealed` (boolean) - Whether prediction is revealed
  - `payout` (numeric, nullable) - Payout received
  - `rank` (integer, nullable) - Final ranking
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `market_ai_analysis`
  - `id` (uuid, primary key)
  - `market_id` (uuid, foreign key to prediction_markets)
  - `agent_id` (uuid, foreign key to ai_agents)
  - `user_id` (uuid, foreign key to users)
  - `analysis_type` (text) - technical, sentiment, whale_tracking, historical
  - `prediction_value` (numeric)
  - `confidence_score` (numeric)
  - `reasoning` (jsonb) - AI reasoning data
  - `model_version` (text)
  - `features_used` (jsonb) - Features used in analysis
  - `accuracy_history` (numeric, nullable) - Historical accuracy
  - `created_at` (timestamptz)

  ### `swarm_predictions`
  - `id` (uuid, primary key)
  - `market_id` (uuid, foreign key to prediction_markets)
  - `swarm_id` (uuid, foreign key to agent_swarms)
  - `user_id` (uuid, foreign key to users)
  - `consensus_prediction` (numeric) - Swarm consensus value
  - `confidence` (numeric) - Swarm confidence
  - `agent_votes` (jsonb) - Individual agent predictions
  - `voting_power` (jsonb) - Weight of each agent
  - `stake_amount` (numeric)
  - `zk_proof` (text) - Proof of swarm computation
  - `performance_data` (jsonb) - Swarm performance metrics
  - `created_at` (timestamptz)

  ### `market_resolution_votes`
  - `id` (uuid, primary key)
  - `market_id` (uuid, foreign key to prediction_markets)
  - `voter_id` (uuid, foreign key to users)
  - `resolution_value` (numeric)
  - `vote_weight` (numeric) - Based on reputation/stake
  - `proof` (text) - ZK proof of vote
  - `created_at` (timestamptz)

  ### `prediction_leaderboard`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `total_predictions` (integer) - Total predictions made
  - `correct_predictions` (integer) - Correct predictions
  - `accuracy_rate` (numeric) - Overall accuracy percentage
  - `total_profit` (numeric) - Total profit in SOL
  - `total_volume` (numeric) - Total volume predicted
  - `reputation_score` (integer) - Reputation (0-10000)
  - `current_streak` (integer) - Current winning streak
  - `best_streak` (integer) - Best winning streak
  - `avg_confidence` (numeric) - Average confidence level
  - `specialization` (text, nullable) - Best category
  - `updated_at` (timestamptz)

  ## 2. Security
  
  - Enable RLS on all new tables
  - Add policies for authenticated users to manage their own data
  - Add policies for public viewing of markets and leaderboard
  - Restrict sensitive prediction data until market resolution

  ## 3. Indexes
  
  - Index foreign keys for performance
  - Index frequently queried fields (status, category, locks_at)
  - Index leaderboard rankings
*/

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS prediction_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('price', 'volume', 'event', 'performance', 'governance')),
  market_type text NOT NULL CHECK (market_type IN ('binary', 'scalar', 'categorical')),
  resolution_source text DEFAULT 'ai_consensus' CHECK (resolution_source IN ('oracle', 'ai_consensus', 'manual', 'on_chain')),
  target_asset text,
  resolution_criteria jsonb DEFAULT '{}'::jsonb,
  resolution_value numeric,
  total_volume numeric DEFAULT 0,
  total_participants integer DEFAULT 0,
  prize_pool numeric DEFAULT 0,
  entry_fee numeric DEFAULT 0.1,
  status text DEFAULT 'open' CHECK (status IN ('open', 'locked', 'resolving', 'resolved', 'cancelled')),
  opens_at timestamptz DEFAULT now(),
  locks_at timestamptz NOT NULL,
  resolves_at timestamptz NOT NULL,
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES prediction_markets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  agent_swarm_id uuid REFERENCES agent_swarms(id) ON DELETE SET NULL,
  prediction_value numeric NOT NULL,
  confidence numeric DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  stake_amount numeric NOT NULL CHECK (stake_amount > 0),
  prediction_proof text,
  strategy_hash text,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  encrypted_details text,
  revealed boolean DEFAULT false,
  payout numeric,
  rank integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(market_id, user_id)
);

CREATE TABLE IF NOT EXISTS market_ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES prediction_markets(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  analysis_type text NOT NULL CHECK (analysis_type IN ('technical', 'sentiment', 'whale_tracking', 'historical', 'pattern')),
  prediction_value numeric NOT NULL,
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning jsonb DEFAULT '{}'::jsonb,
  model_version text,
  features_used jsonb DEFAULT '[]'::jsonb,
  accuracy_history numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swarm_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES prediction_markets(id) ON DELETE CASCADE,
  swarm_id uuid REFERENCES agent_swarms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  consensus_prediction numeric NOT NULL,
  confidence numeric CHECK (confidence >= 0 AND confidence <= 100),
  agent_votes jsonb DEFAULT '[]'::jsonb,
  voting_power jsonb DEFAULT '{}'::jsonb,
  stake_amount numeric NOT NULL,
  zk_proof text,
  performance_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_resolution_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES prediction_markets(id) ON DELETE CASCADE,
  voter_id uuid REFERENCES users(id) ON DELETE CASCADE,
  resolution_value numeric NOT NULL,
  vote_weight numeric DEFAULT 1 CHECK (vote_weight > 0),
  proof text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(market_id, voter_id)
);

CREATE TABLE IF NOT EXISTS prediction_leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_predictions integer DEFAULT 0,
  correct_predictions integer DEFAULT 0,
  accuracy_rate numeric DEFAULT 0 CHECK (accuracy_rate >= 0 AND accuracy_rate <= 100),
  total_profit numeric DEFAULT 0,
  total_volume numeric DEFAULT 0,
  reputation_score integer DEFAULT 1000 CHECK (reputation_score >= 0 AND reputation_score <= 10000),
  current_streak integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  avg_confidence numeric DEFAULT 0,
  specialization text,
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prediction_markets_status ON prediction_markets(status);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_category ON prediction_markets(category);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_locks_at ON prediction_markets(locks_at);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_resolves_at ON prediction_markets(resolves_at);
CREATE INDEX IF NOT EXISTS idx_prediction_markets_creator ON prediction_markets(creator_id);

CREATE INDEX IF NOT EXISTS idx_market_predictions_market ON market_predictions(market_id);
CREATE INDEX IF NOT EXISTS idx_market_predictions_user ON market_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_market_predictions_swarm ON market_predictions(agent_swarm_id);

CREATE INDEX IF NOT EXISTS idx_market_ai_analysis_market ON market_ai_analysis(market_id);
CREATE INDEX IF NOT EXISTS idx_market_ai_analysis_agent ON market_ai_analysis(agent_id);

CREATE INDEX IF NOT EXISTS idx_swarm_predictions_market ON swarm_predictions(market_id);
CREATE INDEX IF NOT EXISTS idx_swarm_predictions_swarm ON swarm_predictions(swarm_id);

CREATE INDEX IF NOT EXISTS idx_market_resolution_votes_market ON market_resolution_votes(market_id);

CREATE INDEX IF NOT EXISTS idx_prediction_leaderboard_reputation ON prediction_leaderboard(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_leaderboard_accuracy ON prediction_leaderboard(accuracy_rate DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_leaderboard_profit ON prediction_leaderboard(total_profit DESC);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE prediction_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_resolution_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_leaderboard ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- PREDICTION_MARKETS POLICIES
CREATE POLICY "Anyone can view open markets"
  ON prediction_markets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create markets"
  ON prediction_markets FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = creator_id);

CREATE POLICY "Creators can update own markets"
  ON prediction_markets FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = creator_id)
  WITH CHECK ((select auth.uid()) = creator_id);

-- MARKET_PREDICTIONS POLICIES
CREATE POLICY "Users can view own predictions"
  ON market_predictions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can view revealed predictions"
  ON market_predictions FOR SELECT
  TO authenticated
  USING (revealed = true);

CREATE POLICY "Users can create predictions"
  ON market_predictions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own predictions"
  ON market_predictions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- MARKET_AI_ANALYSIS POLICIES
CREATE POLICY "Users can view own AI analysis"
  ON market_ai_analysis FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create AI analysis"
  ON market_ai_analysis FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- SWARM_PREDICTIONS POLICIES
CREATE POLICY "Users can view own swarm predictions"
  ON swarm_predictions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create swarm predictions"
  ON swarm_predictions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- MARKET_RESOLUTION_VOTES POLICIES
CREATE POLICY "Anyone can view resolution votes"
  ON market_resolution_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can submit resolution votes"
  ON market_resolution_votes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = voter_id);

-- PREDICTION_LEADERBOARD POLICIES
CREATE POLICY "Anyone can view leaderboard"
  ON prediction_leaderboard FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can update leaderboard"
  ON prediction_leaderboard FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can modify leaderboard"
  ON prediction_leaderboard FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_prediction_markets_updated_at
  BEFORE UPDATE ON prediction_markets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_predictions_updated_at
  BEFORE UPDATE ON market_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prediction_leaderboard_updated_at
  BEFORE UPDATE ON prediction_leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
