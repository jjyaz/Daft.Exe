import React, { useState, useEffect } from 'react';
import { Globe, ArrowRight, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { crossChainBridge, BridgeTransaction } from '../lib/bridgeService';
import { soundManager } from '../lib/sounds';
import { useAppContext } from '../context/AppContext';

export const NetworkNeighborhood: React.FC = () => {
  const { walletConnected, walletAddress, walletBalance, connectWallet } = useAppContext();
  const [fromChain, setFromChain] = useState('Solana');
  const [toChain, setToChain] = useState('Polygon');
  const [amount, setAmount] = useState('');
  const [bridging, setBridging] = useState(false);
  const [transaction, setTransaction] = useState<BridgeTransaction | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<BridgeTransaction[]>([]);
  const [estimatedFee, setEstimatedFee] = useState('0');
  const [estimatedTime, setEstimatedTime] = useState(0);

  const chains = crossChainBridge.getSupportedChains();

  useEffect(() => {
    if (walletConnected) {
      loadRecentTransactions();
    }
  }, [walletConnected]);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      const fee = crossChainBridge.calculateFee(fromChain, toChain, parseFloat(amount));
      setEstimatedFee(fee.toFixed(6));
      const time = crossChainBridge.estimateBridgeTime(fromChain, toChain);
      setEstimatedTime(time);
    } else {
      setEstimatedFee('0');
      setEstimatedTime(0);
    }
  }, [amount, fromChain, toChain]);

  const loadRecentTransactions = async () => {
    const txs = await crossChainBridge.getUserTransactions();
    setRecentTransactions(txs);
  };

  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    if (!walletConnected) {
      soundManager.playError();
      alert('Please connect your wallet first');
      return;
    }

    if (parseFloat(amount) > walletBalance) {
      soundManager.playError();
      alert('Insufficient balance');
      return;
    }

    setBridging(true);
    setTransaction(null);
    soundManager.playClick();

    try {
      const result = await crossChainBridge.bridgeAssets(fromChain, toChain, amount, 'SOL');
      setTransaction(result);
      soundManager.playSuccess();
      await loadRecentTransactions();
      setAmount('');
    } catch (error: any) {
      console.error('Bridge error:', error);
      soundManager.playError();
      alert(error.message || 'Bridge failed');
    } finally {
      setBridging(false);
    }
  };

  if (!walletConnected) {
    return (
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">Cross-Chain Bridge</h2>
        </div>

        <div className="text-center p-8 win98-inset">
          <p className="mb-4">Connect your wallet to start bridging assets</p>
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
        <Globe size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Cross-Chain Bridge</h2>
      </div>

      <div className="win98-inset p-2 mb-4 text-xs">
        <div className="font-bold">Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</div>
        <div>Balance: {walletBalance.toFixed(4)} SOL</div>
      </div>

      <div className="grid grid-cols-3 gap-2 items-center mb-4">
        <div className="win98-inset p-3 text-center">
          <select
            className="win98-inset w-full p-1 text-center"
            value={fromChain}
            onChange={(e) => setFromChain(e.target.value)}
          >
            {chains.map(chain => (
              <option key={chain} value={chain}>{chain}</option>
            ))}
          </select>
          <div className="text-xs text-gray-600 mt-1">Source</div>
        </div>
        <ArrowRight className="mx-auto" size={20} />
        <div className="win98-inset p-3 text-center">
          <select
            className="win98-inset w-full p-1 text-center"
            value={toChain}
            onChange={(e) => setToChain(e.target.value)}
          >
            {chains.map(chain => (
              <option key={chain} value={chain}>{chain}</option>
            ))}
          </select>
          <div className="text-xs text-gray-600 mt-1">Destination</div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-bold">Amount:</label>
        <input
          type="number"
          className="win98-inset w-full p-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
        />
      </div>

      {estimatedFee !== '0' && (
        <div className="win98-inset p-2 mb-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <DollarSign size={14} />
              <span>Estimated Fee:</span>
            </span>
            <span className="font-mono">{estimatedFee} SOL</span>
          </div>
          <div className="flex justify-between">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              <span>Estimated Time:</span>
            </span>
            <span className="font-mono">{estimatedTime}s</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>You'll Receive:</span>
            <span className="font-mono">{(parseFloat(amount) - parseFloat(estimatedFee)).toFixed(6)} SOL</span>
          </div>
        </div>
      )}

      <button
        className="win98-button w-full"
        onClick={handleBridge}
        disabled={bridging || !amount || parseFloat(amount) <= 0 || fromChain === toChain}
      >
        {bridging ? 'Bridging Assets...' : 'Bridge Assets'}
      </button>

      {bridging && (
        <div className="progress-bar mt-4">
          <div className="progress-bar-fill animate-pulse" style={{ width: '60%' }} />
        </div>
      )}

      {transaction && transaction.status === 'completed' && (
        <div className="mt-4 p-2 bg-green-100 border border-green-400">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} color="green" />
            <span className="font-bold text-green-700">Bridge Complete!</span>
          </div>
          <p className="text-xs"><strong>Source TX:</strong></p>
          <p className="text-xs font-mono break-all mb-1">{transaction.txHash}</p>
          {transaction.destinationTxHash && (
            <>
              <p className="text-xs"><strong>Destination TX:</strong></p>
              <p className="text-xs font-mono break-all">{transaction.destinationTxHash}</p>
            </>
          )}
        </div>
      )}

      {recentTransactions.length > 0 && (
        <div className="win98-inset p-4 mt-4">
          <h3 className="font-bold mb-2">Recent Transactions</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentTransactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="text-xs bg-gray-100 p-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{tx.fromChain} → {tx.toChain}</span>
                  <span className={`text-xs ${
                    tx.status === 'completed' ? 'text-green-600' :
                    tx.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {tx.status}
                  </span>
                </div>
                <div className="text-gray-600">{tx.amount} {tx.token}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="win98-inset p-4 mt-4">
        <h3 className="font-bold mb-2">Supported Networks</h3>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {chains.map(chain => (
            <div key={chain}>• {chain}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
