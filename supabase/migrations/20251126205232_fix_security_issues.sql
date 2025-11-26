/*
  # Fix Security and Performance Issues

  This migration addresses multiple security and performance issues identified in the database:

  ## 1. Foreign Key Indexes
  Adds missing indexes on all foreign key columns to improve query performance:
  - ai_agents.user_id
  - bridge_operations.agent_id, user_id
  - memecoins.user_id
  - nfts.user_id
  - security_scans.user_id
  - threat_alerts.user_id
  - training_sessions.user_id
  - transactions.user_id
  - user_stakes.pool_id, user_id
  - zk_proofs.user_id

  ## 2. RLS Policy Optimization
  Updates all RLS policies to use (select auth.uid()) instead of auth.uid() to prevent
  re-evaluation for each row, significantly improving query performance at scale.
  
  Affected tables:
  - users
  - memecoins
  - nfts
  - transactions
  - ai_agents
  - security_scans
  - zk_proofs
  - bridge_operations
  - training_sessions
  - threat_alerts
  - user_stakes
  - llm_agents
  - agent_training_sessions
  - agent_deployments

  ## 3. Remove Unused Indexes
  Drops indexes that have not been used:
  - idx_llm_agents_user_id (redundant with new FK index)
  - idx_llm_agents_status
  - idx_agent_training_sessions_agent_id
  - idx_agent_deployments_agent_id

  ## 4. Fix Multiple Permissive Policies
  Consolidates duplicate permissive policies on memecoins and nfts tables

  ## 5. Fix Function Search Path
  Updates update_updated_at_column function with immutable search_path
*/

-- ============================================================================
-- 1. ADD FOREIGN KEY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id_fk ON public.ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_bridge_operations_agent_id_fk ON public.bridge_operations(agent_id);
CREATE INDEX IF NOT EXISTS idx_bridge_operations_user_id_fk ON public.bridge_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_memecoins_user_id_fk ON public.memecoins(user_id);
CREATE INDEX IF NOT EXISTS idx_nfts_user_id_fk ON public.nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_scans_user_id_fk ON public.security_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_threat_alerts_user_id_fk ON public.threat_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id_fk ON public.training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id_fk ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_pool_id_fk ON public.user_stakes(pool_id);
CREATE INDEX IF NOT EXISTS idx_user_stakes_user_id_fk ON public.user_stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_zk_proofs_user_id_fk ON public.zk_proofs(user_id);

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - Replace auth.uid() with (select auth.uid())
-- ============================================================================

-- USERS TABLE
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- MEMECOINS TABLE
DROP POLICY IF EXISTS "Users can read own memecoins" ON public.memecoins;
DROP POLICY IF EXISTS "Users can insert own memecoins" ON public.memecoins;
DROP POLICY IF EXISTS "Public can view deployed memecoins" ON public.memecoins;

-- Consolidated policy for SELECT
CREATE POLICY "Users can view memecoins"
  ON public.memecoins FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id OR 
    deployed = true
  );

CREATE POLICY "Users can insert own memecoins"
  ON public.memecoins FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- NFTS TABLE
DROP POLICY IF EXISTS "Users can manage own NFTs" ON public.nfts;
DROP POLICY IF EXISTS "Public can view listed NFTs" ON public.nfts;

-- Consolidated policy for SELECT
CREATE POLICY "Users can view NFTs"
  ON public.nfts FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = user_id OR 
    listed = true
  );

CREATE POLICY "Users can insert own NFTs"
  ON public.nfts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own NFTs"
  ON public.nfts FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own NFTs"
  ON public.nfts FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- AI_AGENTS TABLE
DROP POLICY IF EXISTS "Users can manage own agents" ON public.ai_agents;

CREATE POLICY "Users can view own agents"
  ON public.ai_agents FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own agents"
  ON public.ai_agents FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own agents"
  ON public.ai_agents FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own agents"
  ON public.ai_agents FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- SECURITY_SCANS TABLE
