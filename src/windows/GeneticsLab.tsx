import React, { useState, useEffect } from 'react';
import { Microscope, Dna, TrendingUp, Zap, Info, GitBranch, Sparkles } from 'lucide-react';
import { BreedingService, SwarmGenetics } from '../lib/breedingService';
import { GeneticAlgorithm } from '../lib/geneticAlgorithm';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';
import { supabase } from '../lib/supabase';

export const GeneticsLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'lineage' | 'mutations' | 'legendary'>('analyze');
  const [mySwarms, setMySwarms] = useState<any[]>([]);
  const [selectedSwarm, setSelectedSwarm] = useState<any | null>(null);
  const [genetics, setGenetics] = useState<SwarmGenetics | null>(null);
  const [lineage, setLineage] = useState<any | null>(null);
  const [mutations, setMutations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMySwarms();
  }, []);

  const loadMySwarms = async () => {
    try {
      const { data } = await supabase
        .from('agent_swarms')
        .select('*')
        .eq('user_id', getMockUserId());

      setMySwarms(data || []);
    } catch (error) {
      console.error('Error loading swarms:', error);
    }
  };

  const handleSelectSwarm = async (swarm: any) => {
    setSelectedSwarm(swarm);
    setLoading(true);
    soundManager.playClick();

    try {
      let swarmGenetics = await BreedingService.getSwarmGenetics(swarm.id);

      if (!swarmGenetics) {
        swarmGenetics = await BreedingService.initializeSwarmGenetics(swarm.id, getMockUserId());
      }

      setGenetics(swarmGenetics);

      const swarmLineage = await BreedingService.getSwarmLineage(swarm.id);
      setLineage(swarmLineage);

      const swarmMutations = await BreedingService.getSwarmMutations(swarm.id);
      setMutations(swarmMutations);
    } catch (error) {
      console.error('Error loading swarm details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTraitColor = (value: number) => {
    if (value >= 80) return 'text-green-600 font-bold';
    if (value >= 60) return 'text-blue-600';
    if (value >= 40) return 'text-gray-600';
    return 'text-red-600';
  };

  const getRarityColor = (tier: string) => {
    switch (tier) {
      case 'mythic': return 'text-red-600 font-bold';
      case 'legendary': return 'text-orange-600 font-bold';
      case 'epic': return 'text-purple-600';
      case 'rare': return 'text-blue-600';
      case 'uncommon': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getMutationTypeIcon = (type: string) => {
    switch (type) {
      case 'legendary': return <Sparkles size={14} className="text-orange-500" />;
      case 'beneficial': return <TrendingUp size={14} className="text-green-500" />;
      case 'detrimental': return <Zap size={14} className="text-red-500" />;
      default: return <Info size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="p-4 bg-white h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Microscope size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Genetics Research Lab</h2>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-bold mb-1">Select Swarm to Analyze</label>
        <select
          className="win98-inset w-full p-2"
          value={selectedSwarm?.id || ''}
          onChange={(e) => {
            const swarm = mySwarms.find(s => s.id === e.target.value);
            if (swarm) handleSelectSwarm(swarm);
          }}
        >
          <option value="">Choose a swarm...</option>
          {mySwarms.map((swarm) => (
            <option key={swarm.id} value={swarm.id}>
              {swarm.name}
            </option>
          ))}
        </select>
      </div>

      {selectedSwarm && genetics && (
        <>
          <div className="flex gap-1 mb-4">
            <button
              className={`win98-button ${activeTab === 'analyze' ? 'bg-white' : ''}`}
              onClick={() => {
                setActiveTab('analyze');
                soundManager.playClick();
              }}
            >
              <Dna size={14} className="inline mr-1" />
              DNA Analysis
            </button>
            <button
              className={`win98-button ${activeTab === 'lineage' ? 'bg-white' : ''}`}
              onClick={() => {
                setActiveTab('lineage');
                soundManager.playClick();
              }}
            >
              <GitBranch size={14} className="inline mr-1" />
              Lineage
            </button>
            <button
              className={`win98-button ${activeTab === 'mutations' ? 'bg-white' : ''}`}
              onClick={() => {
                setActiveTab('mutations');
                soundManager.playClick();
              }}
            >
              <Zap size={14} className="inline mr-1" />
              Mutations
            </button>
            <button
              className={`win98-button ${activeTab === 'legendary' ? 'bg-white' : ''}`}
              onClick={() => {
                setActiveTab('legendary');
                soundManager.playClick();
              }}
            >
              <Sparkles size={14} className="inline mr-1" />
              Legendary
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'analyze' && (
              <div className="space-y-3">
                <div className="win98-inset p-3">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Dna size={16} />
                    Genetic Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>Generation:</strong> {genetics.generation}
                    </div>
                    <div>
                      <strong>Genetic Fitness:</strong>{' '}
                      <span className={getTraitColor(genetics.genetic_fitness)}>
                        {genetics.genetic_fitness.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <strong>Mutation Rate:</strong> {genetics.mutation_rate.toFixed(1)}%
                    </div>
                    <div>
                      <strong>Breeding Count:</strong> {genetics.breeding_count}/{genetics.max_breeding}
                    </div>
                  </div>

                  {genetics.legendary_traits?.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="font-bold mb-2 text-orange-600">
                        <Sparkles size={14} className="inline mr-1" />
                        {genetics.legendary_traits.length} Legendary Traits Active
                      </div>
                    </div>
                  )}
                </div>

                <div className="win98-inset p-3">
                  <h3 className="font-bold mb-3">12 Core Traits</h3>
                  <div className="space-y-2">
                    {genetics.trait_scores && Object.entries(genetics.trait_scores).map(([trait, value]: [string, any]) => (
                      <div key={trait}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{trait.replace(/_/g, ' ')}</span>
                          <span className={getTraitColor(value)}>{value.toFixed(0)}</span>
                        </div>
                        <div className="win98-inset h-3 bg-gray-200">
                          <div
                            className={`h-full ${
                              value >= 80 ? 'bg-green-500' :
                              value >= 60 ? 'bg-blue-500' :
                              value >= 40 ? 'bg-gray-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {genetics.trait_synergies && genetics.trait_synergies.length > 0 && (
                  <div className="win98-inset p-3">
                    <h3 className="font-bold mb-3 text-purple-600">
                      <Zap size={16} className="inline mr-1" />
                      Active Synergies
                    </h3>
                    {genetics.trait_synergies.map((synergy: any, index: number) => (
                      <div key={index} className="mb-2 text-sm">
                        <div className="font-bold">{synergy.name}</div>
                        <div className="text-xs text-gray-600">{synergy.description}</div>
                        <div className="text-xs text-green-600">+{synergy.bonus} bonus</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lineage' && lineage && (
              <div className="space-y-3">
                <div className="win98-inset p-3">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <GitBranch size={16} />
                    Family Tree
                  </h3>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Generation:</strong> {lineage.generation}
                    </div>
                    <div>
                      <strong>Bloodline:</strong>{' '}
                      <span className={getRarityColor(lineage.bloodline_tier)}>
                        {lineage.bloodline_tier.toUpperCase()}
                      </span>
                    </div>
                    {lineage.bloodline_name && (
                      <div>
                        <strong>Family Name:</strong> {lineage.bloodline_name}
                      </div>
                    )}
                    <div>
                      <strong>Inbreeding Coefficient:</strong>{' '}
                      {(lineage.inbreeding_coefficient * 100).toFixed(1)}%
                    </div>
                  </div>

                  {lineage.parent1_id && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="font-bold mb-2">Parents</div>
                      <div className="text-xs space-y-1">
                        <div>Parent 1: {lineage.parent1_id.slice(0, 8)}...</div>
                        {lineage.parent2_id && (
                          <div>Parent 2: {lineage.parent2_id.slice(0, 8)}...</div>
                        )}
                      </div>
                    </div>
                  )}

                  {lineage.ancestor_ids && lineage.ancestor_ids.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="font-bold mb-2">Ancestors</div>
                      <div className="text-xs">{lineage.ancestor_ids.length} ancestors in family tree</div>
                    </div>
                  )}

                  {lineage.descendant_ids && lineage.descendant_ids.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="font-bold mb-2">Descendants</div>
                      <div className="text-xs">{lineage.descendant_ids.length} offspring produced</div>
                    </div>
                  )}
                </div>

                {lineage.family_achievements && lineage.family_achievements.length > 0 && (
                  <div className="win98-inset p-3">
                    <h3 className="font-bold mb-3">Family Achievements</h3>
                    {lineage.family_achievements.map((achievement: any, index: number) => (
                      <div key={index} className="text-sm mb-2">
                        <div className="font-bold">{achievement.name}</div>
                        <div className="text-xs text-gray-600">{achievement.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'mutations' && (
              <div className="space-y-3">
                {mutations.length === 0 ? (
                  <div className="win98-inset p-8 text-center text-gray-600">
                    <Zap size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No mutations detected</p>
                    <p className="text-xs mt-2">Mutations occur during breeding</p>
                  </div>
                ) : (
                  mutations.map((mutation) => (
                    <div key={mutation.id} className="win98-inset p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMutationTypeIcon(mutation.mutation_type)}
                          <span className="font-bold">{mutation.mutation_name}</span>
                        </div>
                        <span className={getRarityColor(mutation.rarity_tier)}>
                          {mutation.rarity_tier.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-sm mb-2">
                        <strong>Trait:</strong> {mutation.trait_affected.replace(/_/g, ' ')}
                      </div>

                      {mutation.mutation_description && (
                        <div className="text-xs text-gray-600 mb-2">
                          {mutation.mutation_description}
                        </div>
                      )}

                      <div className="text-xs">
                        <span className={mutation.effect_value >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {mutation.effect_value >= 0 ? '+' : ''}{mutation.effect_value.toFixed(1)} effect
                        </span>
                        {mutation.is_hereditary && (
                          <span className="ml-2 text-purple-600">• Hereditary</span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        Source: {mutation.trigger_source}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'legendary' && (
              <div className="space-y-3">
                {genetics.legendary_traits && genetics.legendary_traits.length > 0 ? (
                  genetics.legendary_traits.map((trait: any, index: number) => (
                    <div key={index} className="win98-inset p-3 border-2 border-orange-400">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-orange-500" />
                        <span className={`font-bold ${getRarityColor(trait.rarity)}`}>
                          {trait.name}
                        </span>
                      </div>

                      <div className="text-sm mb-2">{trait.description}</div>

                      <div className="text-sm font-bold text-green-600">{trait.effect}</div>

                      <div className="text-xs text-gray-600 mt-2">
                        Bonus: +{trait.bonus_value}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="win98-inset p-8 text-center text-gray-600">
                    <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
                    <p>No legendary traits</p>
                    <p className="text-xs mt-2">Legendary traits have a 5% chance during breeding</p>
                  </div>
                )}

                <div className="win98-inset p-3 bg-blue-50">
                  <h3 className="font-bold mb-3">All Possible Legendary Traits</h3>
                  {GeneticAlgorithm.getAllLegendaryTraits().map((trait, index) => (
                    <div key={index} className="text-xs mb-2 pb-2 border-b last:border-0">
                      <div className="font-bold text-orange-600">{trait.name}</div>
                      <div className="text-gray-600">{trait.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!selectedSwarm && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-600">
            <Microscope size={64} className="mx-auto mb-4 text-gray-400" />
            <p>Select a swarm to begin genetic analysis</p>
          </div>
        </div>
      )}
    </div>
  );
};
