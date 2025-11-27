import { supabase } from './supabase';
import { ZKProofService } from './zkProofService';

export interface TradingSignal {
  id?: string;
  creator_id: string;
  signal_type: 'buy' | 'sell' | 'hold' | 'alert' | 'warning';
  token_symbol: string;
  token_address?: string;
  encrypted_prediction: string;
  prediction_timelock: string;
  confidence_level: number;
  target_price?: number;
  stop_loss?: number;
  take_profit?: number;
  reasoning_encrypted?: string;
  signal_price: number;
  performance_proof?: string;
  accuracy_rate: number;
  subscribers_count: number;
  status: string;
  actual_outcome?: string;
  published_at: string;
  expires_at: string;
}

export interface SignalSubscription {
  id?: string;
  signal_id: string;
  subscriber_id: string;
  subscription_type: 'one_time' | 'daily' | 'weekly' | 'monthly';
  price_paid: number;
  access_granted: boolean;
  decryption_key?: string;
  profit_loss?: number;
  followed_signal: boolean;
}

export interface SignalPerformance {
  creator_id: string;
  total_signals: number;
  correct_predictions: number;
  incorrect_predictions: number;
  pending_predictions: number;
  accuracy_rate: number;
  avg_confidence: number;
  total_subscriber_profit: number;
  reputation_score: number;
  performance_proof?: string;
}

export class SignalMarketplaceService {
  static async createSignal(
    creatorId: string,
    signalType: TradingSignal['signal_type'],
    tokenSymbol: string,
    prediction: any,
    confidenceLevel: number,
    signalPrice: number,
    hoursUntilReveal: number = 24
  ): Promise<TradingSignal> {
    const unlockTime = new Date();
    unlockTime.setHours(unlockTime.getHours() + hoursUntilReveal);

    const timeLock = await ZKProofService.generateTimeLockProof(prediction, unlockTime);

    const performance = await this.getOrCreatePerformance(creatorId);
    const accuracyProof = await ZKProofService.generateAccuracyProof(
      creatorId,
      performance.correct_predictions,
      performance.total_signals,
      performance.accuracy_rate
    );

    const expiresAt = new Date(unlockTime);
    expiresAt.setHours(expiresAt.getHours() + 24);

    const signal: Omit<TradingSignal, 'id'> = {
      creator_id: creatorId,
      signal_type: signalType,
      token_symbol: tokenSymbol,
      encrypted_prediction: timeLock.encryptedPrediction,
      prediction_timelock: unlockTime.toISOString(),
      confidence_level: confidenceLevel,
      target_price: prediction.targetPrice,
      stop_loss: prediction.stopLoss,
      take_profit: prediction.takeProfit,
      reasoning_encrypted: timeLock.encryptedPrediction,
      signal_price: signalPrice,
      performance_proof: accuracyProof,
      accuracy_rate: performance.accuracy_rate,
      subscribers_count: 0,
      status: 'active',
      published_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };

    const { data, error } = await supabase
      .from('trading_signals')
      .insert([signal])
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('signal_reveals')
      .insert([{
        signal_id: data.id,
        reveal_time: unlockTime.toISOString(),
        original_prediction_hash: timeLock.predictionHash,
        revealed_prediction: {},
        proof_of_pre_commitment: timeLock.timeLockProof
      }]);

    await this.updatePerformanceTracking(creatorId, { total_signals: 1, pending_predictions: 1 });

    return data;
  }

