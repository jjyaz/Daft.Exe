import React, { useState, useEffect } from 'react';
import { GitBranch, Radio, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMockUserId } from '../lib/mockAuth';
import { crossChainBridge } from '../lib/bridgeService';
import { soundManager } from '../lib/sounds';
import { useAppContext } from '../context/AppContext';

export const BridgePortal: React.FC = () => {
  const { walletConnected, connectWallet } = useAppContext();
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [targetChain, setTargetChain] = useState('Ethereum');
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{ newAddress: string; txHash: string } | null>(null);
  const [recentMigrations, setRecentMigrations] = useState<any[]>([]);

  const chains = ['Ethereum', 'Polygon', 'Avalanche', 'Arbitrum', 'Optimism', 'BSC'];

  useEffect(() => {
    if (walletConnected) {
      loadAgents();
      loadRecentMigrations();
    }
  }, [walletConnected]);

  const loadAgents = async () => {
    const { data } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', getMockUserId())
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setAgents(data);
      if (!selectedAgent) {
        setSelectedAgent(data[0].id);
      }
    }
  };

  const loadRecentMigrations = async () => {
    const { data } = await supabase
      .from('bridge_operations')
      .select('*, agent:ai_agents(name, type)')
      .eq('user_id', getMockUserId())
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentMigrations(data);
    }
  };

  const handleMigrate = async () => {
    if (!selectedAgent) {
      soundManager.playError();
      alert('Please select an agent to migrate');
      return;
    }

    setMigrating(true);
    setResult(null);
    soundManager.playClick();

    try {
      const migrationResult = await crossChainBridge.migrateAgent(
        selectedAgent,
        'Solana',
        targetChain
      );

      setResult({
        newAddress: migrationResult.newAddress,
        txHash: migrationResult.txHash
      });
      soundManager.playSuccess();

      await loadRecentMigrations();
    } catch (error: any) {
      console.error('Migration error:', error);
      soundManager.playError();
      alert(error.message || 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  if (!walletConnected) {
    return (
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">Agent Bridge Portal</h2>
        </div>

        <div className="text-center p-8 win98-inset">
          <p className="mb-4">Connect your wallet to migrate agents across chains</p>
          <button className="win98-button" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Agent Bridge Portal</h2>
      </div>

      <div className="win98-inset p-4 mb-4">
        <h3 className="font-bold mb-2">Cross-Chain Agent Migration</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-bold">Select Agent:</label>
            {agents.length > 0 ? (
              <select
                className="win98-inset w-full p-1"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.type})
                  </option>
                ))}
              </select>
            ) : (
              <div className="win98-inset p-2 bg-yellow-50 flex items-center gap-2">
                <AlertCircle size={16} color="orange" />
                <span className="text-sm">No active agents found. Deploy an agent in Agent Hub first.</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold">Source Chain:</label>
            <input
              type="text"
              className="win98-inset w-full p-1 bg-gray-100"
              value="Solana"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-bold">Target Chain:</label>
            <select
              className="win98-inset w-full p-1"
              value={targetChain}
              onChange={(e) => setTargetChain(e.target.value)}
            >
              {chains.map(chain => (
                <option key={chain} value={chain}>{chain}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 p-2 bg-blue-50 border border-blue-300 text-xs">
          <strong>Migration Process:</strong>
          <ol className="ml-4 mt-1 space-y-1">
            <li>1. Agent state is serialized and encrypted</li>
            <li>2. ZK proof generated for verification</li>
            <li>3. Cross-chain message sent via LayerZero</li>
            <li>4. Agent redeployed on target chain</li>
            <li>5. Original agent marked as migrated</li>
          </ol>
        </div>
      </div>

      <button
        className="win98-button mb-4 w-full"
        onClick={handleMigrate}
        disabled={migrating || !selectedAgent || agents.length === 0}
      >
        {migrating ? 'Migrating Agent...' : 'Migrate Agent'}
      </button>

      {migrating && (
        <div className="progress-bar mb-4">
          <div className="progress-bar-fill animate-pulse" style={{ width: '70%' }} />
        </div>
      )}

      {result && (
        <div className="mb-4 p-2 bg-green-100 border border-green-400">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} color="green" />
            <span className="font-bold text-green-700">Migration Complete!</span>
          </div>
          <p className="text-xs"><strong>New Address on {targetChain}:</strong></p>
          <p className="text-xs font-mono break-all mb-2">{result.newAddress}</p>
          <p className="text-xs"><strong>Transaction Hash:</strong></p>
          <p className="text-xs font-mono break-all">{result.txHash}</p>
        </div>
      )}

      {recentMigrations.length > 0 && (
        <div className="win98-inset p-4 mb-4">
          <h3 className="font-bold mb-2">Recent Migrations</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentMigrations.map((migration) => (
              <div key={migration.id} className="text-xs bg-gray-100 p-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{migration.agent?.name || 'Unknown Agent'}</span>
                  <span className={`text-xs ${
                    migration.status === 'completed' ? 'text-green-600' :
                    migration.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {migration.status}
                  </span>
                </div>
                <div className="text-gray-600">
                  {migration.from_chain} → {migration.to_chain}
                </div>
                <div className="text-gray-500 text-xs">
                  {new Date(migration.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="win98-inset p-4">
        <div className="flex items-center gap-2 mb-2">
          <Radio size={16} color="var(--solana-purple)" />
          <h3 className="font-bold">Security Features</h3>
        </div>
        <div className="space-y-1 text-sm">
          <div>✓ ZK Light Clients</div>
          <div>✓ Ed25519 Signatures</div>
          <div>✓ LayerZero Protocol</div>
          <div>✓ Atomic Swaps</div>
          <div>✓ State Verification</div>
          <div>✓ Encrypted State Transfer</div>
        </div>
      </div>

      <div className="win98-inset p-4 mt-4 bg-yellow-50">
        <h3 className="font-bold mb-2 text-sm">Supported Chains for Migration</h3>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {chains.map(chain => (
            <div key={chain}>• {chain}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
