import React, { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, Shield, Zap, DollarSign, Trophy } from 'lucide-react';
import { StrategyMarketplaceService, TradingStrategy } from '../lib/strategyMarketplaceService';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';

export const StrategyMarketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'myStrategies' | 'create'>('marketplace');
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [myStrategies, setMyStrategies] = useState<TradingStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    strategy_name: '',
    strategy_description: '',
    strategy_type: 'trend_following',
    strategy_code: '',
    sale_price: '10',
    rental_price_daily: '1',
    royalty_percentage: '5'
  });

  useEffect(() => {
    loadMarketplace();
    loadMyStrategies();
  }, []);

  const loadMarketplace = async () => {
    try {
      const data = await StrategyMarketplaceService.getMarketplaceStrategies();
      setStrategies(data);
    } catch (error) {
      console.error('Error loading marketplace:', error);
    }
  };

  const loadMyStrategies = async () => {
    try {
      const data = await StrategyMarketplaceService.getUserStrategies(getMockUserId());
      setMyStrategies(data);
    } catch (error) {
      console.error('Error loading my strategies:', error);
    }
  };

  const handleCreateStrategy = async () => {
    setLoading(true);
    soundManager.playClick();

    try {
      await StrategyMarketplaceService.createStrategy(
        getMockUserId(),
        createForm.strategy_name,
        createForm.strategy_description,
        createForm.strategy_type,
        createForm.strategy_code,
        parseFloat(createForm.sale_price),
        parseFloat(createForm.rental_price_daily),
        parseFloat(createForm.royalty_percentage)
      );

      soundManager.playSuccess();
      setCreateForm({
        strategy_name: '',
        strategy_description: '',
        strategy_type: 'trend_following',
        strategy_code: '',
        sale_price: '10',
        rental_price_daily: '1',
        royalty_percentage: '5'
      });
      setActiveTab('myStrategies');
      loadMyStrategies();
    } catch (error: any) {
      console.error('Error creating strategy:', error);
      alert(error.message);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (strategyId: string, type: 'sale' | 'rental') => {
    setLoading(true);
    soundManager.playClick();

    try {
      await StrategyMarketplaceService.purchaseStrategy(strategyId, getMockUserId(), type, type === 'rental' ? 30 : undefined);
      soundManager.playSuccess();
      alert('Purchase successful!');
      loadMarketplace();
    } catch (error: any) {
      console.error('Error purchasing:', error);
      alert(error.message);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'extreme': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-4 bg-white h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Strategy Marketplace</h2>
      </div>

      <div className="flex gap-1 mb-4">
        <button className={`win98-button ${activeTab === 'marketplace' ? 'bg-white' : ''}`} onClick={() => {setActiveTab('marketplace'); soundManager.playClick();}}>
          <ShoppingCart size={14} className="inline mr-1" />Marketplace
        </button>
        <button className={`win98-button ${activeTab === 'myStrategies' ? 'bg-white' : ''}`} onClick={() => {setActiveTab('myStrategies'); soundManager.playClick();}}>
          <Trophy size={14} className="inline mr-1" />My Strategies
        </button>
        <button className={`win98-button ${activeTab === 'create' ? 'bg-white' : ''}`} onClick={() => {setActiveTab('create'); soundManager.playClick();}}>
          <Zap size={14} className="inline mr-1" />Create Strategy
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'marketplace' && (
          <div className="space-y-3">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="win98-inset p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-bold">{strategy.strategy_name}</div>
                    <div className="text-xs text-gray-600 mb-1">{strategy.strategy_description}</div>
                    <div className="text-xs space-y-1">
                      <div>Type: {strategy.strategy_type.replace('_', ' ')}</div>
                      <div className={getRiskColor(strategy.risk_level)}>Risk: {strategy.risk_level.toUpperCase()}</div>
                      <div>Returns: <TrendingUp size={12} className="inline text-green-500" /> {strategy.verified_returns.toFixed(1)}%</div>
                      <div><Shield size={12} className="inline text-blue-500" /> ZK Verified</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {strategy.is_for_sale && <div className="text-sm font-bold">{strategy.sale_price} SOL</div>}
                    {strategy.is_for_rent && <div className="text-xs">{strategy.rental_price_daily} SOL/day</div>}
                    <div className="text-xs text-gray-600">Rep: {strategy.reputation_score}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {strategy.is_for_sale && <button className="win98-button text-xs flex-1" onClick={() => handlePurchase(strategy.id!, 'sale')} disabled={loading}>Buy</button>}
                  {strategy.is_for_rent && <button className="win98-button text-xs flex-1" onClick={() => handlePurchase(strategy.id!, 'rental')} disabled={loading}>Rent</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'myStrategies' && (
          <div className="space-y-3">
            {myStrategies.map((strategy) => (
              <div key={strategy.id} className="win98-inset p-3">
                <div className="font-bold mb-1">{strategy.strategy_name}</div>
                <div className="text-xs space-y-1">
                  <div>Returns: {strategy.verified_returns.toFixed(1)}%</div>
                  <div>Sales: {strategy.total_sales} | Rentals: {strategy.total_rentals}</div>
                  <div>Reputation: {strategy.reputation_score}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="win98-inset p-4 space-y-3">
            <div>
              <label className="block text-sm font-bold mb-1">Strategy Name *</label>
              <input type="text" className="win98-inset w-full p-2" value={createForm.strategy_name} onChange={(e) => setCreateForm({ ...createForm, strategy_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Description</label>
              <textarea className="win98-inset w-full p-2" rows={3} value={createForm.strategy_description} onChange={(e) => setCreateForm({ ...createForm, strategy_description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Strategy Type</label>
              <select className="win98-inset w-full p-2" value={createForm.strategy_type} onChange={(e) => setCreateForm({ ...createForm, strategy_type: e.target.value })}>
                <option value="trend_following">Trend Following</option>
                <option value="mean_reversion">Mean Reversion</option>
                <option value="arbitrage">Arbitrage</option>
                <option value="momentum">Momentum</option>
                <option value="breakout">Breakout</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Strategy Code (will be encrypted)</label>
              <textarea className="win98-inset w-full p-2 font-mono text-xs" rows={5} value={createForm.strategy_code} onChange={(e) => setCreateForm({ ...createForm, strategy_code: e.target.value })} placeholder="// Your trading strategy logic..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Sale Price (SOL)</label>
                <input type="number" step="0.1" className="win98-inset w-full p-2" value={createForm.sale_price} onChange={(e) => setCreateForm({ ...createForm, sale_price: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Rental (SOL/day)</label>
                <input type="number" step="0.1" className="win98-inset w-full p-2" value={createForm.rental_price_daily} onChange={(e) => setCreateForm({ ...createForm, rental_price_daily: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Royalty (%)</label>
                <input type="number" min="0" max="50" className="win98-inset w-full p-2" value={createForm.royalty_percentage} onChange={(e) => setCreateForm({ ...createForm, royalty_percentage: e.target.value })} />
              </div>
            </div>
            <button className="win98-button w-full" onClick={handleCreateStrategy} disabled={loading || !createForm.strategy_name || !createForm.strategy_code}>
              {loading ? 'Creating...' : 'Create Strategy with ZK Proof'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
