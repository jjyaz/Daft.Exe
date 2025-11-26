import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, TrendingUp, Shield, Target, Award, GitMerge } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { swarmService, AgentEvolution as AgentEvolutionType } from '../lib/swarmService';
import { supabase } from '../lib/supabase';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  evolution?: AgentEvolutionType;
}

export const AgentEvolution: React.FC = () => {
  const { walletAddress, walletConnected } = useAppContext();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [breedingMode, setBreedingMode] = useState(false);
  const [selectedParents, setSelectedParents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletConnected && walletAddress) {
      loadAgents();
    }
  }, [walletConnected, walletAddress]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (userData) {
        const { data: agentData } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('user_id', userData.id);

        if (agentData) {
          const agentsWithEvolution = await Promise.all(
            agentData.map(async (agent) => {
              let evolution = await swarmService.getAgentEvolution(agent.id);

              if (!evolution) {
                evolution = await swarmService.createAgentEvolution(agent.id, userData.id);
              }

              return {
                ...agent,
                evolution
              };
            })
          );

          setAgents(agentsWithEvolution);
          if (agentsWithEvolution.length > 0 && !selectedAgent) {
            setSelectedAgent(agentsWithEvolution[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const trainAgent = async () => {
    if (!selectedAgent || !selectedAgent.evolution) return;

    try {
      const xpGained = Math.floor(Math.random() * 500) + 100;
      const updatedEvolution = await swarmService.addExperience(selectedAgent.id, xpGained);

      setSelectedAgent({
        ...selectedAgent,
        evolution: updatedEvolution
      });

      setAgents(agents.map(a =>
        a.id === selectedAgent.id
          ? { ...a, evolution: updatedEvolution }
          : a
      ));

      alert(`Training complete! Gained ${xpGained} XP. Level: ${updatedEvolution.level}`);
    } catch (error) {
      console.error('Error training agent:', error);
      alert('Failed to train agent');
    }
  };

  const toggleParentSelection = (agent: Agent) => {
    if (!agent.evolution || agent.evolution.level < 5) {
      alert('Agent must be at least level 5 to breed');
      return;
    }

    if (selectedParents.find(p => p.id === agent.id)) {
      setSelectedParents(selectedParents.filter(p => p.id !== agent.id));
    } else if (selectedParents.length < 2) {
      setSelectedParents([...selectedParents, agent]);
    } else {
      alert('You can only select 2 parents');
    }
  };

  const breedAgents = async () => {
    if (selectedParents.length !== 2) {
      alert('Select exactly 2 parent agents');
      return;
    }

    const childName = prompt('Enter name for new agent:');
    if (!childName) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (!userData) return;

      const { data: newAgent } = await supabase
        .from('ai_agents')
        .insert({
          user_id: userData.id,
          name: childName,
          type: 'hybrid',
          status: 'standby'
        })
        .select()
        .single();

      if (!newAgent) throw new Error('Failed to create agent');

      const childEvolution = await swarmService.breedAgents(
        selectedParents[0].id,
        selectedParents[1].id,
        userData.id,
        newAgent.id
      );

      const newAgentWithEvolution = {
        ...newAgent,
        evolution: childEvolution
      };

      setAgents([...agents, newAgentWithEvolution]);
      setSelectedParents([]);
      setBreedingMode(false);
      alert(`Successfully bred new agent: ${childName} (Generation ${childEvolution.generation})`);
    } catch (error) {
      console.error('Error breeding agents:', error);
      alert('Failed to breed agents');
    }
  };

  const getTraitColor = (value: number) => {
    if (value >= 80) return 'text-purple-600';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-green-600';
    return 'text-gray-600';
  };

  const getTraitBar = (value: number) => {
    return (
      <div className="h-2 bg-gray-300 border border-gray-400">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  };

  if (!walletConnected) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-sm">Connect wallet to evolve your agents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="flex border-b border-gray-300 bg-gray-200 px-3 py-2">
        <button
          onClick={() => { setBreedingMode(false); setSelectedParents([]); }}
          className={`px-4 py-1 text-xs mr-2 ${!breedingMode ? 'bg-white border-2 border-gray-400' : 'bg-gray-300 border border-gray-400'}`}
        >
          Evolution
        </button>
        <button
          onClick={() => setBreedingMode(true)}
          className={`px-4 py-1 text-xs ${breedingMode ? 'bg-white border-2 border-gray-400' : 'bg-gray-300 border border-gray-400'}`}
        >
          Breeding
        </button>
        {breedingMode && selectedParents.length === 2 && (
          <button
            onClick={breedAgents}
            className="ml-auto px-4 py-1 text-xs bg-purple-500 text-white hover:bg-purple-600 border border-purple-700"
          >
            <GitMerge size={12} className="inline mr-1" />
            Breed Selected
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 border-r border-gray-300 bg-gray-50 overflow-y-auto">
          <div className="p-2">
            <h3 className="font-bold text-xs mb-2 text-gray-600">YOUR AGENTS</h3>
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => {
                  if (breedingMode) {
                    toggleParentSelection(agent);
                  } else {
                    setSelectedAgent(agent);
                  }
                }}
                className={`p-2 mb-1 cursor-pointer border text-xs ${
                  breedingMode && selectedParents.find(p => p.id === agent.id)
                    ? 'bg-purple-600 text-white border-purple-800'
                    : selectedAgent?.id === agent.id && !breedingMode
                    ? 'bg-blue-600 text-white border-blue-800'
                    : 'bg-white border-gray-400 hover:bg-gray-100'
                }`}
              >
                <div className="font-bold truncate">{agent.name}</div>
                {agent.evolution && (
                  <div className="flex items-center gap-1 mt-1 opacity-75">
                    <Award size={10} />
                    <span>Lvl {agent.evolution.level}</span>
                    <span className="ml-auto">Gen {agent.evolution.generation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {!breedingMode && selectedAgent && selectedAgent.evolution ? (
            <div>
              <div className="bg-white border-2 border-gray-400 p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selectedAgent.name}</h2>
                    <p className="text-xs text-gray-600 uppercase">{selectedAgent.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">Lvl {selectedAgent.evolution.level}</div>
                    <div className="text-xs text-gray-600">Gen {selectedAgent.evolution.generation}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Experience</span>
                    <span className="font-bold">{selectedAgent.evolution.experience} XP</span>
                  </div>
                  <div className="h-3 bg-gray-300 border border-gray-400">
                    <div
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                      style={{ width: `${(selectedAgent.evolution.experience % 1000) / 10}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {1000 - (selectedAgent.evolution.experience % 1000)} XP to next level
                  </div>
                </div>

                <button
                  onClick={trainAgent}
                  className="w-full py-2 bg-blue-500 text-white hover:bg-blue-600 border border-blue-700 font-bold"
                >
                  <Zap size={16} className="inline mr-2" />
                  TRAIN AGENT
                </button>
              </div>

              <div className="bg-white border-2 border-gray-400 p-4 mb-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Traits & Abilities
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <Zap size={14} className="text-yellow-500" />
                        Speed
                      </span>
                      <span className={`font-bold ${getTraitColor(selectedAgent.evolution.traits.speed)}`}>
                        {selectedAgent.evolution.traits.speed}/100
                      </span>
                    </div>
                    {getTraitBar(selectedAgent.evolution.traits.speed)}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <Target size={14} className="text-blue-500" />
                        Accuracy
                      </span>
                      <span className={`font-bold ${getTraitColor(selectedAgent.evolution.traits.accuracy)}`}>
                        {selectedAgent.evolution.traits.accuracy}/100
                      </span>
                    </div>
                    {getTraitBar(selectedAgent.evolution.traits.accuracy)}
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={14} className="text-red-500" />
                        Risk Tolerance
                      </span>
                      <span className={`font-bold ${getTraitColor(selectedAgent.evolution.traits.risk_tolerance)}`}>
                        {selectedAgent.evolution.traits.risk_tolerance}/100
                      </span>
                    </div>
                    {getTraitBar(selectedAgent.evolution.traits.risk_tolerance)}
                  </div>
                </div>

                {selectedAgent.evolution.mutation_count > 0 && (
                  <div className="mt-3 p-2 bg-purple-100 border border-purple-400 text-xs">
                    <Sparkles size={12} className="inline text-purple-600 mr-1" />
                    <span className="font-bold text-purple-800">
                      Mutated: {selectedAgent.evolution.mutation_count} unique trait{selectedAgent.evolution.mutation_count > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {selectedAgent.evolution.parent_ids.length > 0 && (
                <div className="bg-white border-2 border-gray-400 p-4">
                  <h3 className="font-bold mb-2 flex items-center gap-2 text-sm">
                    <GitMerge size={14} />
                    Lineage
                  </h3>
                  <p className="text-xs text-gray-600">
                    Bred from {selectedAgent.evolution.parent_ids.length} parent agents
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Generation: {selectedAgent.evolution.generation}
                  </p>
                </div>
              )}
            </div>
          ) : breedingMode ? (
            <div className="text-center py-8">
              <GitMerge size={48} className="mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-bold mb-2">Agent Breeding</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select 2 parent agents (Level 5+) to create a new hybrid agent
              </p>

              <div className="bg-yellow-100 border border-yellow-400 p-3 text-xs text-left max-w-md mx-auto">
                <p className="font-bold mb-2">Breeding Rules:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Both parents must be Level 5 or higher</li>
                  <li>Child inherits averaged traits from parents</li>
                  <li>Random mutations can occur (±10 trait points)</li>
                  <li>Generation increases by 1</li>
                  <li>Child starts at Level 1 with 0 XP</li>
                </ul>
              </div>

              {selectedParents.length > 0 && (
                <div className="mt-4 max-w-md mx-auto">
                  <h4 className="font-bold text-sm mb-2">Selected Parents:</h4>
                  <div className="flex gap-2 justify-center">
                    {selectedParents.map(parent => (
                      <div key={parent.id} className="bg-purple-100 border-2 border-purple-400 p-3 text-left">
                        <div className="font-bold text-sm">{parent.name}</div>
                        <div className="text-xs text-gray-600">Level {parent.evolution?.level}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield size={48} className="mx-auto mb-4" />
              <p>Select an agent to view evolution details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
