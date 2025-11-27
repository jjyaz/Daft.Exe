/*
  # Create ZK Trading Strategy, Portfolio Analytics, and Signal Marketplace Systems

  This migration creates three comprehensive zero-knowledge systems:
  1. Trading Strategy Marketplace - Sell/rent strategies with ZK performance proofs
  2. Private Portfolio Analytics - Analyze holdings with ZK balance proofs
  3. zkML Signal Marketplace - AI signals with time-locks and verification

  ## 1. New Tables

  ### Trading Strategy Marketplace Tables

  #### `trading_strategies`
  - `id` (uuid, primary key)
  - `owner_id` (uuid, foreign key to users)
  - `strategy_name` (text) - Display name
  - `strategy_description` (text)
  - `strategy_type` (text) - trend_following, mean_reversion, arbitrage, etc.
  - `encrypted_code` (text) - Encrypted strategy logic
  - `encryption_key_hash` (text) - For buyer access
  - `performance_proof` (text) - ZK proof of returns
  - `verified_returns` (numeric) - Proven percentage returns
  - `backtest_period_days` (integer) - Testing period length
  - `risk_level` (text) - low, medium, high, extreme
  - `min_capital_required` (numeric) - Minimum investment needed
  - `nft_token_id` (text, nullable) - Strategy as NFT
  - `is_for_sale` (boolean)
  - `is_for_rent` (boolean)
  - `sale_price` (numeric)
  - `rental_price_daily` (numeric)
  - `royalty_percentage` (numeric) - Ongoing royalty on profits
  - `total_sales` (integer)
  - `total_rentals` (integer)
  - `reputation_score` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  #### `strategy_performance_history`
  - `id` (uuid, primary key)
  - `strategy_id` (uuid, foreign key to trading_strategies)
  - `period_start` (timestamptz)
  - `period_end` (timestamptz)
  - `total_trades` (integer)
  - `winning_trades` (integer)
  - `losing_trades` (integer)
  - `total_return_percent` (numeric)
  - `max_drawdown_percent` (numeric)
  - `sharpe_ratio` (numeric)
  - `performance_proof` (text) - ZK proof
  - `verified` (boolean)
  - `recorded_at` (timestamptz)

  #### `strategy_purchases`
  - `id` (uuid, primary key)
  - `strategy_id` (uuid, foreign key to trading_strategies)
  - `buyer_id` (uuid, foreign key to users)
  - `seller_id` (uuid, foreign key to users)
  - `purchase_type` (text) - sale, rental, license
  - `price_paid` (numeric)
  - `royalty_agreement` (jsonb)
  - `rental_start` (timestamptz, nullable)
  - `rental_end` (timestamptz, nullable)
  - `access_granted` (boolean)
  - `decryption_key` (text, nullable)
  - `total_profit_generated` (numeric)
  - `royalties_paid` (numeric)
  - `purchased_at` (timestamptz)

  #### `strategy_battles`
  - `id` (uuid, primary key)
  - `strategy1_id` (uuid, foreign key to trading_strategies)
  - `strategy2_id` (uuid, foreign key to trading_strategies)
  - `battle_type` (text) - live_trading, backtest, simulation
  - `start_capital` (numeric)
  - `duration_days` (integer)
  - `status` (text) - pending, active, completed
  - `winner_strategy_id` (uuid, nullable)
  - `strategy1_return` (numeric)
  - `strategy2_return` (numeric)
  - `performance_proof` (text)
  - `prize_pool` (numeric)
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### Portfolio Analytics Tables

  #### `portfolio_snapshots`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `snapshot_date` (timestamptz)
  - `encrypted_holdings` (text) - Encrypted position data
  - `total_value_proof` (text) - ZK proof of portfolio value
  - `verified_total_value` (numeric) - Proven without revealing holdings
  - `whale_tier` (text) - shrimp, fish, dolphin, whale, mega_whale
  - `risk_score` (numeric)
  - `diversification_score` (numeric)
  - `position_count` (integer)
  - `top_holding_percentage` (numeric) - Without revealing which token
  - `is_public` (boolean)

  #### `whale_verifications`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `verification_tier` (text) - bronze, silver, gold, platinum, diamond
  - `minimum_balance_proof` (text) - ZK proof of >$X balance
  - `verified_balance_range` (text) - $10k-$50k, $50k-$100k, etc.
  - `verification_date` (timestamptz)
  - `expires_at` (timestamptz)
  - `verification_signature` (text)
  - `perks_unlocked` (jsonb)
  - `is_active` (boolean)

  #### `private_analytics_requests`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `analysis_type` (text) - risk_assessment, tax_calc, rebalance, correlation
  - `encrypted_input_data` (text)
  - `analysis_result` (jsonb)
  - `zk_computation_proof` (text)
  - `status` (text) - pending, processing, completed, failed
  - `requested_at` (timestamptz)
  - `completed_at` (timestamptz)

  #### `reputation_proofs`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `proof_type` (text) - win_rate, profitability, volume, consistency
  - `claim` (text) - "Win rate > 70%", "Profit > $100k", etc.
  - `zk_proof` (text)
  - `verification_status` (text) - pending, verified, rejected
  - `verified_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `verification_metadata` (jsonb)

  ### Signal Marketplace Tables

  #### `trading_signals`
  - `id` (uuid, primary key)
  - `creator_id` (uuid, foreign key to users)
  - `signal_type` (text) - buy, sell, hold, alert
  - `token_symbol` (text)
  - `token_address` (text)
  - `encrypted_prediction` (text) - Time-locked prediction
  - `prediction_timelock` (timestamptz) - When prediction reveals
  - `confidence_level` (numeric) - 0-100
  - `target_price` (numeric, nullable)
  - `stop_loss` (numeric, nullable)
  - `take_profit` (numeric, nullable)
  - `reasoning_encrypted` (text) - Encrypted analysis
  - `signal_price` (numeric) - Cost to access
  - `performance_proof` (text) - ZK proof of past accuracy
  - `accuracy_rate` (numeric) - Proven historical accuracy
  - `subscribers_count` (integer)
  - `status` (text) - active, expired, settled
  - `actual_outcome` (text, nullable) - hit, miss, pending
  - `published_at` (timestamptz)
  - `expires_at` (timestamptz)

  #### `signal_subscriptions`
  - `id` (uuid, primary key)
  - `signal_id` (uuid, foreign key to trading_signals)
  - `subscriber_id` (uuid, foreign key to users)
  - `subscription_type` (text) - one_time, daily, weekly, monthly
  - `price_paid` (numeric)
  - `access_granted` (boolean)
  - `decryption_key` (text, nullable)
  - `profit_loss` (numeric, nullable)
  - `followed_signal` (boolean)
  - `subscribed_at` (timestamptz)
  - `access_expires_at` (timestamptz)

  #### `signal_performance_tracking`
  - `id` (uuid, primary key)
  - `creator_id` (uuid, foreign key to users)
  - `total_signals` (integer)
  - `correct_predictions` (integer)
  - `incorrect_predictions` (integer)
  - `pending_predictions` (integer)
  - `accuracy_rate` (numeric)
  - `avg_confidence` (numeric)
  - `total_subscriber_profit` (numeric)
  - `reputation_score` (integer)
  - `performance_proof` (text) - ZK proof
  - `last_updated` (timestamptz)

  #### `signal_reveals`
  - `id` (uuid, primary key)
  - `signal_id` (uuid, foreign key to trading_signals)
  - `reveal_time` (timestamptz)
  - `original_prediction_hash` (text) - Hash of encrypted prediction
  - `revealed_prediction` (jsonb)
  - `actual_outcome` (jsonb)
  - `accuracy_verified` (boolean)
  - `proof_of_pre_commitment` (text) - ZK proof prediction was made before

  #### `ml_models`
  - `id` (uuid, primary key)
  - `owner_id` (uuid, foreign key to users)
  - `model_name` (text)
  - `model_type` (text) - price_prediction, sentiment, risk, pattern
  - `encrypted_model` (text) - Model weights encrypted
  - `architecture_hash` (text)
  - `training_proof` (text) - ZK proof of proper training
  - `performance_metrics` (jsonb)
  - `accuracy_proof` (text)
  - `is_public` (boolean)
  - `license_price` (numeric)
  - `inference_price` (numeric) - Per prediction cost
  - `total_inferences` (integer)
  - `created_at` (timestamptz)

  ## 2. Security
  
  - Enable RLS on all new tables
  - Add policies for authenticated users to manage their own data
  - Add policies for public viewing of verified proofs and marketplace listings
  - Restrict encrypted data access to owners and purchasers

  ## 3. Indexes
  
  - Index foreign keys for performance
  - Index marketplace status and listings
  - Index verification status
  - Index time-locks and expiration dates
*/

