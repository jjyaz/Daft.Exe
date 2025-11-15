import React, { useState, useEffect } from 'react';
import { PieChart, RefreshCw, DollarSign } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { portfolioService, PortfolioData } from '../lib/portfolioService';
import { soundManager } from '../lib/sounds';

export const Portfolio: React.FC = () => {
  const { walletConnected, walletAddress, connectWallet } = useAppContext();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletConnected && walletAddress) {
      loadPortfolio();
    }
  }, [walletConnected, walletAddress]);

  const loadPortfolio = async () => {
    if (!walletAddress) return;

    setLoading(true);
    soundManager.playClick();

    try {
      const data = await portfolioService.getPortfolio(walletAddress);
      setPortfolio(data);
      soundManager.playSuccess();
    } catch (error) {
      console.error('Error loading portfolio:', error);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  if (!walletConnected) {
    return (
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">Portfolio Tracker</h2>
        </div>
        <div className="text-center p-8 win98-inset">
          <p className="mb-4">Connect wallet to view portfolio</p>
          <button className="win98-button" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">Portfolio Tracker</h2>
        </div>
        <button className="win98-button text-xs" onClick={loadPortfolio} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {portfolio && (
        <>
          <div className="win98-inset p-4 mb-4 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-sm text-gray-600 mb-1">Total Portfolio Value</div>
            <div className="flex items-center gap-2">
              <DollarSign size={28} color="var(--solana-purple)" />
              <div className="text-3xl font-bold">${portfolio.totalValue.toFixed(2)}</div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Last updated: {portfolio.lastUpdated.toLocaleTimeString()}
            </div>
          </div>

          <div className="win98-inset p-4 mb-4">
            <h3 className="font-bold mb-2">SOL Holdings</h3>
            <div className="flex justify-between text-sm">
              <span>{portfolio.solBalance.toFixed(4)} SOL</span>
              <span className="font-bold">${portfolio.solValue.toFixed(2)}</span>
            </div>
          </div>

          {portfolio.tokens.length > 0 && (
            <div className="win98-inset p-4">
              <h3 className="font-bold mb-2">Token Holdings</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {portfolio.tokens.map((token) => (
                  <div key={token.mint} className="bg-gray-100 p-2 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">{token.symbol}</span>
                      <span className="font-bold">${token.value?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{token.uiAmount.toFixed(4)} tokens</span>
                      <span>${token.price?.toFixed(6) || '0.00'} each</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-mono truncate">
                      {token.mint}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {portfolio.tokens.length === 0 && (
            <div className="win98-inset p-4 text-center text-sm text-gray-600">
              No token holdings found
            </div>
          )}
        </>
      )}
    </div>
  );
};
