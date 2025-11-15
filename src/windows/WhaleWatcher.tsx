import React, { useState, useEffect } from 'react';
import { Activity, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { whaleWatcherService, WhaleWatch, WhaleTransaction } from '../lib/whaleWatcherService';
import { soundManager } from '../lib/sounds';

export const WhaleWatcher: React.FC = () => {
  const { walletConnected, connectWallet } = useAppContext();
  const [watches, setWatches] = useState<WhaleWatch[]>([]);
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (walletConnected) {
      loadWatches();
      loadTransactions();
    }
  }, [walletConnected]);

  const loadWatches = async () => {
    const data = await whaleWatcherService.getWhaleWatches();
    setWatches(data);
  };

  const loadTransactions = async () => {
    const data = await whaleWatcherService.getWhaleTransactions(undefined, 20);
    setTransactions(data);
  };

  const handleAdd = async () => {
    if (!newAddress) return;
    soundManager.playClick();

    const result = await whaleWatcherService.addWhaleWatch(newAddress, newNickname);
    if (result.success) {
      soundManager.playSuccess();
      setNewAddress('');
      setNewNickname('');
      await loadWatches();
    } else {
      soundManager.playError();
      alert(result.error);
    }
  };

  const handleRemove = async (id: string) => {
    soundManager.playClick();
    const result = await whaleWatcherService.removeWhaleWatch(id);
    if (result.success) {
      soundManager.playSuccess();
      await loadWatches();
    }
  };

  const handleCheckActivity = async (watch: WhaleWatch) => {
    setChecking(true);
    soundManager.playClick();

    try {
      const activity = await whaleWatcherService.checkWhaleActivity(watch.whale_address);

      for (const tx of activity) {
        await whaleWatcherService.saveWhaleTransaction(
          watch.whale_address,
          tx.signature,
          tx.amount,
          tx.timestamp
        );
      }

      await whaleWatcherService.updateLastChecked(watch.id);
      await loadTransactions();
      await loadWatches();

      soundManager.playSuccess();
      alert(`Found ${activity.length} recent transactions`);
    } catch (error) {
      soundManager.playError();
    } finally {
      setChecking(false);
    }
  };

  if (!walletConnected) {
    return (
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">Whale Watcher</h2>
        </div>
        <div className="text-center p-8 win98-inset">
          <button className="win98-button" onClick={connectWallet}>Connect Wallet</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Whale Watcher</h2>
      </div>

      <div className="win98-inset p-4 mb-4">
        <h3 className="font-bold mb-2">Add Whale to Watch</h3>
        <input className="win98-inset w-full p-1 mb-2" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Wallet Address" />
        <input className="win98-inset w-full p-1 mb-2" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="Nickname (optional)" />
        <button className="win98-button w-full" onClick={handleAdd}><Plus size={14} /> Add Whale</button>
      </div>

      <div className="win98-inset p-4 mb-4">
        <h3 className="font-bold mb-2">Watched Whales</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {watches.map((watch) => (
            <div key={watch.id} className="bg-gray-100 p-2 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold">{watch.nickname || 'Whale'}</span>
                <div className="flex gap-1">
                  <button className="win98-button text-xs" onClick={() => handleCheckActivity(watch)} disabled={checking}>
                    <RefreshCw size={10} className={checking ? 'animate-spin' : ''} />
                  </button>
                  <button className="win98-button text-xs" onClick={() => handleRemove(watch.id)}><Trash2 size={10} /></button>
                </div>
              </div>
              <div className="text-xs font-mono text-gray-600 truncate">{watch.whale_address}</div>
              <div className="text-xs text-gray-500">Min: {watch.min_transaction_amount} SOL</div>
            </div>
          ))}
        </div>
      </div>

      <div className="win98-inset p-4">
        <h3 className="font-bold mb-2">Recent Whale Activity</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-gray-100 p-2 text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-bold">{tx.amount.toFixed(2)} {tx.token_symbol || 'SOL'}</span>
                <span className="text-gray-600">{new Date(tx.timestamp).toLocaleString()}</span>
              </div>
              <div className="font-mono text-gray-600 truncate">{tx.signature}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
