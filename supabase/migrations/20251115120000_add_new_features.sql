/*
  # Add New DeFi Features

  1. New Tables
    - `price_alerts` - User price alerts for tokens
    - `watched_wallets` - Multi-wallet management
    - `token_reviews` - Community token ratings and comments
    - `whale_watches` - Track large wallet movements
    - `swap_transactions` - Record token swaps
    - `validator_stakes` - Track real validator staking

  2. Changes
    - Add leaderboard views
    - Add user statistics aggregates

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Price Alerts Table
CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  token_address text NOT NULL,
  token_symbol text NOT NULL,
  target_price numeric NOT NULL,
  condition text NOT NULL CHECK (condition IN ('above', 'below')),
  triggered boolean DEFAULT false,
  triggered_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON price_alerts FOR SELECT
  TO authenticated
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can create own alerts"
  ON price_alerts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own alerts"
  ON price_alerts FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete own alerts"
  ON price_alerts FOR DELETE
  TO authenticated
  USING (user_id = current_setting('app.user_id', true));

-- Watched Wallets Table
CREATE TABLE IF NOT EXISTS watched_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  wallet_address text NOT NULL,
  nickname text,
  notes text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, wallet_address)
);

ALTER TABLE watched_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watched wallets"
  ON watched_wallets FOR SELECT
  TO authenticated
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can create own watched wallets"
  ON watched_wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own watched wallets"
  ON watched_wallets FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete own watched wallets"
  ON watched_wallets FOR DELETE
  TO authenticated
  USING (user_id = current_setting('app.user_id', true));

-- Token Reviews Table
CREATE TABLE IF NOT EXISTS token_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  token_address text NOT NULL,
  token_symbol text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token_address)
);

ALTER TABLE token_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON token_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON token_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own reviews"
  ON token_reviews FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete own reviews"
  ON token_reviews FOR DELETE
  TO authenticated
  USING (user_id = current_setting('app.user_id', true));

-- Whale Watches Table
CREATE TABLE IF NOT EXISTS whale_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  whale_address text NOT NULL,
  nickname text,
  min_transaction_amount numeric DEFAULT 100,
  notify_on_transaction boolean DEFAULT true,
  last_checked timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, whale_address)
);

ALTER TABLE whale_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own whale watches"
  ON whale_watches FOR SELECT
  TO authenticated
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can create own whale watches"
  ON whale_watches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own whale watches"
  ON whale_watches FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete own whale watches"
  ON whale_watches FOR DELETE
  TO authenticated
  USING (user_id = current_setting('app.user_id', true));

-- Whale Transactions Table
CREATE TABLE IF NOT EXISTS whale_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whale_address text NOT NULL,
  signature text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  token_symbol text,
  from_address text,
  to_address text,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE whale_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view whale transactions"
  ON whale_transactions FOR SELECT
  TO authenticated
  USING (true);

-- Swap Transactions Table
CREATE TABLE IF NOT EXISTS swap_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  from_token text NOT NULL,
  to_token text NOT NULL,
  from_amount numeric NOT NULL,
  to_amount numeric NOT NULL,
  from_symbol text,
  to_symbol text,
  signature text,
  price_impact numeric,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE swap_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swaps"
  ON swap_transactions FOR SELECT
  TO authenticated
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can create own swaps"
  ON swap_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- Validator Stakes Table
CREATE TABLE IF NOT EXISTS validator_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  validator_address text NOT NULL,
  validator_name text,
  stake_account text,
  amount numeric NOT NULL,
  rewards_earned numeric DEFAULT 0,
  apy numeric,
  status text DEFAULT 'active' CHECK (status IN ('active', 'deactivating', 'inactive')),
  staked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE validator_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own validator stakes"
  ON validator_stakes FOR SELECT
  TO authenticated
  USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can create own validator stakes"
  ON validator_stakes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own validator stakes"
  ON validator_stakes FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));

-- Leaderboard View for Token Creators
CREATE OR REPLACE VIEW leaderboard_creators AS
SELECT
  user_id,
  COUNT(*) as tokens_created,
  COUNT(CASE WHEN deployed = true THEN 1 END) as tokens_deployed,
  MAX(created_at) as last_token_created
FROM memecoins
GROUP BY user_id
ORDER BY tokens_deployed DESC, tokens_created DESC;

-- Leaderboard View for Top Reviewers
CREATE OR REPLACE VIEW leaderboard_reviewers AS
SELECT
  user_id,
  COUNT(*) as reviews_count,
  AVG(rating) as avg_rating_given,
  SUM(helpful_count) as total_helpful_votes
FROM token_reviews
GROUP BY user_id
ORDER BY reviews_count DESC, total_helpful_votes DESC;

-- Leaderboard View for Top Stakers
CREATE OR REPLACE VIEW leaderboard_stakers AS
SELECT
  user_id,
  SUM(amount) as total_staked,
  SUM(rewards_earned) as total_rewards,
  COUNT(*) as active_stakes
FROM user_stakes
WHERE active = true
GROUP BY user_id
ORDER BY total_staked DESC, total_rewards DESC;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_price_alerts_token ON price_alerts(token_address) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_watched_wallets_user ON watched_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_token_reviews_token ON token_reviews(token_address);
CREATE INDEX IF NOT EXISTS idx_token_reviews_rating ON token_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_whale_watches_user ON whale_watches(user_id);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_address ON whale_transactions(whale_address);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_timestamp ON whale_transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_swap_transactions_user ON swap_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_validator_stakes_user ON validator_stakes(user_id) WHERE status = 'active';