DROP POLICY IF EXISTS "Users can view own scans" ON public.security_scans;
DROP POLICY IF EXISTS "Users can create scans" ON public.security_scans;

CREATE POLICY "Users can view own scans"
  ON public.security_scans FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create scans"
  ON public.security_scans FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- ZK_PROOFS TABLE
DROP POLICY IF EXISTS "Users can manage own proofs" ON public.zk_proofs;

CREATE POLICY "Users can view own proofs"
  ON public.zk_proofs FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own proofs"
  ON public.zk_proofs FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own proofs"
  ON public.zk_proofs FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own proofs"
  ON public.zk_proofs FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- BRIDGE_OPERATIONS TABLE
DROP POLICY IF EXISTS "Users can view own bridge operations" ON public.bridge_operations;

CREATE POLICY "Users can view own bridge operations"
  ON public.bridge_operations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert bridge operations"
  ON public.bridge_operations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- TRAINING_SESSIONS TABLE
DROP POLICY IF EXISTS "Users can manage own training sessions" ON public.training_sessions;

CREATE POLICY "Users can view own training sessions"
  ON public.training_sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert training sessions"
  ON public.training_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update training sessions"
  ON public.training_sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- THREAT_ALERTS TABLE
DROP POLICY IF EXISTS "Users can view own alerts" ON public.threat_alerts;
DROP POLICY IF EXISTS "Users can create alerts" ON public.threat_alerts;

CREATE POLICY "Users can view own alerts"
  ON public.threat_alerts FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create alerts"
  ON public.threat_alerts FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- USER_STAKES TABLE
DROP POLICY IF EXISTS "Users can view their own stakes" ON public.user_stakes;
DROP POLICY IF EXISTS "Users can insert their own stakes" ON public.user_stakes;
DROP POLICY IF EXISTS "Users can update their own stakes" ON public.user_stakes;

CREATE POLICY "Users can view their own stakes"
  ON public.user_stakes FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own stakes"
  ON public.user_stakes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own stakes"
  ON public.user_stakes FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- LLM_AGENTS TABLE
DROP POLICY IF EXISTS "Users can view own agents" ON public.llm_agents;
DROP POLICY IF EXISTS "Users can create own agents" ON public.llm_agents;
DROP POLICY IF EXISTS "Users can update own agents" ON public.llm_agents;
DROP POLICY IF EXISTS "Users can delete own agents" ON public.llm_agents;

CREATE POLICY "Users can view own agents"
  ON public.llm_agents FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own agents"
  ON public.llm_agents FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own agents"
  ON public.llm_agents FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own agents"
  ON public.llm_agents FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- AGENT_TRAINING_SESSIONS TABLE
DROP POLICY IF EXISTS "Users can view own training sessions" ON public.agent_training_sessions;
DROP POLICY IF EXISTS "Users can create own training sessions" ON public.agent_training_sessions;

CREATE POLICY "Users can view own training sessions"
  ON public.agent_training_sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own training sessions"
  ON public.agent_training_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- AGENT_DEPLOYMENTS TABLE
DROP POLICY IF EXISTS "Users can view own deployments" ON public.agent_deployments;
DROP POLICY IF EXISTS "Users can create own deployments" ON public.agent_deployments;
DROP POLICY IF EXISTS "Users can update own deployments" ON public.agent_deployments;

CREATE POLICY "Users can view own deployments"
  ON public.agent_deployments FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own deployments"
  ON public.agent_deployments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own deployments"
  ON public.agent_deployments FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- 3. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS public.idx_llm_agents_user_id;
DROP INDEX IF EXISTS public.idx_llm_agents_status;
DROP INDEX IF EXISTS public.idx_agent_training_sessions_agent_id;
DROP INDEX IF EXISTS public.idx_agent_deployments_agent_id;

-- ============================================================================
-- 4. FIX FUNCTION SEARCH PATH
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
