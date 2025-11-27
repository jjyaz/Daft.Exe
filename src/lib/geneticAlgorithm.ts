export interface TraitScores {
  aggression: number;
  patience: number;
  risk_tolerance: number;
  pattern_recognition: number;
  speed: number;
  adaptability: number;
  precision: number;
  endurance: number;
  learning_rate: number;
  intuition: number;
  discipline: number;
  creativity: number;
}

export interface GeneticData {
  dominant_traits: Partial<TraitScores>;
  recessive_traits: Partial<TraitScores>;
  trait_scores: TraitScores;
  mutation_rate: number;
  generation: number;
}

export interface LegendaryTrait {
  id: string;
  name: string;
  description: string;
  effect: string;
  rarity: 'legendary' | 'mythic';
  bonus_value: number;
}

export interface MutationResult {
  mutation_type: 'beneficial' | 'neutral' | 'detrimental' | 'legendary';
  trait_affected: string;
  mutation_name: string;
  mutation_description: string;
  rarity_tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  effect_value: number;
  is_hereditary: boolean;
}

export class GeneticAlgorithm {
  private static readonly TRAIT_KEYS: (keyof TraitScores)[] = [
    'aggression', 'patience', 'risk_tolerance', 'pattern_recognition',
    'speed', 'adaptability', 'precision', 'endurance',
    'learning_rate', 'intuition', 'discipline', 'creativity'
  ];

  private static readonly LEGENDARY_TRAITS: LegendaryTrait[] = [
    {
      id: 'swarm_mind',
      name: 'Swarm Mind',
      description: 'Enhanced coordination with other swarms',
      effect: '+20% performance when coordinating with other swarms',
      rarity: 'legendary',
      bonus_value: 20
    },
    {
      id: 'alpha_instinct',
      name: 'Alpha Instinct',
      description: 'First to detect market opportunities',
      effect: 'Detects opportunities 10 seconds earlier',
      rarity: 'legendary',
      bonus_value: 15
    },
    {
      id: 'phoenix_protocol',
      name: 'Phoenix Protocol',
      description: 'Rapid recovery from losses',
      effect: '50% faster recovery from losing trades',
      rarity: 'legendary',
      bonus_value: 50
    },
    {
      id: 'quantum_leap',
      name: 'Quantum Leap',
      description: 'Advanced pattern prediction',
      effect: 'Can predict 2 steps ahead in market patterns',
      rarity: 'mythic',
      bonus_value: 25
    },
    {
      id: 'diamond_hands',
      name: 'Diamond Hands',
      description: 'Unshakeable confidence',
      effect: 'Reduced panic-selling by 70% in downturns',
      rarity: 'legendary',
      bonus_value: 70
    },
    {
      id: 'whale_whisperer',
      name: 'Whale Whisperer',
      description: 'Superior whale detection',
      effect: 'Detects whale movements 30 seconds earlier',
      rarity: 'legendary',
      bonus_value: 30
    },
    {
      id: 'perfect_balance',
      name: 'Perfect Balance',
      description: 'Optimal risk/reward ratios',
      effect: 'Maintains exact risk/reward targets automatically',
      rarity: 'mythic',
      bonus_value: 35
    },
    {
      id: 'time_traveler',
      name: 'Time Traveler',
      description: 'Enhanced historical analysis',
      effect: 'Historical pattern recognition +40%',
      rarity: 'legendary',
      bonus_value: 40
    }
  ];

  static initializeGenes(baseTraits?: Partial<TraitScores>): GeneticData {
    const defaultValue = 50;
    const trait_scores: TraitScores = {} as TraitScores;

    this.TRAIT_KEYS.forEach(key => {
      trait_scores[key] = baseTraits?.[key] ?? defaultValue + (Math.random() * 20 - 10);
    });

    return {
      dominant_traits: this.randomTraitSubset(trait_scores),
      recessive_traits: this.randomTraitSubset(trait_scores),
      trait_scores,
      mutation_rate: 5,
      generation: 1
    };
  }

