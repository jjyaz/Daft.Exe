/*
  # Create Staking Pools Schema

  1. New Tables
    - `staking_pools`
      - `id` (uuid, primary key)
      - `name` (text) - Pool name (e.g., "SOL-USDC")
      - `token_a` (text) - First token symbol
      - `token_b` (text) - Second token symbol
      - `apy` (numeric) - Annual percentage yield
      - `tvl` (text) - Total value locked
      - `min_stake` (numeric) - Minimum stake amount
      - `active` (boolean) - Whether pool is active
      - `created_at` (timestamptz)
    
    - `user_stakes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `pool_id` (uuid, foreign key to staking_pools)
      - `amount` (numeric) - Staked amount
      - `rewards_earned` (numeric) - Rewards accumulated
      - `staked_at` (timestamptz)
      - `last_claim` (timestamptz)
      - `active` (boolean) - Whether stake is active
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read all pools
    - Add policies for users to manage their own stakes
*/

CREATE TABLE IF NOT EXISTS staking_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token_a text NOT NULL,
  token_b text NOT NULL,
  apy numeric NOT NULL DEFAULT 0,
  tvl text NOT NULL DEFAULT '0',
  min_stake numeric NOT NULL DEFAULT 0.1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  pool_id uuid REFERENCES staking_pools(id),
  amount numeric NOT NULL,
  rewards_earned numeric DEFAULT 0,
  staked_at timestamptz DEFAULT now(),
  last_claim timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

ALTER TABLE staking_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active staking pools"
  ON staking_pools FOR SELECT
  USING (active = true);

CREATE POLICY "Users can view their own stakes"
  ON user_stakes FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' LIMIT 1));

CREATE POLICY "Users can insert their own stakes"
  ON user_stakes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' LIMIT 1));

CREATE POLICY "Users can update their own stakes"
  ON user_stakes FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' LIMIT 1))
  WITH CHECK (user_id = (SELECT id FROM users WHERE wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address' LIMIT 1));

INSERT INTO staking_pools (name, token_a, token_b, apy, tvl, min_stake) VALUES
  ('SOL-USDC', 'SOL', 'USDC', 12.5, '2300000', 0.1),
  ('DAFT-SOL', 'DAFT', 'SOL', 24.8, '850000', 0.5),
  ('BONK-SOL', 'BONK', 'SOL', 18.2, '1100000', 1.0)
ON CONFLICT DO NOTHING;
