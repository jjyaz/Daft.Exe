import React, { useState, useEffect } from 'react';
import { Bell, Plus, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { priceAlertService, PriceAlert } from '../lib/priceAlertService';
import { soundManager } from '../lib/sounds';
import { COMMON_TOKENS } from '../lib/jupiterService';

export const PriceAlerts: React.FC = () => {
  const { walletConnected, connectWallet } = useAppContext();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [tokenAddress, setTokenAddress] = useState(COMMON_TOKENS.SOL);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  useEffect(() => {
    if (walletConnected) {
      loadAlerts();
      const interval = setInterval(checkAlerts, 60000);
      return () => clearInterval(interval);
    }
  }, [walletConnected]);

  const loadAlerts = async () => {
    const data = await priceAlertService.getAllAlerts();
    setAlerts(data);
  };

  const checkAlerts = async () => {
    const triggered = await priceAlertService.checkAlerts();
    if (triggered.length > 0) {
      soundManager.playSuccess();
      alert(`${triggered.length} price alert(s) triggered!`);
      await loadAlerts();
    }
  };

  const handleCreate = async () => {
    if (!targetPrice) return;
    soundManager.playClick();

    const symbol = getTokenSymbol(tokenAddress);
    const result = await priceAlertService.createAlert(
      tokenAddress,
      symbol,
      parseFloat(targetPrice),
      condition
    );

    if (result.success) {
      soundManager.playSuccess();
      setTargetPrice('');
      await loadAlerts();
    } else {
      soundManager.playError();
    }
  };

  const handleDelete = async (id: string) => {
    soundManager.playClick();
    const result = await priceAlertService.deleteAlert(id);
    if (result.success) {
      soundManager.playSuccess();
      await loadAlerts();
    }
  };

  const getTokenSymbol = (address: string): string => {
    const entries = Object.entries(COMMON_TOKENS);
    const found = entries.find(([_, addr]) => addr === address);
    return found ? found[0] : 'UNKNOWN';
  };

  if (!walletConnected) {
    return (
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">Price Alerts</h2>
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
        <Bell size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Price Alerts</h2>
      </div>

      <div className="win98-inset p-4 mb-4">
        <h3 className="font-bold mb-2">Create Alert</h3>
        <div className="space-y-2">
          <select className="win98-inset w-full p-1" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)}>
            {Object.entries(COMMON_TOKENS).map(([symbol, address]) => (
              <option key={address} value={address}>{symbol}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <select className="win98-inset p-1" value={condition} onChange={(e) => setCondition(e.target.value as any)}>
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <input type="number" className="win98-inset p-1 flex-1" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="Price" step="0.01" />
          </div>
          <button className="win98-button w-full" onClick={handleCreate}><Plus size={14} /> Create Alert</button>
        </div>
      </div>

      <div className="win98-inset p-4">
        <h3 className="font-bold mb-2">My Alerts</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-2 text-sm ${alert.triggered ? 'bg-green-100' : 'bg-gray-100'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold">{alert.token_symbol} {alert.condition} ${alert.target_price}</span>
                <button className="win98-button text-xs" onClick={() => handleDelete(alert.id)}><X size={12} /></button>
              </div>
              <div className="text-xs text-gray-600">{alert.triggered ? 'Triggered!' : 'Active'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