  static async getActiveSignals(filters?: {
    token_symbol?: string;
    signal_type?: string;
    min_confidence?: number;
    max_price?: number;
  }): Promise<TradingSignal[]> {
    let query = supabase
      .from('trading_signals')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (filters?.token_symbol) {
      query = query.eq('token_symbol', filters.token_symbol);
    }

    if (filters?.signal_type) {
      query = query.eq('signal_type', filters.signal_type);
    }

    if (filters?.min_confidence) {
      query = query.gte('confidence_level', filters.min_confidence);
    }

    if (filters?.max_price) {
      query = query.lte('signal_price', filters.max_price);
    }

    const { data, error } = await query.order('published_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async subscribeToSignal(
    signalId: string,
    subscriberId: string,
    subscriptionType: SignalSubscription['subscription_type']
  ): Promise<SignalSubscription> {
    const { data: signal } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('id', signalId)
      .single();

    if (!signal) throw new Error('Signal not found');

    const subscription: Omit<SignalSubscription, 'id'> = {
      signal_id: signalId,
      subscriber_id: subscriberId,
      subscription_type: subscriptionType,
      price_paid: signal.signal_price,
      access_granted: true,
      decryption_key: 'signal-key-' + Math.random().toString(36).slice(2),
      followed_signal: false
    };

    const { data, error } = await supabase
      .from('signal_subscriptions')
      .insert([subscription])
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('trading_signals')
      .update({
        subscribers_count: signal.subscribers_count + 1
      })
      .eq('id', signalId);

    return data;
  }

  static async getUserSubscriptions(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('signal_subscriptions')
      .select('*, trading_signals(*)')
      .eq('subscriber_id', userId)
      .order('subscribed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserSignals(userId: string): Promise<TradingSignal[]> {
    const { data, error } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('creator_id', userId)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async revealSignal(signalId: string): Promise<any> {
    const { data: signal } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('id', signalId)
      .single();

    if (!signal) throw new Error('Signal not found');

    const now = new Date();
    const timelockDate = new Date(signal.prediction_timelock);

    if (now < timelockDate) {
      throw new Error('Signal is still time-locked');
    }

    const { data: reveal } = await supabase
      .from('signal_reveals')
      .select('*')
      .eq('signal_id', signalId)
      .single();

    if (!reveal) throw new Error('Reveal data not found');

    const mockRevealedPrediction = {
      direction: signal.signal_type,
      targetPrice: signal.target_price,
      confidence: signal.confidence_level,
      reasoning: 'Technical analysis indicates strong momentum'
    };

    await supabase
      .from('signal_reveals')
      .update({
        revealed_prediction: mockRevealedPrediction,
        accuracy_verified: true
      })
      .eq('signal_id', signalId);

    return mockRevealedPrediction;
  }

  static async settleSignal(signalId: string, outcome: 'hit' | 'miss' | 'partial'): Promise<void> {
    const { data: signal } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('id', signalId)
      .single();

    if (!signal) throw new Error('Signal not found');

    await supabase
      .from('trading_signals')
      .update({
        status: 'settled',
        actual_outcome: outcome
      })
      .eq('id', signalId);

    const updates: any = { pending_predictions: -1 };
    if (outcome === 'hit' || outcome === 'partial') {
      updates.correct_predictions = 1;
      updates.reputation_score = 10;
    } else {
      updates.incorrect_predictions = 1;
      updates.reputation_score = -5;
    }

    await this.updatePerformanceTracking(signal.creator_id, updates);
  }

  static async getCreatorPerformance(creatorId: string): Promise<SignalPerformance> {
    return await this.getOrCreatePerformance(creatorId);
  }

  static async getTopSignalCreators(limit: number = 10): Promise<SignalPerformance[]> {
    const { data, error } = await supabase
      .from('signal_performance_tracking')
      .select('*')
      .order('reputation_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getSignalHistory(tokenSymbol: string): Promise<TradingSignal[]> {
    const { data, error } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('token_symbol', tokenSymbol)
      .in('status', ['settled', 'expired'])
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  private static async getOrCreatePerformance(creatorId: string): Promise<SignalPerformance> {
    const { data: existing } = await supabase
      .from('signal_performance_tracking')
      .select('*')
      .eq('creator_id', creatorId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    const newPerformance = {
      creator_id: creatorId,
      total_signals: 0,
      correct_predictions: 0,
      incorrect_predictions: 0,
      pending_predictions: 0,
      accuracy_rate: 0,
      avg_confidence: 0,
      total_subscriber_profit: 0,
      reputation_score: 100
    };

    const { data, error } = await supabase
      .from('signal_performance_tracking')
      .insert([newPerformance])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static async updatePerformanceTracking(
    creatorId: string,
    updates: Partial<SignalPerformance>
  ): Promise<void> {
    const current = await this.getOrCreatePerformance(creatorId);

    const newTotal = (current.total_signals || 0) + (updates.total_signals || 0);
    const newCorrect = (current.correct_predictions || 0) + (updates.correct_predictions || 0);
    const newIncorrect = (current.incorrect_predictions || 0) + (updates.incorrect_predictions || 0);
    const newPending = Math.max(0, (current.pending_predictions || 0) + (updates.pending_predictions || 0));

    const completed = newCorrect + newIncorrect;
    const accuracyRate = completed > 0 ? (newCorrect / completed) * 100 : 0;

    const finalUpdates = {
      total_signals: newTotal,
      correct_predictions: newCorrect,
      incorrect_predictions: newIncorrect,
      pending_predictions: newPending,
      accuracy_rate: accuracyRate,
      reputation_score: Math.max(0, (current.reputation_score || 100) + (updates.reputation_score || 0)),
      last_updated: new Date().toISOString()
    };

    await supabase
      .from('signal_performance_tracking')
      .update(finalUpdates)
      .eq('creator_id', creatorId);
  }

  static generateMockPrediction(): any {
    const directions = ['bullish', 'bearish', 'neutral'];
    const direction = directions[Math.floor(Math.random() * directions.length)];

    return {
      direction,
      targetPrice: 50 + Math.random() * 100,
      stopLoss: 30 + Math.random() * 20,
      takeProfit: 100 + Math.random() * 150,
      timeframe: '24h',
      reasoning: 'AI-powered technical and sentiment analysis'
    };
  }
}