  static breed(parent1: GeneticData, parent2: GeneticData): {
    genetics: GeneticData;
    mutations: MutationResult[];
    legendary_traits: LegendaryTrait[];
  } {
    const offspring_traits: TraitScores = {} as TraitScores;
    const mutations: MutationResult[] = [];
    const legendary_traits: LegendaryTrait[] = [];

    const newGeneration = Math.max(parent1.generation, parent2.generation) + 1;
    const baseMutationRate = 5 + (newGeneration * 0.5);
    const generationGap = Math.abs(parent1.generation - parent2.generation);
    const finalMutationRate = baseMutationRate + (generationGap * 3);

    this.TRAIT_KEYS.forEach(traitKey => {
      const parent1Value = parent1.trait_scores[traitKey];
      const parent2Value = parent2.trait_scores[traitKey];

      const parent1Dominant = parent1.dominant_traits[traitKey] !== undefined;
      const parent2Dominant = parent2.dominant_traits[traitKey] !== undefined;

      let inheritedValue: number;

      if (parent1Dominant && !parent2Dominant) {
        inheritedValue = parent1Value * 0.7 + parent2Value * 0.3;
      } else if (parent2Dominant && !parent1Dominant) {
        inheritedValue = parent2Value * 0.7 + parent1Value * 0.3;
      } else {
        inheritedValue = (parent1Value + parent2Value) / 2;
      }

      const variance = (Math.random() - 0.5) * 10;
      inheritedValue = Math.max(0, Math.min(100, inheritedValue + variance));

      if (Math.random() * 100 < finalMutationRate) {
        const mutation = this.generateMutation(traitKey, inheritedValue);
        mutations.push(mutation);
        inheritedValue = Math.max(0, Math.min(100, inheritedValue + mutation.effect_value));

        if (mutation.mutation_type === 'legendary') {
          const legendaryTrait = this.LEGENDARY_TRAITS[
            Math.floor(Math.random() * this.LEGENDARY_TRAITS.length)
          ];
          legendary_traits.push(legendaryTrait);
        }
      }

      offspring_traits[traitKey] = inheritedValue;
    });

    const synergies = this.detectSynergies(offspring_traits);

    const genetics: GeneticData = {
      dominant_traits: this.inheritDominance(parent1, parent2, offspring_traits),
      recessive_traits: this.inheritRecessive(parent1, parent2),
      trait_scores: offspring_traits,
      mutation_rate: finalMutationRate,
      generation: newGeneration
    };

    return {
      genetics,
      mutations,
      legendary_traits
    };
  }

  private static generateMutation(
    traitKey: string,
    currentValue: number
  ): MutationResult {
    const roll = Math.random() * 100;

    if (roll < 5) {
      return {
        mutation_type: 'legendary',
        trait_affected: traitKey,
        mutation_name: `Legendary ${this.formatTraitName(traitKey)}`,
        mutation_description: `Exceptional enhancement to ${traitKey}`,
        rarity_tier: 'legendary',
        effect_value: 25,
        is_hereditary: true
      };
    } else if (roll < 25) {
      return {
        mutation_type: 'detrimental',
        trait_affected: traitKey,
        mutation_name: `Weakened ${this.formatTraitName(traitKey)}`,
        mutation_description: `Reduced ${traitKey} capability`,
        rarity_tier: 'common',
        effect_value: -15,
        is_hereditary: true
      };
    } else if (roll < 60) {
      return {
        mutation_type: 'neutral',
        trait_affected: traitKey,
        mutation_name: `Shifted ${this.formatTraitName(traitKey)}`,
        mutation_description: `Minor adjustment to ${traitKey}`,
        rarity_tier: 'common',
        effect_value: Math.random() * 10 - 5,
        is_hereditary: false
      };
    } else {
      const rarityRoll = Math.random();
      let rarity: MutationResult['rarity_tier'];
      let effectValue: number;

      if (rarityRoll < 0.01) {
        rarity = 'mythic';
        effectValue = 25;
      } else if (rarityRoll < 0.05) {
        rarity = 'legendary';
        effectValue = 20;
      } else if (rarityRoll < 0.15) {
        rarity = 'epic';
        effectValue = 15;
      } else if (rarityRoll < 0.35) {
        rarity = 'rare';
        effectValue = 12;
      } else if (rarityRoll < 0.60) {
        rarity = 'uncommon';
        effectValue = 10;
      } else {
        rarity = 'common';
        effectValue = 8;
      }

      return {
        mutation_type: 'beneficial',
        trait_affected: traitKey,
        mutation_name: `Enhanced ${this.formatTraitName(traitKey)}`,
        mutation_description: `Improved ${traitKey} through mutation`,
        rarity_tier: rarity,
        effect_value: effectValue,
        is_hereditary: true
      };
    }
  }

  static calculateGeneticFitness(traits: TraitScores, winRate: number, totalProfit: number): number {
    const traitAverage = this.TRAIT_KEYS.reduce((sum, key) => sum + traits[key], 0) / this.TRAIT_KEYS.length;

    const traitVariance = this.TRAIT_KEYS.reduce((sum, key) => {
      return sum + Math.pow(traits[key] - traitAverage, 2);
    }, 0) / this.TRAIT_KEYS.length;

    const diversityScore = Math.sqrt(traitVariance) / 30;

    const performanceScore = (winRate / 100) * 40 + Math.min(totalProfit / 100, 20);

    const traitScore = (traitAverage / 100) * 30;

    const fitnessScore = performanceScore + traitScore + diversityScore;

    return Math.max(0, Math.min(100, fitnessScore));
  }

