/*
  # Create Cross-Swarm Breeding & Evolution System

  This migration creates a comprehensive genetic breeding and evolution system for agent swarms,
  featuring trait inheritance, mutations, ZK-verified performance proofs, and NFT-based ownership.

  ## 1. New Tables

  ### `swarm_genetics`
  - `id` (uuid, primary key)
  - `swarm_id` (uuid, foreign key to agent_swarms, unique)
  - `user_id` (uuid, foreign key to users)
  - `genetic_sequence` (jsonb) - Full DNA/trait data
  - `dominant_traits` (jsonb) - Dominant gene expressions
  - `recessive_traits` (jsonb) - Recessive gene pool
  - `trait_scores` (jsonb) - 12 core trait values (0-100)
  - `genetic_fitness` (numeric) - Overall genetic quality score
  - `mutation_rate` (numeric) - Base mutation probability
  - `generation` (integer) - Generation number (1 = original)
  - `parent_ids` (jsonb) - Array of parent swarm IDs
  - `legendary_traits` (jsonb) - Rare/legendary trait collection
  - `trait_synergies` (jsonb) - Active trait combinations
  - `breeding_count` (integer) - Times bred as parent
  - `max_breeding` (integer) - Maximum breeding capacity
  - `last_bred_at` (timestamptz) - Last breeding timestamp
  - `nft_token_id` (text, nullable) - NFT identifier
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `breeding_contracts`
  - `id` (uuid, primary key)
  - `parent1_swarm_id` (uuid, foreign key to agent_swarms)
  - `parent2_swarm_id` (uuid, foreign key to agent_swarms)
  - `parent1_owner_id` (uuid, foreign key to users)
  - `parent2_owner_id` (uuid, foreign key to users)
  - `offspring_swarm_id` (uuid, nullable, foreign key to agent_swarms)
  - `offspring_owner_id` (uuid, foreign key to users)
  - `breeding_fee` (numeric) - Fee paid for breeding
  - `profit_share_percent` (numeric) - Offspring profit sharing
  - `profit_share_duration_days` (integer) - How long profit sharing lasts
  - `status` (text) - proposed, accepted, incubating, completed, cancelled
  - `parent1_performance_proof` (text) - ZK proof
  - `parent2_performance_proof` (text) - ZK proof
  - `compatibility_score` (numeric) - Genetic compatibility (0-100)
  - `predicted_fitness` (numeric) - Predicted offspring fitness
  - `contract_terms` (jsonb) - Additional contract details
  - `proposed_at` (timestamptz)
  - `accepted_at` (timestamptz)
  - `incubation_started_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `swarm_lineage`
  - `id` (uuid, primary key)
  - `swarm_id` (uuid, foreign key to agent_swarms, unique)
  - `generation` (integer) - Generation depth
  - `parent1_id` (uuid, nullable) - First parent
  - `parent2_id` (uuid, nullable) - Second parent
  - `ancestor_ids` (jsonb) - All ancestors
  - `descendant_ids` (jsonb) - All descendants
  - `bloodline_name` (text, nullable) - Named bloodlines
  - `bloodline_tier` (text) - common, rare, legendary, mythic
  - `inbreeding_coefficient` (numeric) - Genetic diversity score
  - `family_achievements` (jsonb) - Bloodline achievements
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `trait_mutations`
  - `id` (uuid, primary key)
  - `swarm_id` (uuid, foreign key to agent_swarms)
  - `genetics_id` (uuid, foreign key to swarm_genetics)
  - `mutation_type` (text) - beneficial, neutral, detrimental, legendary
  - `trait_affected` (text) - Which trait was mutated
  - `mutation_name` (text) - Name of mutation
  - `mutation_description` (text)
  - `rarity_tier` (text) - common, uncommon, rare, epic, legendary, mythic
  - `effect_value` (numeric) - Impact magnitude
  - `trigger_source` (text) - natural, lab, battle, event
  - `is_hereditary` (boolean) - Can pass to offspring
  - `visual_marker` (text, nullable) - Visual identifier
  - `occurred_at` (timestamptz)

  ### `breeding_marketplace`
  - `id` (uuid, primary key)
  - `swarm_id` (uuid, foreign key to agent_swarms)
  - `owner_id` (uuid, foreign key to users)
  - `listing_type` (text) - stud_service, breeding_request, rental
  - `breeding_fee` (numeric)
  - `profit_share_offered` (numeric)
  - `requirements` (jsonb) - Partner requirements
  - `performance_proof` (text) - ZK proof
  - `available_breedings` (integer)
  - `status` (text) - active, paused, completed
  - `views` (integer)
  - `proposals_received` (integer)
  - `listed_at` (timestamptz)
  - `expires_at` (timestamptz)

  ### `breeding_achievements`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `swarm_id` (uuid, foreign key to agent_swarms, nullable)
  - `achievement_type` (text) - first_breed, legendary_offspring, perfect_traits, etc.
  - `achievement_name` (text)
  - `achievement_description` (text)
  - `rarity` (text)
  - `rewards` (jsonb) - Bonus rewards
  - `earned_at` (timestamptz)

  ### `genetic_research`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `research_type` (text) - trait_analysis, breeding_simulation, gene_therapy
  - `subject_swarm_ids` (jsonb) - Swarms being researched
  - `research_data` (jsonb) - Research findings
  - `cost_paid` (numeric)
  - `status` (text) - in_progress, completed
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### `incubation_queue`
  - `id` (uuid, primary key)
  - `breeding_contract_id` (uuid, foreign key to breeding_contracts)
  - `user_id` (uuid, foreign key to users)
  - `incubation_duration_hours` (integer)
  - `progress_percent` (numeric)
  - `trait_revelations` (jsonb) - Traits revealed during incubation
  - `mutation_events` (jsonb) - Mutations that occurred
  - `estimated_completion` (timestamptz)
  - `accelerated` (boolean) - Paid for acceleration
  - `started_at` (timestamptz)

  ## 2. Security
  
  - Enable RLS on all new tables
  - Add policies for authenticated users to manage their own data
  - Add policies for public viewing of marketplace and achievements
  - Restrict genetic data access to swarm owners

  ## 3. Indexes
  
  - Index foreign keys for performance
  - Index marketplace status and listings
  - Index genetic fitness and generation
  - Index breeding availability
*/

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS swarm_genetics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES agent_swarms(id) ON DELETE CASCADE UNIQUE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  genetic_sequence jsonb DEFAULT '{}'::jsonb,
  dominant_traits jsonb DEFAULT '{}'::jsonb,
  recessive_traits jsonb DEFAULT '{}'::jsonb,
  trait_scores jsonb DEFAULT '{"aggression": 50, "patience": 50, "risk_tolerance": 50, "pattern_recognition": 50, "speed": 50, "adaptability": 50, "precision": 50, "endurance": 50, "learning_rate": 50, "intuition": 50, "discipline": 50, "creativity": 50}'::jsonb,
  genetic_fitness numeric DEFAULT 50 CHECK (genetic_fitness >= 0 AND genetic_fitness <= 100),
  mutation_rate numeric DEFAULT 5 CHECK (mutation_rate >= 0 AND mutation_rate <= 100),
  generation integer DEFAULT 1 CHECK (generation >= 1),
  parent_ids jsonb DEFAULT '[]'::jsonb,
  legendary_traits jsonb DEFAULT '[]'::jsonb,
  trait_synergies jsonb DEFAULT '[]'::jsonb,
  breeding_count integer DEFAULT 0 CHECK (breeding_count >= 0),
  max_breeding integer DEFAULT 5 CHECK (max_breeding > 0),
  last_bred_at timestamptz,
  nft_token_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS breeding_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent1_swarm_id uuid REFERENCES agent_swarms(id) ON DELETE CASCADE,
  parent2_swarm_id uuid REFERENCES agent_swarms(id) ON DELETE CASCADE,
  parent1_owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  parent2_owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  offspring_swarm_id uuid REFERENCES agent_swarms(id) ON DELETE SET NULL,
  offspring_owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  breeding_fee numeric DEFAULT 0 CHECK (breeding_fee >= 0),
  profit_share_percent numeric DEFAULT 0 CHECK (profit_share_percent >= 0 AND profit_share_percent <= 100),
  profit_share_duration_days integer DEFAULT 0,
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'incubating', 'completed', 'cancelled', 'rejected')),
  parent1_performance_proof text,
  parent2_performance_proof text,
  compatibility_score numeric CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  predicted_fitness numeric CHECK (predicted_fitness >= 0 AND predicted_fitness <= 100),
  contract_terms jsonb DEFAULT '{}'::jsonb,
  proposed_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  incubation_started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS swarm_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES agent_swarms(id) ON DELETE CASCADE UNIQUE,
  generation integer DEFAULT 1 CHECK (generation >= 1),
  parent1_id uuid,
  parent2_id uuid,
  ancestor_ids jsonb DEFAULT '[]'::jsonb,
  descendant_ids jsonb DEFAULT '[]'::jsonb,
  bloodline_name text,
  bloodline_tier text DEFAULT 'common' CHECK (bloodline_tier IN ('common', 'rare', 'legendary', 'mythic')),
  inbreeding_coefficient numeric DEFAULT 0 CHECK (inbreeding_coefficient >= 0 AND inbreeding_coefficient <= 1),
  family_achievements jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trait_mutations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES agent_swarms(id) ON DELETE CASCADE,
  genetics_id uuid REFERENCES swarm_genetics(id) ON DELETE CASCADE,
  mutation_type text NOT NULL CHECK (mutation_type IN ('beneficial', 'neutral', 'detrimental', 'legendary')),
  trait_affected text NOT NULL,
  mutation_name text NOT NULL,
  mutation_description text,
  rarity_tier text DEFAULT 'common' CHECK (rarity_tier IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  effect_value numeric DEFAULT 0,
  trigger_source text CHECK (trigger_source IN ('natural', 'lab', 'battle', 'event', 'generational')),
  is_hereditary boolean DEFAULT true,
  visual_marker text,
  occurred_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS breeding_marketplace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swarm_id uuid REFERENCES agent_swarms(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  listing_type text NOT NULL CHECK (listing_type IN ('stud_service', 'breeding_request', 'rental')),
  breeding_fee numeric NOT NULL CHECK (breeding_fee >= 0),
  profit_share_offered numeric DEFAULT 0 CHECK (profit_share_offered >= 0 AND profit_share_offered <= 100),
  requirements jsonb DEFAULT '{}'::jsonb,
  performance_proof text,
  available_breedings integer DEFAULT 1 CHECK (available_breedings > 0),
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
  views integer DEFAULT 0,
  proposals_received integer DEFAULT 0,
  listed_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS breeding_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  swarm_id uuid REFERENCES agent_swarms(id) ON DELETE SET NULL,
  achievement_type text NOT NULL,
  achievement_name text NOT NULL,
  achievement_description text,
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  rewards jsonb DEFAULT '{}'::jsonb,
  earned_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS genetic_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  research_type text NOT NULL CHECK (research_type IN ('trait_analysis', 'breeding_simulation', 'gene_therapy', 'mutation_study', 'compatibility_check')),
  subject_swarm_ids jsonb DEFAULT '[]'::jsonb,
  research_data jsonb DEFAULT '{}'::jsonb,
  cost_paid numeric DEFAULT 0,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS incubation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breeding_contract_id uuid REFERENCES breeding_contracts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  incubation_duration_hours integer DEFAULT 24 CHECK (incubation_duration_hours > 0),
  progress_percent numeric DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  trait_revelations jsonb DEFAULT '[]'::jsonb,
  mutation_events jsonb DEFAULT '[]'::jsonb,
  estimated_completion timestamptz NOT NULL,
  accelerated boolean DEFAULT false,
  started_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_swarm_genetics_swarm_id ON swarm_genetics(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_genetics_user_id ON swarm_genetics(user_id);
CREATE INDEX IF NOT EXISTS idx_swarm_genetics_generation ON swarm_genetics(generation);
CREATE INDEX IF NOT EXISTS idx_swarm_genetics_fitness ON swarm_genetics(genetic_fitness DESC);
CREATE INDEX IF NOT EXISTS idx_swarm_genetics_breeding_available ON swarm_genetics(breeding_count, max_breeding) WHERE breeding_count < max_breeding;

CREATE INDEX IF NOT EXISTS idx_breeding_contracts_parent1 ON breeding_contracts(parent1_swarm_id);
CREATE INDEX IF NOT EXISTS idx_breeding_contracts_parent2 ON breeding_contracts(parent2_swarm_id);
CREATE INDEX IF NOT EXISTS idx_breeding_contracts_status ON breeding_contracts(status);
CREATE INDEX IF NOT EXISTS idx_breeding_contracts_offspring ON breeding_contracts(offspring_swarm_id);

CREATE INDEX IF NOT EXISTS idx_swarm_lineage_swarm_id ON swarm_lineage(swarm_id);
CREATE INDEX IF NOT EXISTS idx_swarm_lineage_generation ON swarm_lineage(generation DESC);
CREATE INDEX IF NOT EXISTS idx_swarm_lineage_bloodline ON swarm_lineage(bloodline_tier);

CREATE INDEX IF NOT EXISTS idx_trait_mutations_swarm_id ON trait_mutations(swarm_id);
CREATE INDEX IF NOT EXISTS idx_trait_mutations_genetics_id ON trait_mutations(genetics_id);
CREATE INDEX IF NOT EXISTS idx_trait_mutations_rarity ON trait_mutations(rarity_tier);
CREATE INDEX IF NOT EXISTS idx_trait_mutations_type ON trait_mutations(mutation_type);

CREATE INDEX IF NOT EXISTS idx_breeding_marketplace_status ON breeding_marketplace(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_breeding_marketplace_owner ON breeding_marketplace(owner_id);
CREATE INDEX IF NOT EXISTS idx_breeding_marketplace_swarm ON breeding_marketplace(swarm_id);

CREATE INDEX IF NOT EXISTS idx_breeding_achievements_user ON breeding_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_achievements_rarity ON breeding_achievements(rarity);

CREATE INDEX IF NOT EXISTS idx_genetic_research_user ON genetic_research(user_id);
CREATE INDEX IF NOT EXISTS idx_genetic_research_status ON genetic_research(status);

CREATE INDEX IF NOT EXISTS idx_incubation_queue_user ON incubation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_incubation_queue_contract ON incubation_queue(breeding_contract_id);
CREATE INDEX IF NOT EXISTS idx_incubation_queue_completion ON incubation_queue(estimated_completion);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE swarm_genetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarm_lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE trait_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetic_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE incubation_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- SWARM_GENETICS POLICIES
CREATE POLICY "Users can view own swarm genetics"
  ON swarm_genetics FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Public can view basic genetics for marketplace"
  ON swarm_genetics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM breeding_marketplace
      WHERE breeding_marketplace.swarm_id = swarm_genetics.swarm_id
      AND breeding_marketplace.status = 'active'
    )
  );

CREATE POLICY "Users can create genetics for own swarms"
  ON swarm_genetics FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own swarm genetics"
  ON swarm_genetics FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- BREEDING_CONTRACTS POLICIES
CREATE POLICY "Users can view contracts they're involved in"
  ON breeding_contracts FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = parent1_owner_id OR
    (select auth.uid()) = parent2_owner_id OR
    (select auth.uid()) = offspring_owner_id
  );

CREATE POLICY "Users can create breeding contracts"
  ON breeding_contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = parent1_owner_id OR
    (select auth.uid()) = parent2_owner_id
  );

