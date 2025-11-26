import React, { useState, useEffect } from 'react';
import { TrendingUp, Brain, Zap, Trophy, Lock, Eye, Target, Clock, Users, DollarSign } from 'lucide-react';
import { PredictionMarketService, PredictionMarket, MarketPrediction } from '../lib/predictionMarketService';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';
import { supabase } from '../lib/supabase';

export const PredictionMarkets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'markets' | 'myPredictions' | 'leaderboard' | 'create'>('markets');
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [myPredictions, setMyPredictions] = useState<MarketPrediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Prediction form state
  const [predictionValue, setPredictionValue] = useState('');
  const [stakeAmount, setStakeAmount] = useState('0.1');
  const [useSwarm, setUseSwarm] = useState(false);

  // Create market form state
  const [newMarket, setNewMarket] = useState({
    title: '',
    description: '',
    category: 'price' as 'price' | 'volume' | 'event' | 'performance' | 'governance',
    market_type: 'scalar' as 'binary' | 'scalar' | 'categorical',
    target_asset: 'SOL',
    entry_fee: '0.1',
    duration_hours: '24'
  });

  useEffect(() => {
    loadMarkets();
    loadMyPredictions();
    loadLeaderboard();

    const interval = setInterval(() => {
      loadMarkets();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadMarkets = async () => {
    try {
      const data = await PredictionMarketService.getActiveMarkets();
      setMarkets(data);
    } catch (error) {
      console.error('Error loading markets:', error);
    }
  };

  const loadMyPredictions = async () => {
    try {
      const data = await PredictionMarketService.getUserPredictions(getMockUserId());
      setMyPredictions(data);
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const data = await PredictionMarketService.getLeaderboard('reputation');
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const handleCreateMarket = async () => {
    if (!newMarket.title || !newMarket.description) {
      soundManager.playError();
      return;
    }

    setLoading(true);
    soundManager.playClick();

    try {
      const now = new Date();
      const locksAt = new Date(now.getTime() + parseInt(newMarket.duration_hours) * 60 * 60 * 1000);
      const resolvesAt = new Date(locksAt.getTime() + 60 * 60 * 1000); // 1 hour after lock

      await PredictionMarketService.createMarket({
        creator_id: getMockUserId(),
        title: newMarket.title,
        description: newMarket.description,
        category: newMarket.category,
        market_type: newMarket.market_type,
        resolution_source: 'ai_consensus',
        target_asset: newMarket.target_asset,
        resolution_criteria: {
          source: 'price_oracle',
          asset: newMarket.target_asset
        },
        total_volume: 0,
        total_participants: 0,
        prize_pool: 0,
        entry_fee: parseFloat(newMarket.entry_fee),
        status: 'open',
        opens_at: now.toISOString(),
        locks_at: locksAt.toISOString(),
        resolves_at: resolvesAt.toISOString(),
        metadata: {}
      });

      soundManager.playSuccess();
      setNewMarket({
        title: '',
        description: '',
        category: 'price',
        market_type: 'scalar',
        target_asset: 'SOL',
        entry_fee: '0.1',
        duration_hours: '24'
      });
      setActiveTab('markets');
      loadMarkets();
    } catch (error) {
      console.error('Error creating market:', error);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handlePlacePrediction = async () => {
    if (!selectedMarket || !predictionValue || !stakeAmount) {
      soundManager.playError();
      return;
    }

    setLoading(true);
    soundManager.playClick();

    try {
      if (useSwarm) {
        // Use swarm prediction
        const { data: swarms } = await supabase
          .from('agent_swarms')
          .select('id')
          .eq('user_id', getMockUserId())
          .eq('active', true)
          .limit(1)
          .maybeSingle();

        if (swarms) {
          await PredictionMarketService.createSwarmPrediction(
            selectedMarket.id!,
            swarms.id,
            getMockUserId(),
            parseFloat(stakeAmount)
          );
        } else {
          throw new Error('No active swarm found');
        }
      } else {
        // Regular prediction
        await PredictionMarketService.createPrediction(
          selectedMarket.id!,
          getMockUserId(),
          parseFloat(predictionValue),
          parseFloat(stakeAmount)
        );
      }

      soundManager.playSuccess();
      setPredictionValue('');
      setStakeAmount('0.1');
      setSelectedMarket(null);
      loadMarkets();
      loadMyPredictions();
    } catch (error) {
      console.error('Error placing prediction:', error);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600 bg-green-100';
      case 'locked': return 'text-orange-600 bg-orange-100';
      case 'resolving': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'price': return <TrendingUp size={16} />;
      case 'volume': return <DollarSign size={16} />;
      case 'event': return <Target size={16} />;
      case 'performance': return <Zap size={16} />;
      default: return <Trophy size={16} />;
    }
  };

  const getTimeRemaining = (locksAt: string) => {
    const now = new Date();
    const lock = new Date(locksAt);
    const diff = lock.getTime() - now.getTime();

    if (diff <= 0) return 'Locked';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-4 bg-white h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">ZK-ML Prediction Markets</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          className={`win98-button ${activeTab === 'markets' ? 'bg-white' : ''}`}
          onClick={() => {
            setActiveTab('markets');
            soundManager.playClick();
          }}
        >
          <Target size={14} className="inline mr-1" />
          Markets
        </button>
        <button
          className={`win98-button ${activeTab === 'myPredictions' ? 'bg-white' : ''}`}
          onClick={() => {
            setActiveTab('myPredictions');
            soundManager.playClick();
          }}
        >
          <Eye size={14} className="inline mr-1" />
          My Predictions
        </button>
        <button
          className={`win98-button ${activeTab === 'leaderboard' ? 'bg-white' : ''}`}
          onClick={() => {
            setActiveTab('leaderboard');
            soundManager.playClick();
          }}
        >
          <Trophy size={14} className="inline mr-1" />
          Leaderboard
        </button>
        <button
          className={`win98-button ${activeTab === 'create' ? 'bg-white' : ''}`}
          onClick={() => {
            setActiveTab('create');
            soundManager.playClick();
          }}
        >
          <Zap size={14} className="inline mr-1" />
          Create Market
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Markets Tab */}
        {activeTab === 'markets' && (
          <div className="space-y-3">
            {markets.length === 0 ? (
              <div className="win98-inset p-8 text-center text-gray-600">
                <Brain size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No active markets</p>
                <p className="text-sm mt-2">Create the first prediction market!</p>
              </div>
            ) : (
              markets.map((market) => (
                <div key={market.id} className="win98-inset p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getCategoryIcon(market.category)}
                        <span className="font-bold">{market.title}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{market.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(market.status)}`}>
                      {market.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{getTimeRemaining(market.locks_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>{market.total_participants} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={12} />
                      <span>{market.prize_pool.toFixed(2)} SOL</span>
                    </div>
                  </div>

                  {market.status === 'open' && (
                    <button
                      className="win98-button text-xs w-full"
                      onClick={() => {
                        setSelectedMarket(market);
                        soundManager.playClick();
                      }}
                    >
                      Place Prediction
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* My Predictions Tab */}
        {activeTab === 'myPredictions' && (
          <div className="space-y-3">
            {myPredictions.length === 0 ? (
              <div className="win98-inset p-8 text-center text-gray-600">
                <Eye size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No predictions yet</p>
                <p className="text-sm mt-2">Make your first prediction to get started!</p>
              </div>
            ) : (
              myPredictions.map((pred: any) => (
                <div key={pred.id} className="win98-inset p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-bold text-sm mb-1">
                        {pred.prediction_markets?.title || 'Market'}
                      </div>
                      <div className="text-xs text-gray-600">
                        Prediction: {pred.prediction_value.toFixed(2)} |
                        Confidence: {pred.confidence.toFixed(0)}%
                      </div>
                    </div>
                    {pred.revealed ? (
                      <div className="flex items-center gap-1">
                        {pred.rank && <Trophy size={14} className="text-yellow-600" />}
                        {pred.payout && (
                          <span className="text-xs font-bold text-green-600">
                            +{pred.payout.toFixed(2)} SOL
                          </span>
                        )}
                      </div>
                    ) : (
                      <Lock size={14} className="text-gray-400" />
                    )}
                  </div>
                  <div className="text-xs">
                    Staked: {pred.stake_amount.toFixed(2)} SOL
                  </div>
                  {pred.prediction_proof && (
                    <div className="text-xs text-gray-500 mt-1 font-mono truncate">
                      ZK: {pred.prediction_proof.slice(0, 20)}...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="win98-inset p-4">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Trophy size={16} color="gold" />
              Top Predictors
            </h3>
            {leaderboard.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                <p>No leaderboard data yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${index < 3 ? 'text-lg' : ''}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <div>
                        <div className="font-bold text-sm">User {entry.user_id.slice(0, 8)}</div>
                        <div className="text-xs text-gray-600">
                          {entry.accuracy_rate.toFixed(1)}% accuracy | {entry.total_predictions} predictions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{entry.reputation_score}</div>
                      <div className="text-xs text-green-600">+{entry.total_profit.toFixed(2)} SOL</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Market Tab */}
        {activeTab === 'create' && (
          <div className="win98-inset p-4 space-y-3">
            <h3 className="font-bold mb-3">Create New Market</h3>

            <div>
              <label className="block text-sm font-bold mb-1">Title *</label>
              <input
                type="text"
                className="win98-inset w-full p-2 text-sm"
                value={newMarket.title}
                onChange={(e) => setNewMarket({ ...newMarket, title: e.target.value })}
                placeholder="Will SOL reach $200 by end of month?"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Description *</label>
              <textarea
                className="win98-inset w-full p-2 text-sm"
                rows={3}
                value={newMarket.description}
                onChange={(e) => setNewMarket({ ...newMarket, description: e.target.value })}
                placeholder="Market resolves based on..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Category</label>
                <select
                  className="win98-inset w-full p-2 text-sm"
                  value={newMarket.category}
                  onChange={(e) => setNewMarket({ ...newMarket, category: e.target.value as any })}
                >
                  <option value="price">Price</option>
                  <option value="volume">Volume</option>
                  <option value="event">Event</option>
                  <option value="performance">Performance</option>
                  <option value="governance">Governance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Type</label>
                <select
                  className="win98-inset w-full p-2 text-sm"
                  value={newMarket.market_type}
                  onChange={(e) => setNewMarket({ ...newMarket, market_type: e.target.value as any })}
                >
                  <option value="binary">Binary (Yes/No)</option>
                  <option value="scalar">Scalar (Number)</option>
                  <option value="categorical">Categorical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Asset</label>
                <input
                  type="text"
                  className="win98-inset w-full p-2 text-sm"
                  value={newMarket.target_asset}
                  onChange={(e) => setNewMarket({ ...newMarket, target_asset: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Entry Fee (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  className="win98-inset w-full p-2 text-sm"
                  value={newMarket.entry_fee}
                  onChange={(e) => setNewMarket({ ...newMarket, entry_fee: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Duration (hours)</label>
                <input
                  type="number"
                  className="win98-inset w-full p-2 text-sm"
                  value={newMarket.duration_hours}
                  onChange={(e) => setNewMarket({ ...newMarket, duration_hours: e.target.value })}
                />
              </div>
            </div>

            <button
              className="win98-button w-full"
              onClick={handleCreateMarket}
              disabled={loading || !newMarket.title || !newMarket.description}
            >
              {loading ? 'Creating Market...' : 'Create Market'}
            </button>
          </div>
        )}
      </div>

      {/* Prediction Modal */}
      {selectedMarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="win98-window" style={{ width: '400px' }}>
            <div className="win98-titlebar">
              <span>Place Prediction</span>
              <button
                className="win98-titlebar-button"
                onClick={() => {
                  setSelectedMarket(null);
                  soundManager.playClick();
                }}
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <div className="font-bold mb-1">{selectedMarket.title}</div>
                <div className="text-xs text-gray-600">{selectedMarket.description}</div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Your Prediction</label>
                <input
                  type="number"
                  step="0.01"
                  className="win98-inset w-full p-2"
                  value={predictionValue}
                  onChange={(e) => setPredictionValue(e.target.value)}
                  placeholder="Enter prediction value"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Stake Amount (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  className="win98-inset w-full p-2"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useSwarm"
                  checked={useSwarm}
                  onChange={(e) => setUseSwarm(e.target.checked)}
                />
                <label htmlFor="useSwarm" className="text-sm">
                  Use AI Swarm Analysis (Higher Accuracy)
                </label>
              </div>

              <div className="win98-inset p-2 bg-blue-50 text-xs">
                <div className="font-bold mb-1">Privacy Protected</div>
                <div>Your prediction is encrypted with ZK proof until market resolution</div>
              </div>

              <button
                className="win98-button w-full"
                onClick={handlePlacePrediction}
                disabled={loading || !predictionValue || !stakeAmount}
              >
                {loading ? 'Placing Prediction...' : 'Confirm Prediction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