  static calculateCompatibility(genetics1: GeneticData, genetics2: GeneticData): number {
    let compatibility = 50;

    const generationDiff = Math.abs(genetics1.generation - genetics2.generation);
    if (generationDiff <= 1) {
      compatibility += 20;
    } else if (generationDiff <= 3) {
      compatibility += 10;
    } else if (generationDiff > 5) {
      compatibility -= 10;
    }

    let traitDiversity = 0;
    this.TRAIT_KEYS.forEach(key => {
      const diff = Math.abs(genetics1.trait_scores[key] - genetics2.trait_scores[key]);
      traitDiversity += diff;
    });
    const avgDiversity = traitDiversity / this.TRAIT_KEYS.length;

    if (avgDiversity > 15 && avgDiversity < 40) {
      compatibility += 15;
    } else if (avgDiversity >= 40) {
      compatibility += 5;
    }

    const avgFitness = (
      this.TRAIT_KEYS.reduce((sum, key) => sum + genetics1.trait_scores[key], 0) +
      this.TRAIT_KEYS.reduce((sum, key) => sum + genetics2.trait_scores[key], 0)
    ) / (this.TRAIT_KEYS.length * 2);

    if (avgFitness > 60) {
      compatibility += 15;
    } else if (avgFitness < 40) {
      compatibility -= 10;
    }

    return Math.max(0, Math.min(100, compatibility));
  }

  static detectSynergies(traits: TraitScores): Array<{name: string; description: string; bonus: number}> {
    const synergies = [];

    if (traits.risk_tolerance > 70 && traits.pattern_recognition > 70) {
      synergies.push({
        name: 'Bold Predictor',
        description: 'High risk tolerance combined with strong pattern recognition',
        bonus: 15
      });
    }

    if (traits.speed > 75 && traits.adaptability > 75) {
      synergies.push({
        name: 'Flash Trader',
        description: 'Extreme speed with high adaptability',
        bonus: 20
      });
    }

    if (traits.patience > 70 && traits.aggression > 70) {
      synergies.push({
        name: 'Strategic Hunter',
        description: 'Patient waiting combined with aggressive execution',
        bonus: 18
      });
    }

    if (traits.precision > 80 && traits.discipline > 80) {
      synergies.push({
        name: 'Perfect Execution',
        description: 'Maximum precision with unwavering discipline',
        bonus: 25
      });
    }

    if (traits.intuition > 75 && traits.creativity > 75) {
      synergies.push({
        name: 'Visionary',
        description: 'Strong intuition paired with creative problem-solving',
        bonus: 20
      });
    }

    if (traits.learning_rate > 70 && traits.endurance > 70) {
      synergies.push({
        name: 'Eternal Student',
        description: 'Fast learning with tireless endurance',
        bonus: 15
      });
    }

    return synergies;
  }

  static predictOffspringFitness(parent1Fitness: number, parent2Fitness: number, compatibility: number): number {
    const avgParentFitness = (parent1Fitness + parent2Fitness) / 2;

    const compatibilityBonus = (compatibility / 100) * 10;

    const variance = (Math.random() - 0.5) * 15;

    const hybridVigor = compatibility > 75 ? 5 : 0;

    const predicted = avgParentFitness + compatibilityBonus + variance + hybridVigor;

    return Math.max(0, Math.min(100, predicted));
  }

  private static randomTraitSubset(traits: TraitScores): Partial<TraitScores> {
    const subset: Partial<TraitScores> = {};
    const numDominant = Math.floor(Math.random() * 4) + 4;
    const keys = [...this.TRAIT_KEYS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numDominant; i++) {
      const key = keys[i];
      subset[key] = traits[key];
    }

    return subset;
  }

  private static inheritDominance(
    parent1: GeneticData,
    parent2: GeneticData,
    offspringTraits: TraitScores
  ): Partial<TraitScores> {
    const dominant: Partial<TraitScores> = {};

    this.TRAIT_KEYS.forEach(key => {
      const p1Dominant = parent1.dominant_traits[key] !== undefined;
      const p2Dominant = parent2.dominant_traits[key] !== undefined;

      if (p1Dominant && p2Dominant) {
        if (Math.random() > 0.5) {
          dominant[key] = offspringTraits[key];
        }
      } else if (p1Dominant || p2Dominant) {
        if (Math.random() > 0.25) {
          dominant[key] = offspringTraits[key];
        }
      } else {
        if (Math.random() > 0.7) {
          dominant[key] = offspringTraits[key];
        }
      }
    });

    return dominant;
  }

  private static inheritRecessive(parent1: GeneticData, parent2: GeneticData): Partial<TraitScores> {
    const recessive: Partial<TraitScores> = {};

    const allRecessive = {
      ...parent1.recessive_traits,
      ...parent2.recessive_traits
    };

    const keys = Object.keys(allRecessive) as (keyof TraitScores)[];
    const numToInherit = Math.floor(Math.random() * 4) + 2;

    for (let i = 0; i < numToInherit && i < keys.length; i++) {
      const key = keys[i];
      recessive[key] = allRecessive[key];
    }

    return recessive;
  }

  private static formatTraitName(traitKey: string): string {
    return traitKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static getRandomLegendaryTrait(): LegendaryTrait {
    return this.LEGENDARY_TRAITS[Math.floor(Math.random() * this.LEGENDARY_TRAITS.length)];
  }

  static getAllLegendaryTraits(): LegendaryTrait[] {
    return [...this.LEGENDARY_TRAITS];
  }
}
