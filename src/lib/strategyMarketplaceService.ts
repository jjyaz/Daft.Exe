import { supabase } from './supabase';
import { ZKProofService } from './zkProofService';

export interface TradingStrategy {
  id?: string;
  owner_id: string;
  strategy_name: string;
  strategy_description: string;
  strategy_type: string;
  encrypted_code: string;
  encryption_key_hash: string;
  performance_proof?: string;
  verified_returns: number;
  backtest_period_days: number;
  risk_level: string;
  min_capital_required: number;
  is_for_sale: boolean;
  is_for_rent: boolean;
  sale_price: number;
  rental_price_daily: number;
  royalty_percentage: number;
  total_sales: number;
  total_rentals: number;
  reputation_score: number;
}

export interface StrategyPerformance {
  strategy_id: string;
  period_start: string;
  period_end: string;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  total_return_percent: number;
  max_drawdown_percent: number;
  sharpe_ratio: number;
  performance_proof: string;
  verified: boolean;
}

export interface StrategyPurchase {
  id?: string;
  strategy_id: string;
  buyer_id: string;
  seller_id: string;
  purchase_type: 'sale' | 'rental' | 'license';
  price_paid: number;
  royalty_agreement: any;
  rental_start?: string;
  rental_end?: string;
  access_granted: boolean;
  decryption_key?: string;
}

export class StrategyMarketplaceService {
  static async createStrategy(
    ownerId: string,
    strategyName: string,
    strategyDescription: string,
    strategyType: string,
    strategyCode: string,
    salePrice: number,
    rentalPriceDaily: number,
    royaltyPercentage: number
  ): Promise<TradingStrategy> {
    const performanceData = ZKProofService.generateMockPerformanceData(strategyType);

    const performanceProof = await ZKProofService.generatePerformanceProof(
      'new-strategy',
      performanceData.returns,
      performanceData.winRate,
      performanceData.sharpeRatio,
      performanceData.trades
    );

    const encryption = await ZKProofService.generateStrategyEncryption(strategyCode, ownerId);

    const riskLevel = ZKProofService.calculateStrategyRisk(strategyType);

    const strategy: Omit<TradingStrategy, 'id'> = {
      owner_id: ownerId,
      strategy_name: strategyName,
      strategy_description: strategyDescription,
      strategy_type: strategyType,
      encrypted_code: encryption.encryptedCode,
      encryption_key_hash: encryption.encryptionKeyHash,
      performance_proof: performanceProof.proof,
      verified_returns: performanceData.returns,
      backtest_period_days: 90,
      risk_level: riskLevel,
      min_capital_required: 1000,
      is_for_sale: salePrice > 0,
      is_for_rent: rentalPriceDaily > 0,
      sale_price: salePrice,
      rental_price_daily: rentalPriceDaily,
      royalty_percentage: royaltyPercentage,
      total_sales: 0,
      total_rentals: 0,
      reputation_score: 500
    };

    const { data, error } = await supabase
      .from('trading_strategies')
      .insert([strategy])
      .select()
      .single();

    if (error) throw error;

    await this.recordPerformanceHistory(
      data.id,
      performanceData.returns,
      performanceData.winRate,
      performanceData.sharpeRatio,
      performanceData.trades,
      performanceProof.proof
    );

    return data;
  }

