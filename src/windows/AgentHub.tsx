import React, { useState, useEffect } from 'react';
import { Bot, Activity, TrendingUp, Play, Pause, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMockUserId } from '../lib/mockAuth';
import { aiEngine } from '../lib/ai';
import { soundManager } from '../lib/sounds';
import TrainingCenter from './TrainingCenter';

export const AgentHub: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [deploying, setDeploying] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [showDeployForm, setShowDeployForm] = useState(false);
  const [showTrainingCenter, setShowTrainingCenter] = useState(false);

  useEffect(() => {
    loadAgents();
    const interval = setInterval(() => {
      updateAgentPerformance();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAgents = async () => {
    const { data } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', getMockUserId())
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setAgents(data);
    } else {
      setAgents([
        { id: '1', name: 'Yield Optimizer', type: 'yield', status: 'active', performance: '+12.3%' },
        { id: '2', name: 'Arbitrage Bot', type: 'arbitrage', status: 'active', performance: '+8.7%' },
        { id: '3', name: 'Risk Manager', type: 'risk', status: 'standby', performance: '--' },
      ]);
    }
  };

  const updateAgentPerformance = async () => {
    await aiEngine.analyzeMarketData();
    setAgents(prev => prev.map(agent => {
      if (agent.status === 'active') {
        const change = (Math.random() * 2 - 0.5).toFixed(1);
        const sign = parseFloat(change) >= 0 ? '+' : '';
        return { ...agent, performance: `${sign}${change}%` };
      }
      return agent;
    }));
  };

  const handleDeploy = async () => {
    if (!agentName) return;

    setDeploying(true);
    soundManager.playClick();

    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data } = await supabase.from('ai_agents').insert([{
      user_id: getMockUserId(),
      name: agentName,
      type: 'trading',
      status: 'active',
      performance: '0%',
      config: {}
    }]).select().single();

    if (data) {
      setAgents([data, ...agents]);
      setAgentName('');
      setShowDeployForm(false);
      soundManager.playSuccess();
    }

    setDeploying(false);
  };

  const toggleAgent = async (agentId: string, currentStatus: string) => {
    soundManager.playClick();
    const newStatus = currentStatus === 'active' ? 'standby' : 'active';

    await supabase
      .from('ai_agents')
      .update({ status: newStatus, last_active: new Date().toISOString() })
      .eq('id', agentId)
      .eq('user_id', getMockUserId());

    setAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, status: newStatus } : a
    ));
  };

  if (showTrainingCenter) {
    return <TrainingCenter userId={getMockUserId()} />;
  }

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Bot size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">AI Agent Marketplace</h2>
      </div>

      <div className="mb-4">
        <button
          className="win98-button mr-2"
          onClick={() => {
            soundManager.playClick();
            setShowTrainingCenter(true);
          }}
        >
          <GraduationCap size={14} className="inline mr-1" />
          Training Center
        </button>
        <button
          className="win98-button mr-2"
          onClick={() => setShowDeployForm(!showDeployForm)}
        >
          Deploy New Agent
        </button>
        <button className="win98-button" onClick={loadAgents}>Refresh</button>
      </div>

      {showDeployForm && (
        <div className="win98-inset p-4 mb-4">
          <h3 className="font-bold mb-2">Deploy New Agent</h3>
          <input
            type="text"
            className="win98-inset w-full p-2 mb-2"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Agent Name"
          />
          <button
            className="win98-button"
            onClick={handleDeploy}
            disabled={deploying || !agentName}
          >
            {deploying ? 'Deploying...' : 'Deploy'}
          </button>
          {deploying && (
            <div className="progress-bar mt-2">
              <div className="progress-bar-fill" style={{ width: '80%' }} />
            </div>
          )}
        </div>
      )}

      <div className="win98-inset p-4">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Activity size={16} />
          Active Agents
        </h3>
        {agents.map((agent) => (
          <div key={agent.id} className="flex justify-between items-center p-2 mb-2 bg-gray-100">
            <div className="flex-1">
              <div className="font-bold">{agent.name}</div>
              <div className="text-xs text-gray-600">{agent.status}</div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp size={14} color={agent.performance.startsWith('+') ? 'green' : 'gray'} />
              <span className="font-mono text-sm w-16">{agent.performance}</span>
              <button
                className="win98-button text-xs"
                onClick={() => toggleAgent(agent.id, agent.status)}
              >
                {agent.status === 'active' ? <Pause size={12} /> : <Play size={12} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="win98-inset p-4 mt-4">
        <h3 className="font-bold mb-2">Agent Capabilities</h3>
        <div className="space-y-1 text-sm">
          <div>• Autonomous Trading</div>
          <div>• Market Analysis</div>
          <div>• Yield Optimization</div>
          <div>• Multi-Agent Coordination</div>
          <div>• Reinforcement Learning</div>
        </div>
      </div>
    </div>
  );
};