-- ============================================================================
-- TRADING STRATEGY MARKETPLACE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS trading_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  strategy_name text NOT NULL,
  strategy_description text,
  strategy_type text NOT NULL CHECK (strategy_type IN ('trend_following', 'mean_reversion', 'arbitrage', 'momentum', 'breakout', 'scalping', 'swing', 'position', 'custom')),
  encrypted_code text NOT NULL,
  encryption_key_hash text NOT NULL,
  performance_proof text,
  verified_returns numeric DEFAULT 0,
  backtest_period_days integer DEFAULT 0,
  risk_level text DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'extreme')),
  min_capital_required numeric DEFAULT 0,
  nft_token_id text,
  is_for_sale boolean DEFAULT false,
  is_for_rent boolean DEFAULT false,
  sale_price numeric DEFAULT 0,
  rental_price_daily numeric DEFAULT 0,
  royalty_percentage numeric DEFAULT 0 CHECK (royalty_percentage >= 0 AND royalty_percentage <= 50),
  total_sales integer DEFAULT 0,
  total_rentals integer DEFAULT 0,
  reputation_score integer DEFAULT 0 CHECK (reputation_score >= 0 AND reputation_score <= 1000),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS strategy_performance_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid REFERENCES trading_strategies(id) ON DELETE CASCADE,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  total_trades integer DEFAULT 0,
  winning_trades integer DEFAULT 0,
  losing_trades integer DEFAULT 0,
  total_return_percent numeric DEFAULT 0,
  max_drawdown_percent numeric DEFAULT 0,
  sharpe_ratio numeric DEFAULT 0,
  performance_proof text,
  verified boolean DEFAULT false,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS strategy_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id uuid REFERENCES trading_strategies(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES users(id) ON DELETE CASCADE,
  purchase_type text NOT NULL CHECK (purchase_type IN ('sale', 'rental', 'license')),
  price_paid numeric NOT NULL,
  royalty_agreement jsonb DEFAULT '{}'::jsonb,
  rental_start timestamptz,
  rental_end timestamptz,
  access_granted boolean DEFAULT false,
  decryption_key text,
  total_profit_generated numeric DEFAULT 0,
  royalties_paid numeric DEFAULT 0,
  purchased_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS strategy_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy1_id uuid REFERENCES trading_strategies(id) ON DELETE CASCADE,
  strategy2_id uuid REFERENCES trading_strategies(id) ON DELETE CASCADE,
  battle_type text NOT NULL CHECK (battle_type IN ('live_trading', 'backtest', 'simulation')),
  start_capital numeric NOT NULL,
  duration_days integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  winner_strategy_id uuid,
  strategy1_return numeric,
  strategy2_return numeric,
  performance_proof text,
  prize_pool numeric DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PORTFOLIO ANALYTICS TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date timestamptz DEFAULT now(),
  encrypted_holdings text,
  total_value_proof text,
  verified_total_value numeric DEFAULT 0,
  whale_tier text DEFAULT 'shrimp' CHECK (whale_tier IN ('shrimp', 'fish', 'dolphin', 'whale', 'mega_whale')),
  risk_score numeric DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
  diversification_score numeric DEFAULT 50 CHECK (diversification_score >= 0 AND diversification_score <= 100),
  position_count integer DEFAULT 0,
  top_holding_percentage numeric DEFAULT 0,
  is_public boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS whale_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  verification_tier text NOT NULL CHECK (verification_tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  minimum_balance_proof text NOT NULL,
  verified_balance_range text NOT NULL,
  verification_date timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  verification_signature text,
  perks_unlocked jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS private_analytics_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  analysis_type text NOT NULL CHECK (analysis_type IN ('risk_assessment', 'tax_calculation', 'rebalance_suggestion', 'correlation_analysis', 'performance_report', 'yield_optimization')),
  encrypted_input_data text NOT NULL,
  analysis_result jsonb DEFAULT '{}'::jsonb,
  zk_computation_proof text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS reputation_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  proof_type text NOT NULL CHECK (proof_type IN ('win_rate', 'profitability', 'volume', 'consistency', 'risk_management')),
  claim text NOT NULL,
  zk_proof text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at timestamptz,
  expires_at timestamptz,
  verification_metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- SIGNAL MARKETPLACE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS trading_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold', 'alert', 'warning')),
  token_symbol text NOT NULL,
  token_address text,
  encrypted_prediction text NOT NULL,
  prediction_timelock timestamptz NOT NULL,
  confidence_level numeric NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
  target_price numeric,
  stop_loss numeric,
  take_profit numeric,
  reasoning_encrypted text,
  signal_price numeric DEFAULT 0,
  performance_proof text,
  accuracy_rate numeric DEFAULT 0,
  subscribers_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'settled', 'cancelled')),
  actual_outcome text CHECK (actual_outcome IN ('hit', 'miss', 'pending', 'partial')),
  published_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS signal_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid REFERENCES trading_signals(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subscription_type text NOT NULL CHECK (subscription_type IN ('one_time', 'daily', 'weekly', 'monthly')),
  price_paid numeric NOT NULL,
  access_granted boolean DEFAULT false,
  decryption_key text,
  profit_loss numeric,
  followed_signal boolean DEFAULT false,
  subscribed_at timestamptz DEFAULT now(),
  access_expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS signal_performance_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_signals integer DEFAULT 0,
  correct_predictions integer DEFAULT 0,
  incorrect_predictions integer DEFAULT 0,
  pending_predictions integer DEFAULT 0,
  accuracy_rate numeric DEFAULT 0,
  avg_confidence numeric DEFAULT 0,
  total_subscriber_profit numeric DEFAULT 0,
  reputation_score integer DEFAULT 0 CHECK (reputation_score >= 0 AND reputation_score <= 1000),
  performance_proof text,
  last_updated timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS signal_reveals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id uuid REFERENCES trading_signals(id) ON DELETE CASCADE,
  reveal_time timestamptz NOT NULL,
  original_prediction_hash text NOT NULL,
  revealed_prediction jsonb NOT NULL,
  actual_outcome jsonb,
  accuracy_verified boolean DEFAULT false,
  proof_of_pre_commitment text
);

