import React, { useState, useEffect } from 'react';
import { Eye, Plus, Star, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { walletWatcherService, WatchedWallet } from '../lib/walletWatcherService';
import { soundManager } from '../lib/sounds';

export const WalletManager: React.FC = () => {
  const { walletConnected, connectWallet } = useAppContext();
  const [wallets, setWallets] = useState<WatchedWallet[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [aggregated, setAggregated] = useState<any>(null);

  useEffect(() => {
    if (walletConnected) {
      loadWallets();
    }
  }, [walletConnected]);

  const loadWallets = async () => {
    const data = await walletWatcherService.getWatchedWallets();
    setWallets(data);
  };

  const loadAggregated = async () => {
    soundManager.playClick();
    const data = await walletWatcherService.getAggregatedPortfolio();
    setAggregated(data);
    soundManager.playSuccess();
  };

  const handleAdd = async () => {
    if (!newAddress) return;
    soundManager.playClick();

    const result = await walletWatcherService.addWallet(newAddress, newNickname);
    if (result.success) {
      soundManager.playSuccess();
      setNewAddress('');
      setNewNickname('');
      await loadWallets();
    } else {
      soundManager.playError();
      alert(result.error);
    }
  };

  const handleRemove = async (id: string) => {
    soundManager.playClick();
    const result = await walletWatcherService.removeWallet(id);
    if (result.success) {
      soundManager.playSuccess();
      await loadWallets();
    }
  };

  const handleSetPrimary = async (id: string) => {
    soundManager.playClick();
    await walletWatcherService.updateWallet(id, { is_primary: true });
    await loadWallets();
  };

  if (!walletConnected) {
    return (
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">Wallet Manager</h2>
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
        <Eye size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Multi-Wallet Manager</h2>
      </div>

      <div className="win98-inset p-4 mb-4">
        <h3 className="font-bold mb-2">Add Wallet</h3>
        <input className="win98-inset w-full p-1 mb-2" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Wallet Address" />
        <input className="win98-inset w-full p-1 mb-2" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="Nickname (optional)" />
        <button className="win98-button w-full" onClick={handleAdd}><Plus size={14} /> Add Wallet</button>
      </div>

      {aggregated && (
        <div className="win98-inset p-4 mb-4 bg-blue-50">
          <h3 className="font-bold mb-2">Total Across All Wallets</h3>
          <div className="text-2xl font-bold">${aggregated.totalValue.toFixed(2)}</div>
        </div>
      )}

      <div className="win98-inset p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">Watched Wallets</h3>
          <button className="win98-button text-xs" onClick={loadAggregated}>View Total</button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="bg-gray-100 p-2 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold flex items-center gap-1">
                  {wallet.is_primary && <Star size={12} className="fill-yellow-400" />}
                  {wallet.nickname || 'Wallet'}
                </span>
                <div className="flex gap-1">
                  {!wallet.is_primary && (
                    <button className="win98-button text-xs" onClick={() => handleSetPrimary(wallet.id)}><Star size={10} /></button>
                  )}
                  <button className="win98-button text-xs" onClick={() => handleRemove(wallet.id)}><Trash2 size={10} /></button>
                </div>
              </div>
              <div className="text-xs font-mono text-gray-600 truncate">{wallet.wallet_address}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