CREATE POLICY "Users can update contracts they're involved in"
  ON breeding_contracts FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = parent1_owner_id OR
    (select auth.uid()) = parent2_owner_id
  )
  WITH CHECK (
    (select auth.uid()) = parent1_owner_id OR
    (select auth.uid()) = parent2_owner_id
  );

-- SWARM_LINEAGE POLICIES
CREATE POLICY "Anyone can view lineage"
  ON swarm_lineage FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create lineage"
  ON swarm_lineage FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update lineage"
  ON swarm_lineage FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- TRAIT_MUTATIONS POLICIES
CREATE POLICY "Users can view mutations of own swarms"
  ON trait_mutations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agent_swarms
      WHERE agent_swarms.id = trait_mutations.swarm_id
      AND agent_swarms.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Public can view legendary mutations"
  ON trait_mutations FOR SELECT
  TO authenticated
  USING (mutation_type = 'legendary' OR rarity_tier IN ('legendary', 'mythic'));

CREATE POLICY "System can create mutations"
  ON trait_mutations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- BREEDING_MARKETPLACE POLICIES
CREATE POLICY "Anyone can view active marketplace listings"
  ON breeding_marketplace FOR SELECT
  TO authenticated
  USING (status = 'active' OR owner_id = (select auth.uid()));

CREATE POLICY "Users can create marketplace listings"
  ON breeding_marketplace FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Users can update own marketplace listings"
  ON breeding_marketplace FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

CREATE POLICY "Users can delete own marketplace listings"
  ON breeding_marketplace FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = owner_id);

-- BREEDING_ACHIEVEMENTS POLICIES
CREATE POLICY "Anyone can view achievements"
  ON breeding_achievements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create achievements"
  ON breeding_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- GENETIC_RESEARCH POLICIES
CREATE POLICY "Users can view own research"
  ON genetic_research FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create research"
  ON genetic_research FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own research"
  ON genetic_research FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- INCUBATION_QUEUE POLICIES
CREATE POLICY "Users can view own incubations"
  ON incubation_queue FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create incubations"
  ON incubation_queue FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own incubations"
  ON incubation_queue FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_swarm_genetics_updated_at
  BEFORE UPDATE ON swarm_genetics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swarm_lineage_updated_at
  BEFORE UPDATE ON swarm_lineage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
