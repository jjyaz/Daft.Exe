import React, { useState, useEffect } from 'react';
import { ArrowDownUp, RefreshCw, TrendingDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { jupiterService, COMMON_TOKENS, QuoteResponse } from '../lib/jupiterService';
import { soundManager } from '../lib/sounds';

export const TokenSwap: React.FC = () => {
  const { walletConnected, connectWallet } = useAppContext();
  const [fromToken, setFromToken] = useState(COMMON_TOKENS.SOL);
  const [toToken, setToToken] = useState(COMMON_TOKENS.USDC);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [swapHistory, setSwapHistory] = useState<any[]>([]);

  useEffect(() => {
    if (walletConnected) {
      loadSwapHistory();
    }
  }, [walletConnected]);

  const loadSwapHistory = async () => {
    const history = await jupiterService.getUserSwapHistory(5);
    setSwapHistory(history);
  };

  const handleGetQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    soundManager.playClick();

    try {
      const amount = parseFloat(fromAmount);
      const quoteData = await jupiterService.getQuote(
        fromToken,
        toToken,
        amount,
        Math.floor(slippage * 100)
      );

      setQuote(quoteData);
      const outputAmount = parseFloat(quoteData.outAmount) / 1e9;
      setToAmount(outputAmount.toFixed(6));
      soundManager.playSuccess();
    } catch (err: any) {
      setError(err.message);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote) return;

    setSwapping(true);
    setError('');
    soundManager.playClick();

    try {
      const fromSymbol = getTokenSymbol(fromToken);
      const toSymbol = getTokenSymbol(toToken);

      const result = await jupiterService.executeSwap(quote, fromSymbol, toSymbol);

      soundManager.playSuccess();
      alert(`Swap successful!\nTransaction: ${result.signature}\nReceived: ${result.outputAmount.toFixed(6)} ${toSymbol}`);

      setFromAmount('');
      setToAmount('');
      setQuote(null);
      await loadSwapHistory();
    } catch (err: any) {
      setError(err.message);
      soundManager.playError();
    } finally {
      setSwapping(false);
    }
  };

  const handleFlipTokens = () => {
    soundManager.playClick();
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount('');
    setQuote(null);
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
          <ArrowDownUp size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">Token Swap</h2>
        </div>

        <div className="text-center p-8 win98-inset">
          <p className="mb-4">Connect your wallet to swap tokens</p>
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
        <ArrowDownUp size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Token Swap</h2>
      </div>

      <div className="win98-inset p-3 mb-4 bg-green-50 border border-green-600 text-xs">
        <strong>Powered by Jupiter:</strong> Real token swaps on Solana with best prices.
      </div>

      {error && (
        <div className="win98-inset p-3 mb-4 bg-red-50 border border-red-600 text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="win98-inset p-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">From:</label>
          <div className="flex gap-2">
            <select
              className="win98-inset p-1 flex-1"
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
            >
              {Object.entries(COMMON_TOKENS).map(([symbol, address]) => (
                <option key={address} value={address}>
                  {symbol}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="win98-inset p-1 flex-1"
              value={fromAmount}
              onChange={(e) => {
                setFromAmount(e.target.value);
                setQuote(null);
                setToAmount('');
              }}
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <button className="win98-button" onClick={handleFlipTokens}>
            <ArrowDownUp size={16} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">To:</label>
          <div className="flex gap-2">
            <select
              className="win98-inset p-1 flex-1"
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
            >
              {Object.entries(COMMON_TOKENS).map(([symbol, address]) => (
                <option key={address} value={address}>
                  {symbol}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="win98-inset p-1 flex-1 bg-gray-100"
              value={toAmount}
              placeholder="0.00"
              readOnly
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-1">
            Slippage Tolerance: {slippage}%
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {quote && (
          <div className="mb-4 text-xs bg-blue-50 p-2 win98-inset">
            <div className="flex justify-between">
              <span>Price Impact:</span>
              <span className={quote.priceImpactPct > 1 ? 'text-red-600' : 'text-green-600'}>
                {quote.priceImpactPct.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Route:</span>
              <span>{quote.routePlan?.length || 0} hops</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="win98-button flex-1"
            onClick={handleGetQuote}
            disabled={loading || !fromAmount}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <RefreshCw size={14} className="animate-spin" />
                Getting Quote...
              </span>
            ) : (
              'Get Quote'
            )}
          </button>
          <button
            className="win98-button flex-1"
            onClick={handleSwap}
            disabled={!quote || swapping}
          >
            {swapping ? 'Swapping...' : 'Swap'}
          </button>
        </div>
      </div>

      {swapHistory.length > 0 && (
        <div className="win98-inset p-4">
          <h3 className="font-bold mb-2">Recent Swaps</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {swapHistory.map((swap) => (
              <div key={swap.id} className="text-xs bg-gray-100 p-2">
                <div className="flex justify-between">
                  <span className="font-bold">
                    {swap.from_symbol} → {swap.to_symbol}
                  </span>
                  <span className={swap.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {swap.status}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{parseFloat(swap.from_amount).toFixed(4)}</span>
                  <span>→</span>
                  <span>{parseFloat(swap.to_amount).toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
