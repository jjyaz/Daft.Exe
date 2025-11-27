import { supabase } from './supabase';
import { aiEngine } from './ai';
import { GeneticAlgorithm, GeneticData, MutationResult, LegendaryTrait } from './geneticAlgorithm';

export interface SwarmGenetics {
  id?: string;
  swarm_id: string;
  user_id: string;
  genetic_sequence: any;
  dominant_traits: any;
  recessive_traits: any;
  trait_scores: any;
  genetic_fitness: number;
  mutation_rate: number;
  generation: number;
  parent_ids: string[];
  legendary_traits: LegendaryTrait[];
  trait_synergies: any[];
  breeding_count: number;
  max_breeding: number;
  last_bred_at?: string;
  nft_token_id?: string;
}

export interface BreedingContract {
  id?: string;
  parent1_swarm_id: string;
  parent2_swarm_id: string;
  parent1_owner_id: string;
  parent2_owner_id: string;
  offspring_swarm_id?: string;
  offspring_owner_id: string;
  breeding_fee: number;
  profit_share_percent: number;
  profit_share_duration_days: number;
  status: 'proposed' | 'accepted' | 'incubating' | 'completed' | 'cancelled' | 'rejected';
  parent1_performance_proof?: string;
  parent2_performance_proof?: string;
  compatibility_score?: number;
  predicted_fitness?: number;
  contract_terms: any;
  proposed_at?: string;
  accepted_at?: string;
  incubation_started_at?: string;
  completed_at?: string;
}

export interface MarketplaceListing {
  id?: string;
  swarm_id: string;
  owner_id: string;
  listing_type: 'stud_service' | 'breeding_request' | 'rental';
  breeding_fee: number;
  profit_share_offered: number;
  requirements: any;
  performance_proof?: string;
  available_breedings: number;
  status: 'active' | 'paused' | 'completed' | 'expired';
  views: number;
  proposals_received: number;
}

export class BreedingService {
  static async initializeSwarmGenetics(swarmId: string, userId: string): Promise<SwarmGenetics> {
    const { data: existingGenetics } = await supabase
      .from('swarm_genetics')
      .select('*')
      .eq('swarm_id', swarmId)
      .maybeSingle();

    if (existingGenetics) {
      return existingGenetics;
    }

    const { data: swarm } = await supabase
      .from('agent_swarms')
      .select('*')
      .eq('id', swarmId)
      .single();

    if (!swarm) throw new Error('Swarm not found');

    const geneticData = GeneticAlgorithm.initializeGenes();
    const fitness = GeneticAlgorithm.calculateGeneticFitness(
      geneticData.trait_scores,
      swarm.win_rate || 0,
      swarm.total_profit || 0
    );

    const genetics: Omit<SwarmGenetics, 'id'> = {
      swarm_id: swarmId,
      user_id: userId,
      genetic_sequence: geneticData,
      dominant_traits: geneticData.dominant_traits,
      recessive_traits: geneticData.recessive_traits,
      trait_scores: geneticData.trait_scores,
      genetic_fitness: fitness,
      mutation_rate: geneticData.mutation_rate,
      generation: 1,
      parent_ids: [],
      legendary_traits: [],
      trait_synergies: GeneticAlgorithm.detectSynergies(geneticData.trait_scores),
      breeding_count: 0,
      max_breeding: 5
    };

    const { data, error } = await supabase
      .from('swarm_genetics')
      .insert([genetics])
      .select()
      .single();

    if (error) throw error;

    await supabase.from('swarm_lineage').insert([{
      swarm_id: swarmId,
      generation: 1,
      bloodline_tier: 'common',
      inbreeding_coefficient: 0
    }]);

    return data;
  }

