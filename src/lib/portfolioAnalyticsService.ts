import { supabase } from './supabase';
import { ZKProofService } from './zkProofService';

export interface PortfolioSnapshot {
  id?: string;
  user_id: string;
  snapshot_date: string;
  encrypted_holdings: string;
  total_value_proof: string;
  verified_total_value: number;
  whale_tier: string;
  risk_score: number;
  diversification_score: number;
  position_count: number;
  top_holding_percentage: number;
  is_public: boolean;
}

export interface WhaleVerification {
  id?: string;
  user_id: string;
  verification_tier: string;
  minimum_balance_proof: string;
  verified_balance_range: string;
  verification_date: string;
  expires_at: string;
  perks_unlocked: any;
  is_active: boolean;
}

export interface ReputationProof {
  id?: string;
  user_id: string;
  proof_type: string;
  claim: string;
  zk_proof: string;
  verification_status: string;
  verified_at?: string;
  expires_at?: string;
}

export class PortfolioAnalyticsService {
  static async createPortfolioSnapshot(
    userId: string,
    holdings: Array<{ token: string; amount: number; value: number }>,
    makePublic: boolean = false
  ): Promise<PortfolioSnapshot> {
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

    const encryption = await ZKProofService.generatePortfolioEncryption(holdings, userId);

    const balanceProof = await ZKProofService.generateBalanceProof(userId, totalValue, holdings);

    const diversificationScore = this.calculateDiversification(holdings);
    const topHoldingPercentage = this.getTopHoldingPercentage(holdings);

    const snapshot: Omit<PortfolioSnapshot, 'id'> = {
      user_id: userId,
      snapshot_date: new Date().toISOString(),
      encrypted_holdings: encryption.encryptedHoldings,
      total_value_proof: encryption.totalValueProof,
      verified_total_value: totalValue,
      whale_tier: balanceProof.whaleTier,
      risk_score: this.calculateRiskScore(holdings),
      diversification_score: diversificationScore,
      position_count: holdings.length,
      top_holding_percentage: topHoldingPercentage,
      is_public: makePublic
    };

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .insert([snapshot])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserSnapshots(userId: string): Promise<PortfolioSnapshot[]> {
    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(30);

    if (error) throw error;
    return data || [];
  }

  static async getPublicSnapshots(): Promise<PortfolioSnapshot[]> {
    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('is_public', true)
      .order('verified_total_value', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  static async createWhaleVerification(
    userId: string,
    totalBalance: number
  ): Promise<WhaleVerification> {
    const balanceProof = await ZKProofService.generateBalanceProof(userId, totalBalance, []);

    const tier = this.getVerificationTier(totalBalance);
    const perks = this.getTierPerks(tier);

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    const verification: Omit<WhaleVerification, 'id'> = {
      user_id: userId,
      verification_tier: tier,
      minimum_balance_proof: balanceProof.proof,
      verified_balance_range: balanceProof.balanceRange,
      verification_date: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      perks_unlocked: perks,
      is_active: true
    };

    const { data, error } = await supabase
      .from('whale_verifications')
      .insert([verification])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserVerification(userId: string): Promise<WhaleVerification | null> {
    const { data, error } = await supabase
      .from('whale_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('verification_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async createReputationProof(
    userId: string,
    proofType: 'win_rate' | 'profitability' | 'volume' | 'consistency',
    actualValue: number,
    threshold: number
  ): Promise<ReputationProof> {
    const proof = await ZKProofService.generateReputationProof(
      userId,
      proofType,
      actualValue,
      threshold
    );

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const repProof: Omit<ReputationProof, 'id'> = {
      user_id: userId,
      proof_type: proofType,
      claim: proof.claim,
      zk_proof: proof.proof,
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };

    const { data, error } = await supabase
      .from('reputation_proofs')
      .insert([repProof])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserReputationProofs(userId: string): Promise<ReputationProof[]> {
    const { data, error } = await supabase
      .from('reputation_proofs')
      .select('*')
      .eq('user_id', userId)
      .eq('verification_status', 'verified')
      .order('verified_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async requestPrivateAnalytics(
    userId: string,
    analysisType: 'risk_assessment' | 'tax_calculation' | 'rebalance_suggestion' | 'correlation_analysis',
    holdings: any[]
  ): Promise<any> {
    const encryption = await ZKProofService.generatePortfolioEncryption(holdings, userId);

    const request = {
      user_id: userId,
      analysis_type: analysisType,
      encrypted_input_data: encryption.encryptedHoldings,
      zk_computation_proof: encryption.totalValueProof,
      status: 'processing'
    };

    const { data, error } = await supabase
      .from('private_analytics_requests')
      .insert([request])
      .select()
      .single();

    if (error) throw error;

    setTimeout(async () => {
      const result = this.performAnalysis(analysisType, holdings);
      await supabase
        .from('private_analytics_requests')
        .update({
          analysis_result: result,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', data.id);
    }, 2000);

    return data;
  }

  static async getAnalyticsResults(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('private_analytics_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private static calculateDiversification(holdings: any[]): number {
    if (holdings.length === 0) return 0;

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const proportions = holdings.map(h => h.value / totalValue);

    const herfindahl = proportions.reduce((sum, p) => sum + p * p, 0);

    const diversificationIndex = (1 - herfindahl) * 100;

    return Math.round(diversificationIndex);
  }

  private static getTopHoldingPercentage(holdings: any[]): number {
    if (holdings.length === 0) return 0;

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const maxValue = Math.max(...holdings.map(h => h.value));

    return (maxValue / totalValue) * 100;
  }

  private static calculateRiskScore(holdings: any[]): number {
    if (holdings.length === 0) return 50;

    let riskScore = 50;

    if (holdings.length < 3) riskScore += 20;
    else if (holdings.length < 5) riskScore += 10;
    else if (holdings.length > 10) riskScore -= 15;

    const topPercent = this.getTopHoldingPercentage(holdings);
    if (topPercent > 50) riskScore += 20;
    else if (topPercent > 30) riskScore += 10;
    else if (topPercent < 20) riskScore -= 10;

    return Math.max(0, Math.min(100, Math.round(riskScore)));
  }

  private static getVerificationTier(balance: number): string {
    if (balance >= 10000000) return 'diamond';
    if (balance >= 1000000) return 'platinum';
    if (balance >= 100000) return 'gold';
    if (balance >= 10000) return 'silver';
    return 'bronze';
  }

  private static getTierPerks(tier: string): any {
    const perks = {
      bronze: ['Basic analytics', 'Public leaderboard access'],
      silver: ['Advanced analytics', 'Priority support', 'Whale chat access'],
      gold: ['Premium analytics', '24/7 support', 'Exclusive signals', 'Strategy discounts 10%'],
      platinum: ['Full analytics suite', 'Dedicated support', 'Alpha signals', 'Strategy discounts 25%', 'Private alpha calls'],
      diamond: ['Everything', 'Personal account manager', 'First access to new features', 'Strategy discounts 50%', 'Exclusive events']
    };

    return perks[tier as keyof typeof perks] || perks.bronze;
  }

  private static performAnalysis(analysisType: string, holdings: any[]): any {
    switch (analysisType) {
      case 'risk_assessment':
        return {
          overall_risk: this.calculateRiskScore(holdings),
          diversification: this.calculateDiversification(holdings),
          recommendations: [
            'Consider adding more positions to reduce concentration risk',
            'Your portfolio is overweight in high-volatility assets',
            'Consider rebalancing to maintain target allocations'
          ]
        };
      case 'tax_calculation':
        return {
          estimated_gains: Math.random() * 50000,
          estimated_tax: Math.random() * 15000,
          tax_loss_harvest_opportunities: Math.floor(Math.random() * 5),
          recommendations: ['Harvest losses before year end', 'Consider long-term holding strategies']
        };
      case 'rebalance_suggestion':
        return {
          current_allocation: holdings.map(h => ({ token: h.token, percentage: Math.random() * 100 })),
          suggested_allocation: holdings.map(h => ({ token: h.token, percentage: Math.random() * 100 })),
          actions: ['Sell 10% of top holding', 'Buy more diversified assets']
        };
      case 'correlation_analysis':
        return {
          high_correlation_pairs: [['Token A', 'Token B', 0.85]],
          diversification_score: this.calculateDiversification(holdings),
          recommendations: ['Reduce correlated positions']
        };
      default:
        return {};
    }
  }

  static generateMockHoldings(): any[] {
    const tokens = ['SOL', 'BONK', 'JUP', 'ORCA', 'RAY', 'USDC', 'MNGO'];
    const count = 3 + Math.floor(Math.random() * 5);

    return Array.from({ length: count }, () => {
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const value = Math.random() * 50000;
      return {
        token,
        amount: value / (Math.random() * 100 + 1),
        value
      };
    });
  }
}
