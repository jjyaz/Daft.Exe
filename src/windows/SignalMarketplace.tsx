import React, { useState, useEffect } from 'react';
import { Radio, Clock, TrendingUp, Target } from 'lucide-react';
import { SignalMarketplaceService, TradingSignal } from '../lib/signalMarketplaceService';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';

export const SignalMarketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'mySignals' | 'create'>('marketplace');
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [mySignals, setMySignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    signal_type: 'buy' as 'buy' | 'sell' | 'hold',
    token_symbol: 'SOL',
    confidence_level: '75',
    signal_price: '0.5',
    hours_until_reveal: '24'
  });

  useEffect(() => {
    loadSignals();
    loadMySignals();
  }, []);

  const loadSignals = async () => {
    try {
      const data = await SignalMarketplaceService.getActiveSignals();
      setSignals(data);
    } catch (error) {
      console.error('Error loading signals:', error);
    }
  };

  const loadMySignals = async () => {
    try {
      const data = await SignalMarketplaceService.getUserSignals(getMockUserId());
      setMySignals(data);
    } catch (error) {
      console.error('Error loading my signals:', error);
    }
  };

  const handleCreateSignal = async () => {
    setLoading(true);
    soundManager.playClick();
    try {
      const prediction = SignalMarketplaceService.generateMockPrediction();
      await SignalMarketplaceService.createSignal(
        getMockUserId(),
        createForm.signal_type,
        createForm.token_symbol,
        prediction,
        parseFloat(createForm.confidence_level),
        parseFloat(createForm.signal_price),
        parseInt(createForm.hours_until_reveal)
      );
      soundManager.playSuccess();
      setActiveTab('mySignals');
      loadMySignals();
    } catch (error: any) {
      console.error('Error:', error);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (signalId: string) => {
    setLoading(true);
    soundManager.playClick();
    try {
      await SignalMarketplaceService.subscribeToSignal(signalId, getMockUserId(), 'one_time');
      soundManager.playSuccess();
      alert('Subscribed! Signal will unlock at timelock');
    } catch (error: any) {
      console.error('Error:', error);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Signal Marketplace</h2>
      </div>

      <div className="flex gap-1 mb-4">
        <button className={`win98-button text-xs ${activeTab === 'marketplace' ? 'bg-white' : ''}`} onClick={() => {setActiveTab('marketplace'); soundManager.playClick();}}>
          <Radio size={14} className="inline mr-1" />Signals
        </button>
        <button className={`win98-button text-xs ${activeTab === 'mySignals' ? 'bg-white' : ''}`} onClick={() => {setActiveTab('mySignals'); soundManager.playClick();}}>
          <Target size={14} className="inline mr-1" />My Signals
        </button>
        <button className={`win98-button text-xs ${activeTab === 'create' ? 'bg-white' : ''}`} onClick={() => {setActiveTab('create'); soundManager.playClick();}}>
          <TrendingUp size={14} className="inline mr-1" />Create
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'marketplace' && (
          <div className="space-y-3">
            {signals.length === 0 ? (
              <div className="win98-inset p-8 text-center text-gray-600">
                <Radio size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No active signals</p>
              </div>
            ) : (
              signals.map((signal) => (
                <div key={signal.id} className="win98-inset p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-bold">{signal.token_symbol} - {signal.signal_type.toUpperCase()}</div>
                      <div className="text-xs space-y-1">
                        <div>Confidence: {signal.confidence_level}%</div>
                        <div>Accuracy Rate: {signal.accuracy_rate.toFixed(0)}%</div>
                        <div><Clock size={12} className="inline" /> Unlocks: {new Date(signal.prediction_timelock).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{signal.signal_price} SOL</div>
                      <div className="text-xs text-gray-600">{signal.subscribers_count} subs</div>
                    </div>
                  </div>
                  <button className="win98-button text-xs w-full" onClick={() => handleSubscribe(signal.id!)} disabled={loading}>Subscribe</button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'mySignals' && (
          <div className="space-y-3">
            {mySignals.length === 0 ? (
              <div className="win98-inset p-8 text-center text-gray-600">
                <Target size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No signals created yet</p>
              </div>
            ) : (
              mySignals.map((signal) => (
                <div key={signal.id} className="win98-inset p-3">
                  <div className="font-bold mb-1">{signal.token_symbol} - {signal.signal_type.toUpperCase()}</div>
                  <div className="text-xs space-y-1">
                    <div>Status: {signal.status}</div>
                    <div>Subscribers: {signal.subscribers_count}</div>
                    <div>Confidence: {signal.confidence_level}%</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="win98-inset p-4 space-y-3">
            <div>
              <label className="block text-sm font-bold mb-1">Signal Type</label>
              <select className="win98-inset w-full p-2 text-sm" value={createForm.signal_type} onChange={(e) => setCreateForm({ ...createForm, signal_type: e.target.value as any })}>
                <option value="buy">BUY</option>
                <option value="sell">SELL</option>
                <option value="hold">HOLD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Token Symbol</label>
              <input type="text" className="win98-inset w-full p-2 text-sm" value={createForm.token_symbol} onChange={(e) => setCreateForm({ ...createForm, token_symbol: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Confidence (%)</label>
                <input type="number" min="0" max="100" className="win98-inset w-full p-2 text-sm" value={createForm.confidence_level} onChange={(e) => setCreateForm({ ...createForm, confidence_level: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Price (SOL)</label>
                <input type="number" step="0.1" className="win98-inset w-full p-2 text-sm" value={createForm.signal_price} onChange={(e) => setCreateForm({ ...createForm, signal_price: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Hours Until Reveal</label>
                <input type="number" className="win98-inset w-full p-2 text-sm" value={createForm.hours_until_reveal} onChange={(e) => setCreateForm({ ...createForm, hours_until_reveal: e.target.value })} />
              </div>
            </div>
            <button className="win98-button w-full" onClick={handleCreateSignal} disabled={loading}>
              {loading ? 'Creating...' : 'Create Time-Locked Signal'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
