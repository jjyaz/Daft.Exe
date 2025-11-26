import { supabase } from './supabase';
import { aiEngine } from './ai';

export interface PredictionMarket {
  id?: string;
  creator_id: string;
  title: string;
  description: string;
  category: 'price' | 'volume' | 'event' | 'performance' | 'governance';
  market_type: 'binary' | 'scalar' | 'categorical';
  resolution_source: 'oracle' | 'ai_consensus' | 'manual' | 'on_chain';
  target_asset?: string;
  resolution_criteria: any;
  resolution_value?: number;
  total_volume: number;
  total_participants: number;
  prize_pool: number;
  entry_fee: number;
  status: 'open' | 'locked' | 'resolving' | 'resolved' | 'cancelled';
  opens_at: string;
  locks_at: string;
  resolves_at: string;
  resolved_at?: string;
  metadata: any;
  created_at?: string;
  updated_at?: string;
}

export interface MarketPrediction {
  id?: string;
  market_id: string;
  user_id: string;
  agent_swarm_id?: string;
  prediction_value: number;
  confidence: number;
  stake_amount: number;
  prediction_proof?: string;
  strategy_hash?: string;
  ai_analysis: any;
  encrypted_details?: string;
  revealed: boolean;
  payout?: number;
  rank?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SwarmPrediction {
  id?: string;
  market_id: string;
  swarm_id: string;
  user_id: string;
  consensus_prediction: number;
  confidence: number;
  agent_votes: any[];
  voting_power: any;
  stake_amount: number;
  zk_proof?: string;
  performance_data: any;
  created_at?: string;
}

export class PredictionMarketService {
  // Create a new prediction market
  static async createMarket(market: Omit<PredictionMarket, 'id' | 'total_volume' | 'total_participants' | 'created_at' | 'updated_at'>): Promise<PredictionMarket> {
    const { data, error } = await supabase
      .from('prediction_markets')
      .insert([market])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get all active markets
  static async getActiveMarkets(): Promise<PredictionMarket[]> {
    const { data, error } = await supabase
      .from('prediction_markets')
      .select('*')
      .in('status', ['open', 'locked'])
      .order('locks_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get markets by category
  static async getMarketsByCategory(category: string): Promise<PredictionMarket[]> {
    const { data, error } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get market details
  static async getMarket(marketId: string): Promise<PredictionMarket | null> {
    const { data, error } = await supabase
      .from('prediction_markets')
      .select('*')
      .eq('id', marketId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Create a prediction with AI analysis
  static async createPrediction(
    marketId: string,
    userId: string,
    predictionValue: number,
    stakeAmount: number,
    agentSwarmId?: string
  ): Promise<MarketPrediction> {
    // Generate ZK proof for the prediction
    const proof = await aiEngine.generateZKProof(
      JSON.stringify({ marketId, predictionValue, timestamp: Date.now() })
    );

    // Get AI analysis if swarm is used
    let aiAnalysis = {};
    if (agentSwarmId) {
      const analysis = await aiEngine.analyzeMarketData();
      aiAnalysis = {
        trend: analysis.trend,
        confidence: analysis.confidence,
        recommendation: analysis.recommendation,
        timestamp: new Date().toISOString()
      };
    }

    // Create strategy hash (keeps strategy private)
    const strategyHash = await this.generateStrategyHash(predictionValue, stakeAmount);

    const prediction: Omit<MarketPrediction, 'id' | 'created_at' | 'updated_at'> = {
      market_id: marketId,
      user_id: userId,
      agent_swarm_id: agentSwarmId,
      prediction_value: predictionValue,
      confidence: agentSwarmId ? (aiAnalysis as any).confidence || 75 : 50,
      stake_amount: stakeAmount,
      prediction_proof: proof,
      strategy_hash: strategyHash,
      ai_analysis: aiAnalysis,
      revealed: false,
      encrypted_details: this.encryptDetails({ predictionValue, stakeAmount })
    };

    const { data, error } = await supabase
      .from('market_predictions')
      .insert([prediction])
      .select()
      .single();

    if (error) throw error;

    // Update market stats
    await this.updateMarketStats(marketId, stakeAmount);

    // Update leaderboard
    await this.updateLeaderboard(userId, 'prediction_placed', stakeAmount);

    return data;
  }

  // Create swarm prediction (multiple agents collaborate)
  static async createSwarmPrediction(
    marketId: string,
    swarmId: string,
    userId: string,
    stakeAmount: number
  ): Promise<SwarmPrediction> {
    // Simulate multiple agents analyzing the market
    const agentVotes = [];
    const numAgents = Math.floor(Math.random() * 3) + 3; // 3-5 agents

    for (let i = 0; i < numAgents; i++) {
      const analysis = await aiEngine.analyzeMarketData();
      const prediction = Math.random() * 100;

      agentVotes.push({
        agent_id: `agent_${i}`,
        prediction_value: prediction,
        confidence: analysis.confidence,
        reasoning: analysis.trend
      });
    }

    // Calculate consensus using weighted voting
    const totalWeight = agentVotes.reduce((sum, vote) => sum + vote.confidence, 0);
    const consensusPrediction = agentVotes.reduce(
      (sum, vote) => sum + (vote.prediction_value * vote.confidence / totalWeight),
      0
    );
    const avgConfidence = totalWeight / agentVotes.length;

    // Generate ZK proof of swarm computation
    const zkProof = await aiEngine.generateZKProof(
      JSON.stringify({ swarmId, agentVotes, consensusPrediction })
    );

    const swarmPrediction: Omit<SwarmPrediction, 'id' | 'created_at'> = {
      market_id: marketId,
      swarm_id: swarmId,
      user_id: userId,
      consensus_prediction: consensusPrediction,
      confidence: avgConfidence,
      agent_votes: agentVotes,
      voting_power: { equal_weight: true },
      stake_amount: stakeAmount,
      zk_proof: zkProof,
      performance_data: {
        num_agents: numAgents,
        consensus_strength: this.calculateConsensusStrength(agentVotes)
      }
    };

    const { data, error } = await supabase
      .from('swarm_predictions')
      .insert([swarmPrediction])
      .select()
      .single();

    if (error) throw error;

    // Update market stats
    await this.updateMarketStats(marketId, stakeAmount);

    return data;
  }

  // Get user's predictions for a market
  static async getUserPredictions(userId: string, marketId?: string): Promise<MarketPrediction[]> {
    let query = supabase
      .from('market_predictions')
      .select('*, prediction_markets(*)')
      .eq('user_id', userId);

    if (marketId) {
      query = query.eq('market_id', marketId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Resolve a market (AI consensus)
  static async resolveMarket(marketId: string): Promise<void> {
    // Get all resolution votes
    const { data: votes } = await supabase
      .from('market_resolution_votes')
      .select('*')
      .eq('market_id', marketId);

    if (!votes || votes.length === 0) {
      throw new Error('No resolution votes found');
    }

    // Calculate weighted consensus
    const totalWeight = votes.reduce((sum, vote) => sum + vote.vote_weight, 0);
    const consensusValue = votes.reduce(
      (sum, vote) => sum + (vote.resolution_value * vote.vote_weight / totalWeight),
      0
    );

    // Update market
    await supabase
      .from('prediction_markets')
      .update({
        status: 'resolved',
        resolution_value: consensusValue,
        resolved_at: new Date().toISOString()
      })
      .eq('id', marketId);

    // Calculate and distribute payouts
    await this.calculatePayouts(marketId, consensusValue);

    // Reveal all predictions
    await supabase
      .from('market_predictions')
      .update({ revealed: true })
      .eq('market_id', marketId);
  }

  // Calculate payouts based on accuracy
  static async calculatePayouts(marketId: string, actualValue: number): Promise<void> {
    const { data: predictions } = await supabase
      .from('market_predictions')
      .select('*')
      .eq('market_id', marketId);

    if (!predictions || predictions.length === 0) return;

    // Calculate accuracy for each prediction
    const accuracyScores = predictions.map(pred => ({
      id: pred.id,
      user_id: pred.user_id,
      stake: pred.stake_amount,
      accuracy: 100 - Math.abs(pred.prediction_value - actualValue)
    }));

    // Sort by accuracy
    accuracyScores.sort((a, b) => b.accuracy - a.accuracy);

    // Get market prize pool
    const { data: market } = await supabase
      .from('prediction_markets')
      .select('prize_pool')
      .eq('id', marketId)
      .single();

    const prizePool = market?.prize_pool || 0;

    // Distribute prizes (top 50% get payouts)
    const winners = accuracyScores.slice(0, Math.ceil(accuracyScores.length / 2));
    const totalAccuracy = winners.reduce((sum, w) => sum + w.accuracy, 0);

    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const payout = (winner.accuracy / totalAccuracy) * prizePool;
      const rank = i + 1;

      await supabase
        .from('market_predictions')
        .update({ payout, rank })
        .eq('id', winner.id);

      // Update leaderboard
      const isCorrect = rank <= Math.ceil(winners.length / 3); // Top third are "correct"
      await this.updateLeaderboard(winner.user_id, 'prediction_resolved', payout, isCorrect);
    }
  }

  // Update market statistics
  static async updateMarketStats(marketId: string, additionalStake: number): Promise<void> {
    const { data: market } = await supabase
      .from('prediction_markets')
      .select('total_volume, total_participants, prize_pool')
      .eq('id', marketId)
      .single();

    if (!market) return;

    await supabase
      .from('prediction_markets')
      .update({
        total_volume: market.total_volume + additionalStake,
        total_participants: market.total_participants + 1,
        prize_pool: market.prize_pool + (additionalStake * 0.95) // 5% fee
      })
      .eq('id', marketId);
  }

  // Update user leaderboard
  static async updateLeaderboard(
    userId: string,
    action: 'prediction_placed' | 'prediction_resolved',
    amount: number,
    isCorrect?: boolean
  ): Promise<void> {
    const { data: existing } = await supabase
      .from('prediction_leaderboard')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      // Create new leaderboard entry
      await supabase.from('prediction_leaderboard').insert([{
        user_id: userId,
        total_predictions: action === 'prediction_placed' ? 1 : 0,
        correct_predictions: isCorrect ? 1 : 0,
        accuracy_rate: isCorrect ? 100 : 0,
        total_profit: action === 'prediction_resolved' ? amount : 0,
        total_volume: action === 'prediction_placed' ? amount : 0,
        reputation_score: 1000,
        current_streak: isCorrect ? 1 : 0,
        best_streak: isCorrect ? 1 : 0
      }]);
    } else {
      // Update existing entry
      const updates: any = {};

      if (action === 'prediction_placed') {
        updates.total_predictions = existing.total_predictions + 1;
        updates.total_volume = existing.total_volume + amount;
      } else if (action === 'prediction_resolved') {
        updates.total_profit = existing.total_profit + amount;
        if (isCorrect !== undefined) {
          updates.correct_predictions = existing.correct_predictions + (isCorrect ? 1 : 0);
          updates.accuracy_rate = ((existing.correct_predictions + (isCorrect ? 1 : 0)) / existing.total_predictions) * 100;
          updates.current_streak = isCorrect ? existing.current_streak + 1 : 0;
          updates.best_streak = Math.max(existing.best_streak, updates.current_streak);
          updates.reputation_score = existing.reputation_score + (isCorrect ? 100 : -50);
        }
      }

      await supabase
        .from('prediction_leaderboard')
        .update(updates)
        .eq('user_id', userId);
    }
  }

  // Get leaderboard
  static async getLeaderboard(sortBy: 'reputation' | 'accuracy' | 'profit' = 'reputation'): Promise<any[]> {
    let orderColumn = 'reputation_score';
    if (sortBy === 'accuracy') orderColumn = 'accuracy_rate';
    if (sortBy === 'profit') orderColumn = 'total_profit';

    const { data, error } = await supabase
      .from('prediction_leaderboard')
      .select('*')
      .order(orderColumn, { ascending: false })
      .limit(100);

    if (error) throw error;
    return data || [];
  }

  // Helper: Generate strategy hash
  private static async generateStrategyHash(value: number, stake: number): Promise<string> {
    const data = `${value}_${stake}_${Date.now()}`;
    return aiEngine.generateZKProof(data).then(proof => proof.slice(0, 32));
  }

  // Helper: Encrypt prediction details
  private static encryptDetails(details: any): string {
    // Simple base64 encoding (in production, use proper encryption)
    return btoa(JSON.stringify(details));
  }

  // Helper: Calculate consensus strength
  private static calculateConsensusStrength(votes: any[]): number {
    if (votes.length === 0) return 0;

    const avgPrediction = votes.reduce((sum, v) => sum + v.prediction_value, 0) / votes.length;
    const variance = votes.reduce((sum, v) => sum + Math.pow(v.prediction_value - avgPrediction, 2), 0) / votes.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = stronger consensus
    return Math.max(0, 100 - stdDev);
  }

  // Submit resolution vote
  static async submitResolutionVote(
    marketId: string,
    userId: string,
    resolutionValue: number,
    voteWeight: number = 1
  ): Promise<void> {
    const proof = await aiEngine.generateZKProof(
      JSON.stringify({ marketId, resolutionValue, userId })
    );

    await supabase.from('market_resolution_votes').insert([{
      market_id: marketId,
      voter_id: userId,
      resolution_value: resolutionValue,
      vote_weight: voteWeight,
      proof
    }]);
  }

  // Get market predictions (public, revealed only)
  static async getMarketPredictions(marketId: string): Promise<MarketPrediction[]> {
    const { data, error } = await supabase
      .from('market_predictions')
      .select('*')
      .eq('market_id', marketId)
      .eq('revealed', true)
      .order('rank', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
