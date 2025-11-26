import { supabase } from './supabase';

export interface AgentSwarm {
  id: string;
  user_id: string;
  name: string;
  agent_ids: string[];
  total_trades: number;
  win_rate: number;
  total_profit: number;
  reputation_score: number;
  strategy_type: string;
  active: boolean;
  last_active: string | null;
  created_at: string;
  updated_at: string;
}

export interface SwarmActivity {
  id: string;
  swarm_id: string;
  activity_type: 'scan' | 'trade' | 'alert' | 'evolution' | 'battle';
  description: string;
  metadata: any;
  success: boolean;
  created_at: string;
}

export interface SwarmBattle {
  id: string;
  battle_type: '1v1' | 'tournament' | 'free_for_all';
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  start_time: string;
  end_time: string;
  prize_pool: number;
  entry_fee: number;
  winner_swarm_id: string | null;
  config: any;
  created_at: string;
}

export interface AgentEvolution {
  id: string;
  agent_id: string;
  user_id: string;
  level: number;
  experience: number;
  generation: number;
  parent_ids: string[];
  traits: Record<string, any>;
  mutation_count: number;
  performance_history: any[];
  created_at: string;
  updated_at: string;
}

class SwarmService {
  async createSwarm(userId: string, name: string, agentIds: string[], strategyType: string = 'balanced'): Promise<AgentSwarm> {
    const { data, error } = await supabase
      .from('agent_swarms')
      .insert({
        user_id: userId,
        name,
        agent_ids: agentIds,
        strategy_type: strategyType,
        active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserSwarms(userId: string): Promise<AgentSwarm[]> {
    const { data, error } = await supabase
      .from('agent_swarms')
      .select('*')
      .eq('user_id', userId)
      .order('reputation_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getTopSwarms(limit: number = 10): Promise<AgentSwarm[]> {
    const { data, error } = await supabase
      .from('agent_swarms')
      .select('*')
      .order('reputation_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async updateSwarmStats(swarmId: string, stats: Partial<AgentSwarm>): Promise<void> {
    const { error } = await supabase
      .from('agent_swarms')
      .update(stats)
      .eq('id', swarmId);

    if (error) throw error;
  }

  async logActivity(swarmId: string, activityType: SwarmActivity['activity_type'], description: string, metadata: any = {}, success: boolean = true): Promise<void> {
    const { error } = await supabase
      .from('swarm_activities')
      .insert({
        swarm_id: swarmId,
        activity_type: activityType,
        description,
        metadata,
        success
      });

    if (error) throw error;
  }

  async getSwarmActivities(swarmId: string, limit: number = 50): Promise<SwarmActivity[]> {
    const { data, error } = await supabase
      .from('swarm_activities')
      .select('*')
      .eq('swarm_id', swarmId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async simulateSwarmActivity(swarm: AgentSwarm): Promise<SwarmActivity> {
    const activityTypes: SwarmActivity['activity_type'][] = ['scan', 'trade', 'alert'];
    const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

    const activities = {
      scan: [
        { desc: 'Detected high volume on ${token}', token: 'BONK' },
        { desc: 'Found whale accumulation pattern on ${token}', token: 'WIF' },
        { desc: 'Identified liquidity spike in ${token}', token: 'SAMO' },
        { desc: 'Analyzing new token launch: ${token}', token: 'MYRO' }
      ],
      trade: [
        { desc: 'Executed buy order: 100 ${token} @ $0.045', profit: 0.5 },
        { desc: 'Sold ${token} for +${profit}% profit', profit: 12.5 },
        { desc: 'Swing trade completed on ${token}', profit: 8.2 },
        { desc: 'Scalp exit: ${token} +${profit}%', profit: 3.1 }
      ],
      alert: [
        { desc: 'Price alert triggered: ${token} crossed resistance', token: 'SOL' },
        { desc: 'Whale alert: Large ${token} transfer detected', token: 'JUP' },
        { desc: 'Risk warning: High volatility on ${token}', token: 'ORCA' }
      ]
    };

    const pool = activities[randomType];
    const selected = pool[Math.floor(Math.random() * pool.length)];

    let description = selected.desc;
    const metadata: any = { swarm_name: swarm.name };

    if ('token' in selected) {
      description = description.replace('${token}', selected.token);
      metadata.token = selected.token;
    }
    if ('profit' in selected) {
      description = description.replace('${profit}', selected.profit.toString());
      metadata.profit = selected.profit;
    }

    const success = Math.random() > 0.2;

    await this.logActivity(swarm.id, randomType, description, metadata, success);

    return {
      id: crypto.randomUUID(),
      swarm_id: swarm.id,
      activity_type: randomType,
      description,
      metadata,
      success,
      created_at: new Date().toISOString()
    };
  }

  async getAgentEvolution(agentId: string): Promise<AgentEvolution | null> {
    const { data, error } = await supabase
      .from('agent_evolution')
      .select('*')
      .eq('agent_id', agentId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async createAgentEvolution(agentId: string, userId: string): Promise<AgentEvolution> {
    const { data, error } = await supabase
      .from('agent_evolution')
      .insert({
        agent_id: agentId,
        user_id: userId,
        level: 1,
        experience: 0,
        generation: 1,
        traits: {
          speed: Math.floor(Math.random() * 100),
          accuracy: Math.floor(Math.random() * 100),
          risk_tolerance: Math.floor(Math.random() * 100)
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addExperience(agentId: string, xp: number): Promise<AgentEvolution> {
    const evolution = await this.getAgentEvolution(agentId);
    if (!evolution) throw new Error('Agent evolution not found');

    const newXp = evolution.experience + xp;
    const newLevel = Math.min(100, Math.floor(newXp / 1000) + 1);

    const { data, error } = await supabase
      .from('agent_evolution')
      .update({
        experience: newXp,
        level: newLevel
      })
      .eq('agent_id', agentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async breedAgents(parent1Id: string, parent2Id: string, userId: string, newAgentId: string): Promise<AgentEvolution> {
    const [parent1, parent2] = await Promise.all([
      this.getAgentEvolution(parent1Id),
      this.getAgentEvolution(parent2Id)
    ]);

    if (!parent1 || !parent2) throw new Error('Parent agents not found');

    const newGeneration = Math.max(parent1.generation, parent2.generation) + 1;
    const inheritedTraits = {
      speed: Math.floor((parent1.traits.speed + parent2.traits.speed) / 2 + (Math.random() * 20 - 10)),
      accuracy: Math.floor((parent1.traits.accuracy + parent2.traits.accuracy) / 2 + (Math.random() * 20 - 10)),
      risk_tolerance: Math.floor((parent1.traits.risk_tolerance + parent2.traits.risk_tolerance) / 2 + (Math.random() * 20 - 10))
    };

    const { data, error } = await supabase
      .from('agent_evolution')
      .insert({
        agent_id: newAgentId,
        user_id: userId,
        level: 1,
        experience: 0,
        generation: newGeneration,
        parent_ids: [parent1Id, parent2Id],
        traits: inheritedTraits,
        mutation_count: Math.random() > 0.7 ? 1 : 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getActiveBattles(): Promise<SwarmBattle[]> {
    const { data, error } = await supabase
      .from('swarm_battles')
      .select('*')
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createBattle(battleType: SwarmBattle['battle_type'], entryFee: number, config: any = {}): Promise<SwarmBattle> {
    const { data, error } = await supabase
      .from('swarm_battles')
      .insert({
        battle_type: battleType,
        entry_fee: entryFee,
        prize_pool: 0,
        config,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async joinBattle(battleId: string, swarmId: string, userId: string, startingCapital: number): Promise<void> {
    const { error } = await supabase
      .from('battle_participants')
      .insert({
        battle_id: battleId,
        swarm_id: swarmId,
        user_id: userId,
        starting_capital: startingCapital
      });

    if (error) throw error;
  }
}

export const swarmService = new SwarmService();
