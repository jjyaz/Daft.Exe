import { supabase } from './supabase';
import { getMockUserId } from './mockAuth';
import { walletManager } from './wallet';

export interface StakingPool {
  id: string;
  name: string;
  token_a: string;
  token_b: string;
  apy: number;
  tvl: string;
  min_stake: number;
  active: boolean;
}

export interface UserStake {
  id: string;
  pool_id: string;
  amount: number;
  rewards_earned: number;
  staked_at: string;
  last_claim: string;
  active: boolean;
  pool?: StakingPool;
}

export class StakingService {
  async getActivePools(): Promise<StakingPool[]> {
    const { data, error } = await supabase
      .from('staking_pools')
      .select('*')
      .eq('active', true)
      .order('apy', { ascending: false });

    if (error) {
      console.error('Error fetching pools:', error);
      return [];
    }

    return data || [];
  }

  async getUserStakes(): Promise<UserStake[]> {
    const { data, error } = await supabase
      .from('user_stakes')
      .select(`
        *,
        pool:staking_pools(*)
      `)
      .eq('user_id', getMockUserId())
      .eq('active', true)
      .order('staked_at', { ascending: false });

    if (error) {
      console.error('Error fetching user stakes:', error);
      return [];
    }

    return data || [];
  }

  async stakeTokens(
    poolId: string,
    amount: number
  ): Promise<{ success: boolean; stakeId?: string; error?: string }> {
    if (!walletManager.publicKey) {
      return { success: false, error: 'Wallet not connected' };
    }

    const { data: pool, error: poolError } = await supabase
      .from('staking_pools')
      .select('*')
      .eq('id', poolId)
      .single();

    if (poolError || !pool) {
      return { success: false, error: 'Pool not found' };
    }

    if (amount < pool.min_stake) {
      return {
        success: false,
        error: `Minimum stake is ${pool.min_stake} tokens`,
      };
    }

    const balance = await walletManager.getBalance();
    if (balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const { data: stake, error: stakeError } = await supabase
      .from('user_stakes')
      .insert([
        {
          user_id: getMockUserId(),
          pool_id: poolId,
          amount: amount,
          rewards_earned: 0,
          active: true,
        },
      ])
      .select()
      .single();

    if (stakeError || !stake) {
      return { success: false, error: 'Failed to create stake' };
    }

    const currentTvl = parseFloat(pool.tvl);
    const newTvl = (currentTvl + amount).toString();

    await supabase
      .from('staking_pools')
      .update({ tvl: newTvl })
      .eq('id', poolId);

    return { success: true, stakeId: stake.id };
  }

  async unstakeTokens(
    stakeId: string
  ): Promise<{ success: boolean; amount?: number; rewards?: number; error?: string }> {
    if (!walletManager.publicKey) {
      return { success: false, error: 'Wallet not connected' };
    }

    const { data: stake, error: fetchError } = await supabase
      .from('user_stakes')
      .select('*, pool:staking_pools(*)')
      .eq('id', stakeId)
      .eq('user_id', getMockUserId())
      .single();

    if (fetchError || !stake) {
      return { success: false, error: 'Stake not found' };
    }

    const rewards = this.calculateRewards(
      stake.amount,
      stake.pool.apy,
      stake.staked_at
    );

    const { error: updateError } = await supabase
      .from('user_stakes')
      .update({
        active: false,
        rewards_earned: rewards,
      })
      .eq('id', stakeId);

    if (updateError) {
      return { success: false, error: 'Failed to unstake' };
    }

    const currentTvl = parseFloat(stake.pool.tvl);
    const newTvl = Math.max(0, currentTvl - stake.amount).toString();

    await supabase
      .from('staking_pools')
      .update({ tvl: newTvl })
      .eq('id', stake.pool_id);

    return {
      success: true,
      amount: stake.amount,
      rewards: rewards,
    };
  }

  async claimRewards(stakeId: string): Promise<{ success: boolean; rewards?: number; error?: string }> {
    if (!walletManager.publicKey) {
      return { success: false, error: 'Wallet not connected' };
    }

    const { data: stake, error: fetchError } = await supabase
      .from('user_stakes')
      .select('*, pool:staking_pools(*)')
      .eq('id', stakeId)
      .eq('user_id', getMockUserId())
      .eq('active', true)
      .single();

    if (fetchError || !stake) {
      return { success: false, error: 'Stake not found' };
    }

    const rewards = this.calculateRewards(
      stake.amount,
      stake.pool.apy,
      stake.last_claim
    );

    if (rewards <= 0) {
      return { success: false, error: 'No rewards to claim' };
    }

    const { error: updateError } = await supabase
      .from('user_stakes')
      .update({
        rewards_earned: stake.rewards_earned + rewards,
        last_claim: new Date().toISOString(),
      })
      .eq('id', stakeId);

    if (updateError) {
      return { success: false, error: 'Failed to claim rewards' };
    }

    return { success: true, rewards };
  }

  calculateRewards(amount: number, apy: number, since: string): number {
    const now = new Date();
    const start = new Date(since);
    const daysPassed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const yearlyReward = amount * (apy / 100);
    const reward = (yearlyReward / 365) * daysPassed;
    return parseFloat(reward.toFixed(6));
  }

  async getTotalStaked(): Promise<number> {
    const stakes = await this.getUserStakes();
    return stakes.reduce((total, stake) => total + stake.amount, 0);
  }

  async getTotalRewards(): Promise<number> {
    const stakes = await this.getUserStakes();
    let totalRewards = 0;

    for (const stake of stakes) {
      const pendingRewards = this.calculateRewards(
        stake.amount,
        stake.pool?.apy || 0,
        stake.last_claim
      );
      totalRewards += stake.rewards_earned + pendingRewards;
    }

    return totalRewards;
  }
}

export const stakingService = new StakingService();