  static async getSwarmGenetics(swarmId: string): Promise<SwarmGenetics | null> {
    const { data, error } = await supabase
      .from('swarm_genetics')
      .select('*')
      .eq('swarm_id', swarmId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async proposeBreeding(
    parent1SwarmId: string,
    parent2SwarmId: string,
    parent1OwnerId: string,
    parent2OwnerId: string,
    offspringOwnerId: string,
    breedingFee: number,
    profitSharePercent: number,
    profitShareDurationDays: number
  ): Promise<BreedingContract> {
    const genetics1 = await this.getSwarmGenetics(parent1SwarmId);
    const genetics2 = await this.getSwarmGenetics(parent2SwarmId);

    if (!genetics1 || !genetics2) {
      throw new Error('Both swarms must have genetics initialized');
    }

    if (genetics1.breeding_count >= genetics1.max_breeding) {
      throw new Error('Parent 1 has reached maximum breeding capacity');
    }

    if (genetics2.breeding_count >= genetics2.max_breeding) {
      throw new Error('Parent 2 has reached maximum breeding capacity');
    }

    if (genetics1.last_bred_at) {
      const cooldown = 7 * 24 * 60 * 60 * 1000;
      const timeSince = Date.now() - new Date(genetics1.last_bred_at).getTime();
      if (timeSince < cooldown) {
        throw new Error('Parent 1 is in cooldown period');
      }
    }

    const geneticData1: GeneticData = {
      dominant_traits: genetics1.dominant_traits,
      recessive_traits: genetics1.recessive_traits,
      trait_scores: genetics1.trait_scores,
      mutation_rate: genetics1.mutation_rate,
      generation: genetics1.generation
    };

    const geneticData2: GeneticData = {
      dominant_traits: genetics2.dominant_traits,
      recessive_traits: genetics2.recessive_traits,
      trait_scores: genetics2.trait_scores,
      mutation_rate: genetics2.mutation_rate,
      generation: genetics2.generation
    };

    const compatibility = GeneticAlgorithm.calculateCompatibility(geneticData1, geneticData2);
    const predictedFitness = GeneticAlgorithm.predictOffspringFitness(
      genetics1.genetic_fitness,
      genetics2.genetic_fitness,
      compatibility
    );

    const proof1 = await aiEngine.generateZKProof(
      JSON.stringify({
        swarmId: parent1SwarmId,
        fitness: genetics1.genetic_fitness,
        winRate: 'verified',
        timestamp: Date.now()
      })
    );

    const proof2 = await aiEngine.generateZKProof(
      JSON.stringify({
        swarmId: parent2SwarmId,
        fitness: genetics2.genetic_fitness,
        winRate: 'verified',
        timestamp: Date.now()
      })
    );

    const contract: Omit<BreedingContract, 'id'> = {
      parent1_swarm_id: parent1SwarmId,
      parent2_swarm_id: parent2SwarmId,
      parent1_owner_id: parent1OwnerId,
      parent2_owner_id: parent2OwnerId,
      offspring_owner_id: offspringOwnerId,
      breeding_fee: breedingFee,
      profit_share_percent: profitSharePercent,
      profit_share_duration_days: profitShareDurationDays,
      status: 'proposed',
      parent1_performance_proof: proof1,
      parent2_performance_proof: proof2,
      compatibility_score: compatibility,
      predicted_fitness: predictedFitness,
      contract_terms: {
        min_compatibility: 50,
        mutation_chance: genetics1.mutation_rate,
        estimated_generation: Math.max(genetics1.generation, genetics2.generation) + 1
      }
    };

    const { data, error } = await supabase
      .from('breeding_contracts')
      .insert([contract])
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  static async acceptBreedingProposal(contractId: string): Promise<void> {
    const { data: contract } = await supabase
      .from('breeding_contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (!contract) throw new Error('Contract not found');
    if (contract.status !== 'proposed') throw new Error('Contract not in proposed state');

    await supabase
      .from('breeding_contracts')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', contractId);
  }

  static async startIncubation(contractId: string): Promise<void> {
    const { data: contract } = await supabase
      .from('breeding_contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (!contract) throw new Error('Contract not found');
    if (contract.status !== 'accepted') throw new Error('Contract must be accepted first');

    const incubationHours = 24 + Math.floor(Math.random() * 24);
    const estimatedCompletion = new Date();
    estimatedCompletion.setHours(estimatedCompletion.getHours() + incubationHours);

    await supabase
      .from('breeding_contracts')
      .update({
        status: 'incubating',
        incubation_started_at: new Date().toISOString()
      })
      .eq('id', contractId);

    await supabase.from('incubation_queue').insert([{
      breeding_contract_id: contractId,
      user_id: contract.offspring_owner_id,
      incubation_duration_hours: incubationHours,
      estimated_completion: estimatedCompletion.toISOString()
    }]);
  }

  static async completeBreeding(contractId: string): Promise<{
    offspring: any;
    genetics: SwarmGenetics;
    mutations: MutationResult[];
  }> {
    const { data: contract } = await supabase
      .from('breeding_contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (!contract) throw new Error('Contract not found');

    const genetics1 = await this.getSwarmGenetics(contract.parent1_swarm_id);
    const genetics2 = await this.getSwarmGenetics(contract.parent2_swarm_id);

    if (!genetics1 || !genetics2) throw new Error('Parent genetics not found');

    const geneticData1: GeneticData = {
      dominant_traits: genetics1.dominant_traits,
      recessive_traits: genetics1.recessive_traits,
      trait_scores: genetics1.trait_scores,
      mutation_rate: genetics1.mutation_rate,
      generation: genetics1.generation
    };

    const geneticData2: GeneticData = {
      dominant_traits: genetics2.dominant_traits,
      recessive_traits: genetics2.recessive_traits,
      trait_scores: genetics2.trait_scores,
      mutation_rate: genetics2.mutation_rate,
      generation: genetics2.generation
    };

    const breedingResult = GeneticAlgorithm.breed(geneticData1, geneticData2);

    const offspringSwarm = {
      user_id: contract.offspring_owner_id,
      name: `Gen${breedingResult.genetics.generation} Hybrid`,
      agent_ids: [],
      strategy_type: 'hybrid',
      active: false,
      reputation_score: 0
    };

    const { data: newSwarm, error: swarmError } = await supabase
      .from('agent_swarms')
      .insert([offspringSwarm])
      .select()
      .single();

    if (swarmError) throw swarmError;

    const fitness = GeneticAlgorithm.calculateGeneticFitness(
      breedingResult.genetics.trait_scores,
      0,
      0
    );

    const synergies = GeneticAlgorithm.detectSynergies(breedingResult.genetics.trait_scores);

    const offspringGenetics: Omit<SwarmGenetics, 'id'> = {
      swarm_id: newSwarm.id,
      user_id: contract.offspring_owner_id,
      genetic_sequence: breedingResult.genetics,
      dominant_traits: breedingResult.genetics.dominant_traits,
      recessive_traits: breedingResult.genetics.recessive_traits,
      trait_scores: breedingResult.genetics.trait_scores,
      genetic_fitness: fitness,
      mutation_rate: breedingResult.genetics.mutation_rate,
      generation: breedingResult.genetics.generation,
      parent_ids: [contract.parent1_swarm_id, contract.parent2_swarm_id],
      legendary_traits: breedingResult.legendary_traits,
      trait_synergies: synergies,
      breeding_count: 0,
      max_breeding: 5
    };

    const { data: geneticsData, error: geneticsError } = await supabase
      .from('swarm_genetics')
      .insert([offspringGenetics])
      .select()
      .single();

    if (geneticsError) throw geneticsError;

    await supabase.from('swarm_lineage').insert([{
      swarm_id: newSwarm.id,
      generation: breedingResult.genetics.generation,
      parent1_id: contract.parent1_swarm_id,
      parent2_id: contract.parent2_swarm_id,
      ancestor_ids: [...genetics1.parent_ids, ...genetics2.parent_ids, contract.parent1_swarm_id, contract.parent2_swarm_id],
      bloodline_tier: breedingResult.legendary_traits.length > 0 ? 'legendary' : 'common',
      inbreeding_coefficient: 0
    }]);

    for (const mutation of breedingResult.mutations) {
      await supabase.from('trait_mutations').insert([{
        swarm_id: newSwarm.id,
        genetics_id: geneticsData.id,
        mutation_type: mutation.mutation_type,
        trait_affected: mutation.trait_affected,
        mutation_name: mutation.mutation_name,
        mutation_description: mutation.mutation_description,
        rarity_tier: mutation.rarity_tier,
        effect_value: mutation.effect_value,
        trigger_source: 'natural',
        is_hereditary: mutation.is_hereditary
      }]);
    }

    await supabase
      .from('swarm_genetics')
      .update({
        breeding_count: genetics1.breeding_count + 1,
        last_bred_at: new Date().toISOString()
      })
      .eq('swarm_id', contract.parent1_swarm_id);

    await supabase
      .from('swarm_genetics')
      .update({
        breeding_count: genetics2.breeding_count + 1,
        last_bred_at: new Date().toISOString()
      })
      .eq('swarm_id', contract.parent2_swarm_id);

    await supabase
      .from('breeding_contracts')
      .update({
        status: 'completed',
        offspring_swarm_id: newSwarm.id,
        completed_at: new Date().toISOString()
      })
      .eq('id', contractId);

    if (breedingResult.legendary_traits.length > 0) {
      await supabase.from('breeding_achievements').insert([{
        user_id: contract.offspring_owner_id,
        swarm_id: newSwarm.id,
        achievement_type: 'legendary_offspring',
        achievement_name: 'Legendary Birth',
        achievement_description: 'Bred a swarm with legendary traits',
        rarity: 'legendary',
        rewards: { bonus_reputation: 500 }
      }]);
    }

    return {
      offspring: newSwarm,
      genetics: geneticsData,
      mutations: breedingResult.mutations
    };
  }

  static async listOnMarketplace(
    swarmId: string,
    ownerId: string,
    listingType: MarketplaceListing['listing_type'],
    breedingFee: number,
    profitShareOffered: number,
    requirements: any
  ): Promise<MarketplaceListing> {
    const genetics = await this.getSwarmGenetics(swarmId);
    if (!genetics) throw new Error('Swarm genetics not initialized');

    const { data: swarm } = await supabase
      .from('agent_swarms')
      .select('*')
      .eq('id', swarmId)
      .single();

    const performanceProof = await aiEngine.generateZKProof(
      JSON.stringify({
        swarmId,
        fitness: genetics.genetic_fitness,
        winRate: swarm?.win_rate || 0,
        totalProfit: swarm?.total_profit || 0
      })
    );

    const listing: Omit<MarketplaceListing, 'id'> = {
      swarm_id: swarmId,
      owner_id: ownerId,
      listing_type: listingType,
      breeding_fee: breedingFee,
      profit_share_offered: profitShareOffered,
      requirements,
      performance_proof: performanceProof,
      available_breedings: genetics.max_breeding - genetics.breeding_count,
      status: 'active',
      views: 0,
      proposals_received: 0
    };

    const { data, error } = await supabase
      .from('breeding_marketplace')
      .insert([listing])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getMarketplaceListings(filters?: {
    listing_type?: string;
    min_fitness?: number;
    max_fee?: number;
  }): Promise<MarketplaceListing[]> {
    let query = supabase
      .from('breeding_marketplace')
      .select('*, swarm_genetics!inner(*)')
      .eq('status', 'active');

    if (filters?.listing_type) {
      query = query.eq('listing_type', filters.listing_type);
    }

    if (filters?.min_fitness) {
      query = query.gte('swarm_genetics.genetic_fitness', filters.min_fitness);
    }

    if (filters?.max_fee) {
      query = query.lte('breeding_fee', filters.max_fee);
    }

    const { data, error } = await query.order('listed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserBreedingContracts(userId: string): Promise<BreedingContract[]> {
    const { data, error } = await supabase
      .from('breeding_contracts')
      .select('*')
      .or(`parent1_owner_id.eq.${userId},parent2_owner_id.eq.${userId},offspring_owner_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getSwarmLineage(swarmId: string): Promise<any> {
    const { data, error } = await supabase
      .from('swarm_lineage')
      .select('*')
      .eq('swarm_id', swarmId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getSwarmMutations(swarmId: string): Promise<MutationResult[]> {
    const { data, error } = await supabase
      .from('trait_mutations')
      .select('*')
      .eq('swarm_id', swarmId)
      .order('occurred_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getBreedingAchievements(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('breeding_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getIncubationStatus(contractId: string): Promise<any> {
    const { data, error } = await supabase
      .from('incubation_queue')
      .select('*')
      .eq('breeding_contract_id', contractId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
