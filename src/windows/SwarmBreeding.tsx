import React, { useState, useEffect } from 'react';
import { Dna, Heart, Zap, Trophy, Clock, TrendingUp, AlertCircle, Check } from 'lucide-react';
import { BreedingService, BreedingContract, MarketplaceListing } from '../lib/breedingService';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';
import { supabase } from '../lib/supabase';

export const SwarmBreeding: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'myContracts' | 'propose'>('marketplace');
  const [marketplace, setMarketplace] = useState<any[]>([]);
  const [contracts, setContracts] = useState<BreedingContract[]>([]);
  const [mySwarms, setMySwarms] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const [proposalForm, setProposalForm] = useState({
    parent1_swarm_id: '',
    parent2_swarm_id: '',
    breeding_fee: '1',
    profit_share_percent: '10',
    profit_share_duration_days: '30'
  });

  useEffect(() => {
    loadMarketplace();
    loadMyContracts();
    loadMySwarms();
  }, []);

  const loadMarketplace = async () => {
    try {
      const listings = await BreedingService.getMarketplaceListings();
      setMarketplace(listings);
    } catch (error) {
      console.error('Error loading marketplace:', error);
    }
  };

  const loadMyContracts = async () => {
    try {
      const userContracts = await BreedingService.getUserBreedingContracts(getMockUserId());
      setContracts(userContracts);
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  const loadMySwarms = async () => {
    try {
      const { data } = await supabase
        .from('agent_swarms')
        .select('*, swarm_genetics(*)')
        .eq('user_id', getMockUserId());

      setMySwarms(data || []);
    } catch (error) {
      console.error('Error loading swarms:', error);
    }
  };

  const handleProposeBreeding = async () => {
    if (!proposalForm.parent1_swarm_id || !proposalForm.parent2_swarm_id) {
      soundManager.playError();
      return;
    }

    setLoading(true);
    soundManager.playClick();

    try {
      const { data: parent2Swarm } = await supabase
        .from('agent_swarms')
        .select('user_id')
        .eq('id', proposalForm.parent2_swarm_id)
        .single();

      if (!parent2Swarm) throw new Error('Parent 2 not found');

      await BreedingService.proposeBreeding(
        proposalForm.parent1_swarm_id,
        proposalForm.parent2_swarm_id,
        getMockUserId(),
        parent2Swarm.user_id,
        getMockUserId(),
        parseFloat(proposalForm.breeding_fee),
        parseFloat(proposalForm.profit_share_percent),
        parseInt(proposalForm.profit_share_duration_days)
      );

      soundManager.playSuccess();
      setProposalForm({
        parent1_swarm_id: '',
        parent2_swarm_id: '',
        breeding_fee: '1',
        profit_share_percent: '10',
        profit_share_duration_days: '30'
      });
      setActiveTab('myContracts');
      loadMyContracts();
    } catch (error: any) {
      console.error('Error proposing breeding:', error);
      alert(error.message);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptContract = async (contractId: string) => {
    setLoading(true);
    soundManager.playClick();

    try {
      await BreedingService.acceptBreedingProposal(contractId);
      await BreedingService.startIncubation(contractId);
      soundManager.playSuccess();
      loadMyContracts();
    } catch (error: any) {
      console.error('Error accepting contract:', error);
      alert(error.message);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteBreeding = async (contractId: string) => {
    setLoading(true);
    soundManager.playClick();

    try {
      const result = await BreedingService.completeBreeding(contractId);
      soundManager.playSuccess();
      alert(`Breeding complete! New swarm "${result.offspring.name}" born with ${result.mutations.length} mutations!`);
      loadMyContracts();
      loadMySwarms();
    } catch (error: any) {
      console.error('Error completing breeding:', error);
      alert(error.message);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-blue-600 bg-blue-100';
      case 'incubating': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRarityColor = (tier: string) => {
    switch (tier) {
      case 'mythic': return 'text-red-600 font-bold';
      case 'legendary': return 'text-orange-600 font-bold';
      case 'epic': return 'text-purple-600';
      case 'rare': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-4 bg-white h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Dna size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Swarm Breeding Laboratory</h2>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          className={`win98-button ${activeTab === 'marketplace' ? 'bg-white' : ''}`}
          onClick={() => {
            setActiveTab('marketplace');
            soundManager.playClick();
          }}
        >
          <Heart size={14} className="inline mr-1" />
          Marketplace
        </button>
        <button
          className={`win98-button ${activeTab === 'myContracts' ? 'bg-white' : ''}`}
          onClick={() => {
            setActiveTab('myContracts');
            soundManager.playClick();
          }}
        >
          <Clock size={14} className="inline mr-1" />
          My Contracts
        </button>
        <button
          className={`win98-button ${activeTab === 'propose' ? 'bg-white' : ''}`}
          onClick={() => {
            setActiveTab('propose');
            soundManager.playClick();
          }}
        >
          <Zap size={14} className="inline mr-1" />
          Propose Breeding
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'marketplace' && (
          <div className="space-y-3">
            {marketplace.length === 0 ? (
              <div className="win98-inset p-8 text-center text-gray-600">
                <Heart size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No active breeding listings</p>
              </div>
            ) : (
              marketplace.map((listing: any) => (
                <div key={listing.id} className="win98-inset p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-bold mb-1">
                        Swarm #{listing.swarm_id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        Type: {listing.listing_type.replace('_', ' ').toUpperCase()}
                      </div>
                      {listing.swarm_genetics && (
                        <div className="text-xs">
                          <div>Generation: {listing.swarm_genetics.generation}</div>
                          <div>Fitness: {listing.swarm_genetics.genetic_fitness.toFixed(1)}</div>
                          <div>Breedings Left: {listing.available_breedings}</div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{listing.breeding_fee} SOL</div>
                      {listing.profit_share_offered > 0 && (
                        <div className="text-xs text-green-600">
                          +{listing.profit_share_offered}% profit share
                        </div>
                      )}
                    </div>
                  </div>

                  {listing.swarm_genetics?.legendary_traits?.length > 0 && (
                    <div className="text-xs mb-2">
                      <Trophy size={12} className="inline text-orange-500" />
                      <span className="ml-1 text-orange-600 font-bold">
                        {listing.swarm_genetics.legendary_traits.length} Legendary Traits
                      </span>
                    </div>
                  )}

                  <button
                    className="win98-button text-xs w-full"
                    onClick={() => {
                      setSelectedListing(listing);
                      soundManager.playClick();
                    }}
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'myContracts' && (
          <div className="space-y-3">
            {contracts.length === 0 ? (
              <div className="win98-inset p-8 text-center text-gray-600">
                <Clock size={48} className="mx-auto mb-4 text-gray-400" />
                <p>No breeding contracts</p>
              </div>
            ) : (
              contracts.map((contract) => (
                <div key={contract.id} className="win98-inset p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(contract.status)}`}>
                          {contract.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>Parents: {contract.parent1_swarm_id.slice(0, 8)} × {contract.parent2_swarm_id.slice(0, 8)}</div>
                        <div>Fee: {contract.breeding_fee} SOL</div>
                        {contract.compatibility_score && (
                          <div>Compatibility: {contract.compatibility_score.toFixed(0)}%</div>
                        )}
                        {contract.predicted_fitness && (
                          <div>Predicted Fitness: {contract.predicted_fitness.toFixed(0)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {contract.status === 'proposed' && contract.parent2_owner_id === getMockUserId() && (
                    <button
                      className="win98-button text-xs w-full mb-1"
                      onClick={() => handleAcceptContract(contract.id!)}
                      disabled={loading}
                    >
                      <Check size={12} className="inline mr-1" />
                      Accept & Start Incubation
                    </button>
                  )}

                  {contract.status === 'incubating' && (
                    <div>
                      <div className="progress-bar mb-2">
                        <div className="progress-bar-fill animate-pulse" style={{ width: '60%' }} />
                      </div>
                      <button
                        className="win98-button text-xs w-full"
                        onClick={() => handleCompleteBreeding(contract.id!)}
                        disabled={loading}
                      >
                        Complete Breeding (Dev: Skip Wait)
                      </button>
                    </div>
                  )}

                  {contract.status === 'completed' && contract.offspring_swarm_id && (
                    <div className="text-xs text-green-600 font-bold">
                      <Trophy size={12} className="inline" />
                      <span className="ml-1">Offspring: {contract.offspring_swarm_id.slice(0, 8)}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'propose' && (
          <div className="win98-inset p-4 space-y-3">
            <h3 className="font-bold mb-3">Propose New Breeding</h3>

            <div>
              <label className="block text-sm font-bold mb-1">Your Swarm (Parent 1) *</label>
              <select
                className="win98-inset w-full p-2 text-sm"
                value={proposalForm.parent1_swarm_id}
                onChange={(e) => setProposalForm({ ...proposalForm, parent1_swarm_id: e.target.value })}
              >
                <option value="">Select your swarm...</option>
                {mySwarms.map((swarm) => (
                  <option key={swarm.id} value={swarm.id}>
                    {swarm.name} - Gen {swarm.swarm_genetics?.[0]?.generation || 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">Partner Swarm (Parent 2) *</label>
              <select
                className="win98-inset w-full p-2 text-sm"
                value={proposalForm.parent2_swarm_id}
                onChange={(e) => setProposalForm({ ...proposalForm, parent2_swarm_id: e.target.value })}
              >
                <option value="">Select partner swarm...</option>
                {marketplace.map((listing: any) => (
                  <option key={listing.swarm_id} value={listing.swarm_id}>
                    Swarm #{listing.swarm_id.slice(0, 8)} - {listing.breeding_fee} SOL
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-bold mb-1">Breeding Fee (SOL)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="win98-inset w-full p-2 text-sm"
                  value={proposalForm.breeding_fee}
                  onChange={(e) => setProposalForm({ ...proposalForm, breeding_fee: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Profit Share (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="win98-inset w-full p-2 text-sm"
                  value={proposalForm.profit_share_percent}
                  onChange={(e) => setProposalForm({ ...proposalForm, profit_share_percent: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Duration (days)</label>
                <input
                  type="number"
                  min="0"
                  className="win98-inset w-full p-2 text-sm"
                  value={proposalForm.profit_share_duration_days}
                  onChange={(e) => setProposalForm({ ...proposalForm, profit_share_duration_days: e.target.value })}
                />
              </div>
            </div>

            <div className="win98-inset p-2 bg-blue-50 text-xs">
              <AlertCircle size={14} className="inline mr-1" />
              <span>Breeding creates a hybrid offspring with traits from both parents. Mutations may occur!</span>
            </div>

            <button
              className="win98-button w-full"
              onClick={handleProposeBreeding}
              disabled={loading || !proposalForm.parent1_swarm_id || !proposalForm.parent2_swarm_id}
            >
              {loading ? 'Proposing...' : 'Propose Breeding Contract'}
            </button>
          </div>
        )}
      </div>

      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="win98-window" style={{ width: '500px', maxHeight: '80vh' }}>
            <div className="win98-titlebar">
              <span>Breeding Listing Details</span>
              <button
                className="win98-titlebar-button"
                onClick={() => {
                  setSelectedListing(null);
                  soundManager.playClick();
                }}
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <h3 className="font-bold mb-2">Swarm #{selectedListing.swarm_id.slice(0, 8)}</h3>

              {selectedListing.swarm_genetics && (
                <div className="win98-inset p-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <strong>Generation:</strong> {selectedListing.swarm_genetics.generation}
                    </div>
                    <div>
                      <strong>Fitness:</strong> {selectedListing.swarm_genetics.genetic_fitness.toFixed(1)}
                    </div>
                    <div>
                      <strong>Breeding Count:</strong> {selectedListing.swarm_genetics.breeding_count}/{selectedListing.swarm_genetics.max_breeding}
                    </div>
                    <div>
                      <strong>Mutation Rate:</strong> {selectedListing.swarm_genetics.mutation_rate.toFixed(1)}%
                    </div>
                  </div>

                  {selectedListing.swarm_genetics.legendary_traits?.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="font-bold mb-2 flex items-center gap-1">
                        <Trophy size={14} className="text-orange-500" />
                        Legendary Traits
                      </div>
                      {selectedListing.swarm_genetics.legendary_traits.map((trait: any, i: number) => (
                        <div key={i} className="text-xs mb-1">
                          <span className={getRarityColor(trait.rarity)}>{trait.name}</span>: {trait.description}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="win98-inset p-3">
                <div className="text-sm mb-2">
                  <strong>Breeding Fee:</strong> {selectedListing.breeding_fee} SOL
                </div>
                {selectedListing.profit_share_offered > 0 && (
                  <div className="text-sm mb-2">
                    <strong>Profit Share:</strong> {selectedListing.profit_share_offered}%
                  </div>
                )}
                <div className="text-sm">
                  <strong>Available Breedings:</strong> {selectedListing.available_breedings}
                </div>
              </div>

              <button
                className="win98-button w-full mt-3"
                onClick={() => {
                  setProposalForm({
                    ...proposalForm,
                    parent2_swarm_id: selectedListing.swarm_id,
                    breeding_fee: selectedListing.breeding_fee.toString()
                  });
                  setSelectedListing(null);
                  setActiveTab('propose');
                  soundManager.playClick();
                }}
              >
                Propose Breeding with This Swarm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
