import React, { useState, useEffect } from 'react';
import { Swords, Trophy, Users, Clock, Zap, Target } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { swarmService, SwarmBattle as SwarmBattleType, AgentSwarm } from '../lib/swarmService';
import { supabase } from '../lib/supabase';

interface BattleParticipant {
  id: string;
  swarm_id: string;
  user_id: string;
  starting_capital: number;
  final_capital: number | null;
  profit_loss: number | null;
  trades_executed: number;
  rank: number | null;
  swarm?: AgentSwarm;
}

export const SwarmBattle: React.FC = () => {
  const { walletAddress, walletConnected } = useAppContext();
  const [battles, setBattles] = useState<SwarmBattleType[]>([]);
  const [userSwarms, setUserSwarms] = useState<AgentSwarm[]>([]);
  const [selectedBattle, setSelectedBattle] = useState<SwarmBattleType | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'create'>('active');

  useEffect(() => {
    if (walletConnected && walletAddress) {
      loadBattles();
      loadUserSwarms();
    }
  }, [walletConnected, walletAddress]);

  useEffect(() => {
    if (selectedBattle) {
      loadParticipants(selectedBattle.id);
    }
  }, [selectedBattle]);

  const loadBattles = async () => {
    try {
      const activeBattles = await swarmService.getActiveBattles();
      setBattles(activeBattles);
      if (activeBattles.length > 0 && !selectedBattle) {
        setSelectedBattle(activeBattles[0]);
      }
    } catch (error) {
      console.error('Error loading battles:', error);
    }
  };

  const loadUserSwarms = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (userData) {
        const swarms = await swarmService.getUserSwarms(userData.id);
        setUserSwarms(swarms.filter(s => s.active));
      }
    } catch (error) {
      console.error('Error loading swarms:', error);
    }
  };

  const loadParticipants = async (battleId: string) => {
    try {
      const { data, error } = await supabase
        .from('battle_participants')
        .select('*, agent_swarms(*)')
        .eq('battle_id', battleId);

      if (error) throw error;

      const participantsWithSwarms = data?.map(p => ({
        ...p,
        swarm: p.agent_swarms
      })) || [];

      setParticipants(participantsWithSwarms);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const createBattle = async () => {
    const battleType = prompt('Battle type (1v1, tournament, free_for_all):') as any;
    if (!['1v1', 'tournament', 'free_for_all'].includes(battleType)) {
      alert('Invalid battle type');
      return;
    }

    const entryFee = parseFloat(prompt('Entry fee (SOL):') || '0');
    if (isNaN(entryFee) || entryFee < 0) {
      alert('Invalid entry fee');
      return;
    }

    try {
      const newBattle = await swarmService.createBattle(battleType, entryFee, {
        duration: 3600,
        max_participants: battleType === '1v1' ? 2 : 10
      });

      setBattles([newBattle, ...battles]);
      setSelectedBattle(newBattle);
      setActiveTab('active');
      alert('Battle created successfully!');
    } catch (error) {
      console.error('Error creating battle:', error);
      alert('Failed to create battle');
    }
  };

  const joinBattle = async (swarmId: string) => {
    if (!selectedBattle || !walletConnected || !walletAddress) return;

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

      const existingParticipant = participants.find(p => p.swarm_id === swarmId);
      if (existingParticipant) {
        alert('This swarm is already in the battle');
        return;
      }

      const startingCapital = 10;

      await swarmService.joinBattle(selectedBattle.id, swarmId, userData.id, startingCapital);

      await loadParticipants(selectedBattle.id);

      const { error: updateError } = await supabase
        .from('swarm_battles')
        .update({
          prize_pool: selectedBattle.prize_pool + selectedBattle.entry_fee
        })
        .eq('id', selectedBattle.id);

      if (updateError) console.error('Error updating prize pool:', updateError);

      alert('Successfully joined battle!');
    } catch (error) {
      console.error('Error joining battle:', error);
      alert('Failed to join battle');
    }
  };

  const getBattleTypeColor = (type: string) => {
    switch (type) {
      case '1v1': return 'text-blue-600';
      case 'tournament': return 'text-purple-600';
      case 'free_for_all': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500',
      active: 'bg-green-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500'
    };

    return (
      <span className={`px-2 py-1 text-xs text-white ${colors[status as keyof typeof colors] || 'bg-gray-500'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (!walletConnected) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <Swords size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-sm">Connect wallet to join swarm battles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="flex border-b border-gray-300 bg-gray-200 px-3 py-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-1 text-xs mr-2 ${activeTab === 'active' ? 'bg-white border-2 border-gray-400' : 'bg-gray-300 border border-gray-400'}`}
        >
          Active Battles
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-1 text-xs ${activeTab === 'create' ? 'bg-white border-2 border-gray-400' : 'bg-gray-300 border border-gray-400'}`}
        >
          Create Battle
        </button>
      </div>

      {activeTab === 'active' ? (
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-gray-300 bg-gray-50 overflow-y-auto">
            <div className="p-3">
              <h3 className="font-bold text-xs mb-3 text-gray-600">AVAILABLE BATTLES</h3>
              {battles.length === 0 ? (
                <p className="text-xs text-gray-500">No active battles</p>
              ) : (
                battles.map(battle => (
                  <div
                    key={battle.id}
                    onClick={() => setSelectedBattle(battle)}
                    className={`p-2 mb-2 cursor-pointer border ${selectedBattle?.id === battle.id ? 'bg-blue-600 text-white border-blue-800' : 'bg-white border-gray-400 hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-xs uppercase ${selectedBattle?.id === battle.id ? 'text-white' : getBattleTypeColor(battle.battle_type)}`}>
                        {battle.battle_type}
                      </span>
                      {getStatusBadge(battle.status)}
                    </div>
                    <div className="text-xs opacity-75">
                      Prize: {battle.prize_pool} SOL
                    </div>
                    <div className="text-xs opacity-75">
                      Entry: {battle.entry_fee} SOL
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {selectedBattle ? (
              <div>
                <div className="bg-white border-2 border-gray-400 p-4 mb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className={`text-xl font-bold uppercase mb-1 ${getBattleTypeColor(selectedBattle.battle_type)}`}>
                        {selectedBattle.battle_type} Battle
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {getStatusBadge(selectedBattle.status)}
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {participants.length} participants
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-600">
                        <Trophy size={20} className="inline mr-1" />
                        {selectedBattle.prize_pool} SOL
                      </div>
                      <div className="text-xs text-gray-600">Prize Pool</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 border border-gray-300">
                      <div className="text-xs text-gray-600 mb-1">Entry Fee</div>
                      <div className="font-bold">{selectedBattle.entry_fee} SOL</div>
                    </div>
                    <div className="bg-gray-50 p-3 border border-gray-300">
                      <div className="text-xs text-gray-600 mb-1">Duration</div>
                      <div className="font-bold flex items-center gap-1">
                        <Clock size={14} />
                        {Math.floor((selectedBattle.config?.duration || 3600) / 60)} min
                      </div>
                    </div>
                  </div>

                  {selectedBattle.status === 'pending' && userSwarms.length > 0 && (
                    <div className="border-t border-gray-300 pt-3">
                      <h4 className="font-bold text-sm mb-2">Join with your swarm:</h4>
                      <div className="space-y-2">
                        {userSwarms.map(swarm => (
                          <div key={swarm.id} className="flex items-center justify-between bg-gray-50 p-2 border border-gray-300">
                            <div>
                              <div className="font-bold text-sm">{swarm.name}</div>
                              <div className="text-xs text-gray-600">
                                {swarm.win_rate.toFixed(1)}% win rate • Rep: {swarm.reputation_score}
                              </div>
                            </div>
                            <button
                              onClick={() => joinBattle(swarm.id)}
                              className="px-3 py-1 text-xs bg-green-500 text-white hover:bg-green-600 border border-green-700"
                            >
                              JOIN
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white border-2 border-gray-400 p-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Target size={16} />
                    Participants
                  </h3>

                  {participants.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No participants yet. Be the first to join!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {participants.map((participant, idx) => (
                        <div key={participant.id} className="flex items-center justify-between bg-gray-50 p-3 border border-gray-300">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-300'}`}>
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-sm">{participant.swarm?.name || 'Unknown Swarm'}</div>
                              <div className="text-xs text-gray-600">
                                {participant.trades_executed} trades
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {participant.profit_loss !== null && (
                              <div className={`font-bold ${participant.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {participant.profit_loss >= 0 ? '+' : ''}{participant.profit_loss.toFixed(3)} SOL
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Swords size={48} className="mx-auto mb-4" />
                <p>Select a battle to view details</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Swords size={64} className="mx-auto mb-4 text-purple-600" />
              <h2 className="text-2xl font-bold mb-2">Create Swarm Battle</h2>
              <p className="text-sm text-gray-600">
                Set up a competitive arena for AI agent swarms
              </p>
            </div>

            <div className="bg-white border-2 border-gray-400 p-6 mb-4">
              <h3 className="font-bold mb-4">Battle Types</h3>

              <div className="space-y-3">
                <div className="p-4 border-2 border-blue-400 bg-blue-50">
                  <div className="font-bold text-blue-600 mb-1">1v1 Duel</div>
                  <p className="text-xs text-gray-700">
                    Two swarms compete head-to-head. Winner takes all prize pool.
                  </p>
                </div>

                <div className="p-4 border-2 border-purple-400 bg-purple-50">
                  <div className="font-bold text-purple-600 mb-1">Tournament</div>
                  <p className="text-xs text-gray-700">
                    Multiple rounds, elimination-style. Top 3 swarms win prizes.
                  </p>
                </div>

                <div className="p-4 border-2 border-red-400 bg-red-50">
                  <div className="font-bold text-red-600 mb-1">Free-for-All</div>
                  <p className="text-xs text-gray-700">
                    All swarms compete simultaneously. Highest profit wins.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={createBattle}
                className="px-8 py-3 bg-purple-500 text-white font-bold hover:bg-purple-600 border-2 border-purple-700 text-lg"
              >
                <Zap size={20} className="inline mr-2" />
                CREATE BATTLE
              </button>
            </div>

            <div className="mt-6 bg-yellow-100 border border-yellow-400 p-4 text-xs">
              <p className="font-bold mb-2">Battle Rules:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>All participants start with equal virtual capital</li>
                <li>Swarms autonomously execute trades during battle</li>
                <li>Final ranking based on profit/loss percentage</li>
                <li>Entry fees go directly to prize pool</li>
                <li>Battle results are verifiable on-chain</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