CREATE TABLE IF NOT EXISTS ml_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  model_name text NOT NULL,
  model_type text NOT NULL CHECK (model_type IN ('price_prediction', 'sentiment_analysis', 'risk_assessment', 'pattern_recognition', 'anomaly_detection')),
  encrypted_model text NOT NULL,
  architecture_hash text NOT NULL,
  training_proof text,
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  accuracy_proof text,
  is_public boolean DEFAULT false,
  license_price numeric DEFAULT 0,
  inference_price numeric DEFAULT 0,
  total_inferences integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_trading_strategies_owner ON trading_strategies(owner_id);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_for_sale ON trading_strategies(is_for_sale) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_trading_strategies_for_rent ON trading_strategies(is_for_rent) WHERE is_for_rent = true;
CREATE INDEX IF NOT EXISTS idx_trading_strategies_type ON trading_strategies(strategy_type);
CREATE INDEX IF NOT EXISTS idx_trading_strategies_reputation ON trading_strategies(reputation_score DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_performance_strategy ON strategy_performance_history(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_performance_verified ON strategy_performance_history(verified) WHERE verified = true;

CREATE INDEX IF NOT EXISTS idx_strategy_purchases_buyer ON strategy_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_strategy_purchases_seller ON strategy_purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_strategy_purchases_strategy ON strategy_purchases(strategy_id);

CREATE INDEX IF NOT EXISTS idx_strategy_battles_status ON strategy_battles(status);
CREATE INDEX IF NOT EXISTS idx_strategy_battles_strategies ON strategy_battles(strategy1_id, strategy2_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user ON portfolio_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_public ON portfolio_snapshots(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_whale_tier ON portfolio_snapshots(whale_tier);

CREATE INDEX IF NOT EXISTS idx_whale_verifications_user ON whale_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_whale_verifications_active ON whale_verifications(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_whale_verifications_tier ON whale_verifications(verification_tier);

CREATE INDEX IF NOT EXISTS idx_analytics_requests_user ON private_analytics_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_requests_status ON private_analytics_requests(status);

CREATE INDEX IF NOT EXISTS idx_reputation_proofs_user ON reputation_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_proofs_status ON reputation_proofs(verification_status);

CREATE INDEX IF NOT EXISTS idx_trading_signals_creator ON trading_signals(creator_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_status ON trading_signals(status);
CREATE INDEX IF NOT EXISTS idx_trading_signals_token ON trading_signals(token_symbol);
CREATE INDEX IF NOT EXISTS idx_trading_signals_timelock ON trading_signals(prediction_timelock);

CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_signal ON signal_subscriptions(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_subscriber ON signal_subscriptions(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_signal_performance_creator ON signal_performance_tracking(creator_id);

CREATE INDEX IF NOT EXISTS idx_signal_reveals_signal ON signal_reveals(signal_id);

CREATE INDEX IF NOT EXISTS idx_ml_models_owner ON ml_models(owner_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_public ON ml_models(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(model_type);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_performance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_analytics_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_reveals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- TRADING_STRATEGIES POLICIES
CREATE POLICY "Users can view marketplace strategies"
  ON trading_strategies FOR SELECT
  TO authenticated
  USING (is_for_sale = true OR is_for_rent = true OR owner_id = (select auth.uid()));

CREATE POLICY "Users can view own strategies"
  ON trading_strategies FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

CREATE POLICY "Users can create strategies"
  ON trading_strategies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can update own strategies"
  ON trading_strategies FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can delete own strategies"
  ON trading_strategies FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- STRATEGY_PERFORMANCE_HISTORY POLICIES
CREATE POLICY "Anyone can view verified performance"
  ON strategy_performance_history FOR SELECT
  TO authenticated
  USING (verified = true);

CREATE POLICY "System can create performance records"
  ON strategy_performance_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- STRATEGY_PURCHASES POLICIES
CREATE POLICY "Users can view own purchases"
  ON strategy_purchases FOR SELECT
  TO authenticated
  USING (buyer_id = (select auth.uid()) OR seller_id = (select auth.uid()));

CREATE POLICY "Users can create purchases"
  ON strategy_purchases FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = (select auth.uid()));

CREATE POLICY "Users can update own purchases"
  ON strategy_purchases FOR UPDATE
  TO authenticated
  USING (buyer_id = (select auth.uid()) OR seller_id = (select auth.uid()))
  WITH CHECK (buyer_id = (select auth.uid()) OR seller_id = (select auth.uid()));

-- STRATEGY_BATTLES POLICIES
CREATE POLICY "Anyone can view battles"
  ON strategy_battles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create battles with own strategies"
  ON strategy_battles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trading_strategies
      WHERE id = strategy1_id AND owner_id = (select auth.uid())
    )
  );

-- PORTFOLIO_SNAPSHOTS POLICIES
CREATE POLICY "Users can view own snapshots"
  ON portfolio_snapshots FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Anyone can view public snapshots"
  ON portfolio_snapshots FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create snapshots"
  ON portfolio_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own snapshots"
  ON portfolio_snapshots FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- WHALE_VERIFICATIONS POLICIES
CREATE POLICY "Users can view own verifications"
  ON whale_verifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Anyone can view active whale tiers"
  ON whale_verifications FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can create verifications"
  ON whale_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- PRIVATE_ANALYTICS_REQUESTS POLICIES
CREATE POLICY "Users can view own analytics"
  ON private_analytics_requests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create analytics requests"
  ON private_analytics_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own analytics"
  ON private_analytics_requests FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- REPUTATION_PROOFS POLICIES
CREATE POLICY "Anyone can view verified proofs"
  ON reputation_proofs FOR SELECT
  TO authenticated
  USING (verification_status = 'verified' OR user_id = (select auth.uid()));

CREATE POLICY "Users can create proofs"
  ON reputation_proofs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- TRADING_SIGNALS POLICIES
CREATE POLICY "Anyone can view active signals"
  ON trading_signals FOR SELECT
  TO authenticated
  USING (status = 'active' OR creator_id = (select auth.uid()));

CREATE POLICY "Users can create signals"
  ON trading_signals FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = (select auth.uid()));

CREATE POLICY "Users can update own signals"
  ON trading_signals FOR UPDATE
  TO authenticated
  USING (creator_id = (select auth.uid()))
  WITH CHECK (creator_id = (select auth.uid()));

-- SIGNAL_SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can view own subscriptions"
  ON signal_subscriptions FOR SELECT
  TO authenticated
  USING (subscriber_id = (select auth.uid()));

CREATE POLICY "Creators can view their signal subscriptions"
  ON signal_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trading_signals
      WHERE trading_signals.id = signal_subscriptions.signal_id
      AND trading_signals.creator_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create subscriptions"
  ON signal_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (subscriber_id = (select auth.uid()));

-- SIGNAL_PERFORMANCE_TRACKING POLICIES
CREATE POLICY "Anyone can view signal performance"
  ON signal_performance_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can upsert performance"
  ON signal_performance_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update performance"
  ON signal_performance_tracking FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- SIGNAL_REVEALS POLICIES
CREATE POLICY "Anyone can view reveals"
  ON signal_reveals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create reveals"
  ON signal_reveals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ML_MODELS POLICIES
CREATE POLICY "Users can view own models"
  ON ml_models FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

CREATE POLICY "Anyone can view public models"
  ON ml_models FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create models"
  ON ml_models FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Users can update own models"
  ON ml_models FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_trading_strategies_updated_at
  BEFORE UPDATE ON trading_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
