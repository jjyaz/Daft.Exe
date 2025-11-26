/*
  # Create Swarm Intelligence System

  This migration creates the database schema for Phase 1: Swarm Intelligence features.

  ## 1. New Tables
  
  ### `agent_swarms`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `name` (text) - User-given name for the swarm
  - `agent_ids` (jsonb) - Array of agent IDs in this swarm
  - `total_trades` (integer) - Total number of trades executed
  - `win_rate` (numeric) - Percentage of profitable trades
  - `total_profit` (numeric) - Total profit in SOL
  - `reputation_score` (integer) - Overall reputation (0-1000)
  - `strategy_type` (text) - Main strategy (scalping, swing, whale_following, etc)
  - `active` (boolean) - Whether swarm is currently active
  - `last_active` (timestamptz) - Last time swarm executed a trade
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `swarm_battles`
  - `id` (uuid, primary key)
  - `battle_type` (text) - Type: 1v1, tournament, free_for_all
  - `status` (text) - pending, active, completed, cancelled
  - `start_time` (timestamptz)
  - `end_time` (timestamptz)
  - `prize_pool` (numeric) - Total prize in SOL
  - `entry_fee` (numeric) - Entry fee in SOL
  - `winner_swarm_id` (uuid, nullable)
  - `config` (jsonb) - Battle configuration (duration, rules, etc)
  - `created_at` (timestamptz)

  ### `battle_participants`
  - `id` (uuid, primary key)
  - `battle_id` (uuid, foreign key to swarm_battles)
  - `swarm_id` (uuid, foreign key to agent_swarms)
  - `user_id` (uuid, foreign key to users)
  - `starting_capital` (numeric) - Capital at battle start
  - `final_capital` (numeric, nullable) - Capital at battle end
  - `profit_loss` (numeric, nullable) - Net profit/loss
  - `trades_executed` (integer) - Number of trades in battle
  - `rank` (integer, nullable) - Final ranking
  - `joined_at` (timestamptz)

  ### `agent_evolution`
  - `id` (uuid, primary key)
  - `agent_id` (uuid, foreign key to ai_agents)
  - `user_id` (uuid, foreign key to users)
  - `level` (integer) - Agent level (1-100)
  - `experience` (integer) - XP points
  - `generation` (integer) - How many times bred/evolved
  - `parent_ids` (jsonb, nullable) - IDs of parent agents if bred
  - `traits` (jsonb) - Learned traits and specializations
  - `mutation_count` (integer) - Number of mutations/improvements
  - `performance_history` (jsonb) - Historical performance data
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `swarm_activities`
  - `id` (uuid, primary key)
  - `swarm_id` (uuid, foreign key to agent_swarms)
  - `activity_type` (text) - scan, trade, alert, evolution, battle
  - `description` (text)
  - `metadata` (jsonb) - Additional data (token found, profit made, etc)
  - `success` (boolean)
  - `created_at` (timestamptz)

  ### `agent_marketplace`
  - `id` (uuid, primary key)
  - `agent_id` (uuid, foreign key to ai_agents)
  - `seller_id` (uuid, foreign key to users)
  - `price_sol` (numeric)
  - `listing_type` (text) - sale, rent_hourly, rent_daily
  - `rental_duration` (integer, nullable) - Duration in hours/days
  - `performance_proof` (text, nullable) - ZK proof of performance
  - `status` (text) - active, sold, rented, cancelled
  - `views` (integer) - Number of views
  - `listed_at` (timestamptz)
  - `sold_at` (timestamptz, nullable)

  ## 2. Security
  
  - Enable RLS on all new tables
  - Add policies for authenticated users to manage their own data
  - Add policies for public viewing of leaderboards and marketplace

  ## 3. Indexes
  
  - Index foreign keys for performance
  - Index frequently queried fields (status, active, reputation_score)
*/

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_swarms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  agent_ids jsonb DEFAULT '[]'::jsonb,
  total_trades integer DEFAULT 0,
  win_rate numeric DEFAULT 0 CHECK (win_rate >= 0 AND win_rate <= 100),
  total_profit numeric DEFAULT 0,
  reputation_score integer DEFAULT 0 CHECK (reputation_score >= 0 AND reputation_score <= 1000),
  strategy_type text DEFAULT 'balanced',
  active boolean DEFAULT true,
  last_active timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swarm_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_type text NOT NULL CHECK (battle_type IN ('1v1', 'tournament', 'free_for_all')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  start_time timestamptz,
  end_time timestamptz,
  prize_pool numeric DEFAULT 0,
  entry_fee numeric DEFAULT 0,
  winner_swarm_id uuid REFERENCES agent_swarms(id) ON DELETE SET NULL,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS battle_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid REFERENCES swarm_battles(id) ON DELETE CASCADE,
  swarm_id uuid REFERENCES agent_swarms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  starting_capital numeric NOT NULL,
  final_capital numeric,
  profit_loss numeric,
  trades_executed integer DEFAULT 0,
  rank integer,
  joined_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_evolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  level integer DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  experience integer DEFAULT 0,
  generation integer DEFAULT 1,
  parent_ids jsonb DEFAULT '[]'::jsonb,
  traits jsonb DEFAULT '{}'::jsonb,
  mutation_count integer DEFAULT 0,
  performance_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swarm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES agent_swarms(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('scan', 'trade', 'alert', 'evolution', 'battle')),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_marketplace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES ai_agents(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  price_sol numeric NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('sale', 'rent_hourly', 'rent_daily')),
  rental_duration integer,
  performance_proof text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'rented', 'cancelled')),
  views integer DEFAULT 0,
  listed_at timestamptz DEFAULT now(),
  sold_at timestamptz
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_agent_swarms_user_id ON agent_swarms(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_swarms_reputation ON agent_swarms(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_agent_swarms_active ON agent_swarms(active) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_swarm_battles_status ON swarm_battles(status);
CREATE INDEX IF NOT EXISTS idx_swarm_battles_start_time ON swarm_battles(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_battle_participants_battle_id ON battle_participants(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_swarm_id ON battle_participants(swarm_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_user_id ON battle_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_agent_evolution_agent_id ON agent_evolution(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_evolution_user_id ON agent_evolution(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_evolution_level ON agent_evolution(level DESC);

CREATE INDEX IF NOT EXISTS idx_swarm_activities_swarm_id ON swarm_activities(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_activities_created_at ON swarm_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_marketplace_status ON agent_marketplace(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_agent_marketplace_seller_id ON agent_marketplace(seller_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE agent_swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_evolution ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_marketplace ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- AGENT_SWARMS POLICIES
CREATE POLICY "Users can view own swarms"
  ON agent_swarms FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Public can view swarm leaderboard"
  ON agent_swarms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own swarms"
  ON agent_swarms FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own swarms"
  ON agent_swarms FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own swarms"
  ON agent_swarms FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- SWARM_BATTLES POLICIES
CREATE POLICY "Anyone can view battles"
  ON swarm_battles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create battles"
  ON swarm_battles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- BATTLE_PARTICIPANTS POLICIES
CREATE POLICY "Anyone can view participants"
  ON battle_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join battles"
  ON battle_participants FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- AGENT_EVOLUTION POLICIES
CREATE POLICY "Users can view own agent evolution"
  ON agent_evolution FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create agent evolution"
  ON agent_evolution FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own agent evolution"
  ON agent_evolution FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- SWARM_ACTIVITIES POLICIES
CREATE POLICY "Users can view activities for own swarms"
  ON swarm_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agent_swarms
      WHERE agent_swarms.id = swarm_activities.swarm_id
      AND agent_swarms.user_id = (select auth.uid())
    )
  );

CREATE POLICY "System can create swarm activities"
  ON swarm_activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- AGENT_MARKETPLACE POLICIES
CREATE POLICY "Anyone can view active listings"
  ON agent_marketplace FOR SELECT
  TO authenticated
  USING (status = 'active' OR seller_id = (select auth.uid()));

CREATE POLICY "Users can create listings"
  ON agent_marketplace FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = seller_id);

CREATE POLICY "Users can update own listings"
  ON agent_marketplace FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = seller_id)
  WITH CHECK ((select auth.uid()) = seller_id);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_agent_swarms_updated_at
  BEFORE UPDATE ON agent_swarms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_evolution_updated_at
  BEFORE UPDATE ON agent_evolution
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
