import React, { useState, useEffect } from 'react';
import { Activity, Zap, TrendingUp, Target, Clock, BarChart3 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { swarmService, AgentSwarm, SwarmActivity } from '../lib/swarmService';
import { supabase } from '../lib/supabase';

export const SwarmDashboard: React.FC = () => {
  const { walletAddress, walletConnected } = useAppContext();
  const [swarms, setSwarms] = useState<AgentSwarm[]>([]);
  const [selectedSwarm, setSelectedSwarm] = useState<AgentSwarm | null>(null);
  const [activities, setActivities] = useState<SwarmActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoScanning, setAutoScanning] = useState(false);

  useEffect(() => {
    if (walletConnected && walletAddress) {
      loadUserSwarms();
    }
  }, [walletConnected, walletAddress]);

  useEffect(() => {
    if (selectedSwarm) {
      loadActivities(selectedSwarm.id);
    }
  }, [selectedSwarm]);

  useEffect(() => {
    if (autoScanning && selectedSwarm) {
      const interval = setInterval(async () => {
        const activity = await swarmService.simulateSwarmActivity(selectedSwarm);
        setActivities(prev => [activity, ...prev.slice(0, 49)]);

        const profitChange = Math.random() * 2 - 0.5;
        const newProfit = selectedSwarm.total_profit + profitChange;
        const newTrades = selectedSwarm.total_trades + 1;
        const wins = Math.floor(selectedSwarm.win_rate * selectedSwarm.total_trades / 100);
        const newWins = activity.success ? wins + 1 : wins;
        const newWinRate = (newWins / newTrades) * 100;

        await swarmService.updateSwarmStats(selectedSwarm.id, {
          total_trades: newTrades,
          total_profit: newProfit,
          win_rate: newWinRate,
          last_active: new Date().toISOString()
        });

        setSelectedSwarm(prev => prev ? {
          ...prev,
          total_trades: newTrades,
          total_profit: newProfit,
          win_rate: newWinRate,
          last_active: new Date().toISOString()
        } : null);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [autoScanning, selectedSwarm]);

  const loadUserSwarms = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (userData) {
        const userSwarms = await swarmService.getUserSwarms(userData.id);
        setSwarms(userSwarms);
        if (userSwarms.length > 0 && !selectedSwarm) {
          setSelectedSwarm(userSwarms[0]);
        }
      }
    } catch (error) {
      console.error('Error loading swarms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async (swarmId: string) => {
    try {
      const swarmActivities = await swarmService.getSwarmActivities(swarmId);
      setActivities(swarmActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const createNewSwarm = async () => {
    if (!walletConnected || !walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    const swarmName = prompt('Enter swarm name:');
    if (!swarmName) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (!userData) {
        alert('User not found');
        return;
      }

      const { data: agents } = await supabase
        .from('ai_agents')
        .select('id')
        .eq('user_id', userData.id)
        .limit(3);

      const agentIds = agents?.map(a => a.id) || [];

      const newSwarm = await swarmService.createSwarm(
        userData.id,
        swarmName,
        agentIds,
        'balanced'
      );

      setSwarms([...swarms, newSwarm]);
      setSelectedSwarm(newSwarm);
    } catch (error) {
      console.error('Error creating swarm:', error);
      alert('Failed to create swarm');
    }
  };

  const getActivityIcon = (type: SwarmActivity['activity_type']) => {
    switch (type) {
      case 'scan': return <Target size={14} className="text-blue-400" />;
      case 'trade': return <TrendingUp size={14} className="text-green-400" />;
      case 'alert': return <Zap size={14} className="text-yellow-400" />;
      case 'evolution': return <Activity size={14} className="text-purple-400" />;
      case 'battle': return <BarChart3 size={14} className="text-red-400" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!walletConnected) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <Activity size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-sm">Connect wallet to view your swarms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="flex border-b border-gray-300">
        <div className="flex-1 p-3 border-r border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">My Swarms</h3>
            <button
              onClick={createNewSwarm}
              className="px-2 py-1 text-xs bg-blue-500 text-white hover:bg-blue-600"
              style={{ fontFamily: 'Perfect DOS VGA 437' }}
            >
              New +
            </button>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {swarms.map(swarm => (
              <div
                key={swarm.id}
                onClick={() => setSelectedSwarm(swarm)}
                className={`p-2 cursor-pointer border ${selectedSwarm?.id === swarm.id ? 'bg-blue-600 text-white border-blue-800' : 'bg-white border-gray-400 hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{swarm.name}</span>
                  <span className={`text-xs ${selectedSwarm?.id === swarm.id ? 'text-blue-200' : 'text-gray-500'}`}>
                    Rep: {swarm.reputation_score}
                  </span>
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {swarm.total_trades} trades • {swarm.win_rate.toFixed(1)}% win
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-3">
          {selectedSwarm ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">{selectedSwarm.name}</h3>
                <button
                  onClick={() => setAutoScanning(!autoScanning)}
                  className={`px-3 py-1 text-xs ${autoScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
                  style={{ fontFamily: 'Perfect DOS VGA 437' }}
                >
                  {autoScanning ? 'STOP' : 'START'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 border border-gray-400">
                  <div className="text-gray-600">Total Profit</div>
                  <div className={`font-bold ${selectedSwarm.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedSwarm.total_profit >= 0 ? '+' : ''}{selectedSwarm.total_profit.toFixed(3)} SOL
                  </div>
                </div>
                <div className="bg-white p-2 border border-gray-400">
                  <div className="text-gray-600">Win Rate</div>
                  <div className="font-bold">{selectedSwarm.win_rate.toFixed(1)}%</div>
                </div>
                <div className="bg-white p-2 border border-gray-400">
                  <div className="text-gray-600">Total Trades</div>
                  <div className="font-bold">{selectedSwarm.total_trades}</div>
                </div>
                <div className="bg-white p-2 border border-gray-400">
                  <div className="text-gray-600">Reputation</div>
                  <div className="font-bold text-purple-600">{selectedSwarm.reputation_score}/1000</div>
                </div>
              </div>

              <div className="mt-2 bg-white p-2 border border-gray-400">
                <div className="text-gray-600 text-xs mb-1">Strategy</div>
                <div className="font-bold text-xs uppercase">{selectedSwarm.strategy_type}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 mt-8">
              Select a swarm to view details
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={16} />
          <h3 className="font-bold text-sm">Live Activity Feed</h3>
          {autoScanning && (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              SCANNING
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-black text-green-400 p-2 border-2 border-gray-400" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
          {activities.length === 0 ? (
            <div className="text-gray-500">No activity yet. Start swarm to begin scanning...</div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity, idx) => (
                <div key={activity.id || idx} className="flex items-start gap-2 border-b border-gray-800 pb-1">
                  <span className="text-gray-500 text-xs">{formatTimeAgo(activity.created_at)}</span>
                  {getActivityIcon(activity.activity_type)}
                  <span className={activity.success ? 'text-green-400' : 'text-red-400'}>
                    {activity.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSwarm && !autoScanning && (
          <div className="mt-2 text-center text-xs text-gray-500">
            Press START to activate swarm scanning
          </div>
        )}
      </div>
    </div>
  );
};