  static async getMarketplaceStrategies(filters?: {
    strategy_type?: string;
    risk_level?: string;
    min_returns?: number;
    max_price?: number;
  }): Promise<TradingStrategy[]> {
    let query = supabase
      .from('trading_strategies')
      .select('*')
      .or('is_for_sale.eq.true,is_for_rent.eq.true');

    if (filters?.strategy_type) {
      query = query.eq('strategy_type', filters.strategy_type);
    }

    if (filters?.risk_level) {
      query = query.eq('risk_level', filters.risk_level);
    }

    if (filters?.min_returns) {
      query = query.gte('verified_returns', filters.min_returns);
    }

    if (filters?.max_price) {
      query = query.lte('sale_price', filters.max_price);
    }

    const { data, error } = await query.order('reputation_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserStrategies(userId: string): Promise<TradingStrategy[]> {
    const { data, error } = await supabase
      .from('trading_strategies')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getStrategyDetails(strategyId: string): Promise<{
    strategy: TradingStrategy;
    performance: StrategyPerformance[];
  }> {
    const { data: strategy, error: strategyError } = await supabase
      .from('trading_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError) throw strategyError;

    const { data: performance, error: perfError } = await supabase
      .from('strategy_performance_history')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('verified', true)
      .order('period_end', { ascending: false });

    if (perfError) throw perfError;

    return {
      strategy,
      performance: performance || []
    };
  }

  static async purchaseStrategy(
    strategyId: string,
    buyerId: string,
    purchaseType: 'sale' | 'rental' | 'license',
    rentalDays?: number
  ): Promise<StrategyPurchase> {
    const { data: strategy } = await supabase
      .from('trading_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (!strategy) throw new Error('Strategy not found');

    let pricePaid = 0;
    let rentalStart: string | undefined;
    let rentalEnd: string | undefined;

    if (purchaseType === 'sale') {
      pricePaid = strategy.sale_price;
    } else if (purchaseType === 'rental' && rentalDays) {
      pricePaid = strategy.rental_price_daily * rentalDays;
      rentalStart = new Date().toISOString();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + rentalDays);
      rentalEnd = endDate.toISOString();
    }

    const purchase: Omit<StrategyPurchase, 'id'> = {
      strategy_id: strategyId,
      buyer_id: buyerId,
      seller_id: strategy.owner_id,
      purchase_type: purchaseType,
      price_paid: pricePaid,
      royalty_agreement: {
        percentage: strategy.royalty_percentage,
        duration_months: 12
      },
      rental_start: rentalStart,
      rental_end: rentalEnd,
      access_granted: true,
      decryption_key: 'mock-key-' + Math.random().toString(36).slice(2)
    };

    const { data, error } = await supabase
      .from('strategy_purchases')
      .insert([purchase])
      .select()
      .single();

    if (error) throw error;

    const updateField = purchaseType === 'sale' ? 'total_sales' : 'total_rentals';
    await supabase
      .from('trading_strategies')
      .update({
        [updateField]: strategy[updateField] + 1,
        reputation_score: strategy.reputation_score + 10
      })
      .eq('id', strategyId);

    return data;
  }

  static async getUserPurchases(userId: string): Promise<StrategyPurchase[]> {
    const { data, error } = await supabase
      .from('strategy_purchases')
      .select('*, trading_strategies(*)')
      .eq('buyer_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createStrategyBattle(
    strategy1Id: string,
    strategy2Id: string,
    battleType: 'live_trading' | 'backtest' | 'simulation',
    startCapital: number,
    durationDays: number,
    prizePool: number
  ): Promise<any> {
    const battle = {
      strategy1_id: strategy1Id,
      strategy2_id: strategy2Id,
      battle_type: battleType,
      start_capital: startCapital,
      duration_days: durationDays,
      status: 'pending',
      prize_pool: prizePool
    };

    const { data, error } = await supabase
      .from('strategy_battles')
      .insert([battle])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getActiveBattles(): Promise<any[]> {
    const { data, error } = await supabase
      .from('strategy_battles')
      .select('*, strategy1:trading_strategies!strategy1_id(*), strategy2:trading_strategies!strategy2_id(*)')
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async simulateBattleCompletion(battleId: string): Promise<void> {
    const { data: battle } = await supabase
      .from('strategy_battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (!battle) throw new Error('Battle not found');

    const strategy1Return = Math.random() * 100 - 20;
    const strategy2Return = Math.random() * 100 - 20;
    const winnerId = strategy1Return > strategy2Return ? battle.strategy1_id : battle.strategy2_id;

    const performanceProof = await ZKProofService.generatePerformanceProof(
      battleId,
      Math.max(strategy1Return, strategy2Return),
      65 + Math.random() * 20,
      1.5 + Math.random(),
      50 + Math.floor(Math.random() * 100)
    );

    await supabase
      .from('strategy_battles')
      .update({
        status: 'completed',
        winner_strategy_id: winnerId,
        strategy1_return: strategy1Return,
        strategy2_return: strategy2Return,
        performance_proof: performanceProof.proof,
        completed_at: new Date().toISOString()
      })
      .eq('id', battleId);

    await supabase
      .from('trading_strategies')
      .update({
        reputation_score: supabase.raw('reputation_score + 50')
      })
      .eq('id', winnerId);
  }

  static async updateStrategyListing(
    strategyId: string,
    updates: Partial<TradingStrategy>
  ): Promise<void> {
    const { error } = await supabase
      .from('trading_strategies')
      .update(updates)
      .eq('id', strategyId);

    if (error) throw error;
  }

  private static async recordPerformanceHistory(
    strategyId: string,
    returns: number,
    winRate: number,
    sharpeRatio: number,
    totalTrades: number,
    performanceProof: string
  ): Promise<void> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 90);

    const winningTrades = Math.floor((totalTrades * winRate) / 100);

    const performance: Omit<StrategyPerformance, 'id'> = {
      strategy_id: strategyId,
      period_start: startDate.toISOString(),
      period_end: now.toISOString(),
      total_trades: totalTrades,
      winning_trades: winningTrades,
      losing_trades: totalTrades - winningTrades,
      total_return_percent: returns,
      max_drawdown_percent: Math.random() * 30,
      sharpe_ratio: sharpeRatio,
      performance_proof: performanceProof,
      verified: true
    };

    await supabase
      .from('strategy_performance_history')
      .insert([performance]);
  }

  static async getTopStrategies(limit: number = 10): Promise<TradingStrategy[]> {
    const { data, error } = await supabase
      .from('trading_strategies')
      .select('*')
      .or('is_for_sale.eq.true,is_for_rent.eq.true')
      .order('reputation_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async searchStrategies(query: string): Promise<TradingStrategy[]> {
    const { data, error } = await supabase
      .from('trading_strategies')
      .select('*')
      .or(`strategy_name.ilike.%${query}%,strategy_description.ilike.%${query}%`)
      .or('is_for_sale.eq.true,is_for_rent.eq.true')
      .order('reputation_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
