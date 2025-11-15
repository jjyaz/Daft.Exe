import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, DollarSign } from 'lucide-react';
import { soundManager } from '../lib/sounds';
import { useAppContext } from '../context/AppContext';
import { stakingService, StakingPool, UserStake } from '../lib/stakingService';

export const MyWallet: React.FC = () => {
  const { walletConnected, walletAddress, walletBalance, connectWallet } = useAppContext();
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [selectedPool, setSelectedPool] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [staking, setStaking] = useState(false);
  const [unstaking, setUnstaking] = useState(false);
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);

  useEffect(() => {
    if (walletConnected) {
      loadData();
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [walletConnected]);

  const loadData = async () => {
    const [poolsData, stakesData, staked, rewards] = await Promise.all([
      stakingService.getActivePools(),
      stakingService.getUserStakes(),
      stakingService.getTotalStaked(),
      stakingService.getTotalRewards(),
    ]);

    setPools(poolsData);
    setUserStakes(stakesData);
    setTotalStaked(staked);
    setTotalRewards(rewards);

    if (poolsData.length > 0 && !selectedPool) {
      setSelectedPool(poolsData[0].id);
    }
  };

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount) return;

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      soundManager.playError();
      alert('Invalid amount');
      return;
    }

    if (amount > walletBalance) {
      soundManager.playError();
      alert('Insufficient balance');
      return;
    }

    setStaking(true);
    soundManager.playClick();

    try {
      const result = await stakingService.stakeTokens(selectedPool, amount);

      if (result.success) {
        soundManager.playSuccess();
        setStakeAmount('');
        await loadData();
      } else {
        soundManager.playError();
        alert(result.error || 'Staking failed');
      }
    } catch (error: any) {
      console.error('Staking error:', error);
      soundManager.playError();
      alert(error.message || 'Staking failed');
    } finally {
      setStaking(false);
    }
  };

  const handleUnstake = async (stakeId: string) => {
    if (!confirm('Are you sure you want to unstake? This will claim all rewards.')) {
      return;
    }

    setUnstaking(true);
    soundManager.playClick();

    try {
      const result = await stakingService.unstakeTokens(stakeId);

      if (result.success) {
        soundManager.playSuccess();
        alert(`Unstaked ${result.amount} SOL and claimed ${result.rewards?.toFixed(6)} SOL in rewards!`);
        await loadData();
      } else {
        soundManager.playError();
        alert(result.error || 'Unstaking failed');
      }
    } catch (error: any) {
      console.error('Unstaking error:', error);
      soundManager.playError();
      alert(error.message || 'Unstaking failed');
    } finally {
      setUnstaking(false);
    }
  };

  const handleClaimRewards = async (stakeId: string) => {
    soundManager.playClick();

    try {
      const result = await stakingService.claimRewards(stakeId);

      if (result.success) {
        soundManager.playSuccess();
        alert(`Claimed ${result.rewards?.toFixed(6)} SOL in rewards!`);
        await loadData();
      } else {
        soundManager.playError();
        alert(result.error || 'Claim failed');
      }
    } catch (error: any) {
      console.error('Claim error:', error);
      soundManager.playError();
      alert(error.message || 'Claim failed');
    }
  };

  const [connectionStatus, setConnectionStatus] = useState('');
  const [walletDetected, setWalletDetected] = useState(false);

  useEffect(() => {
    const checkWallet = () => {
      if (typeof window !== 'undefined') {
        const solana = (window as any).solana;
        const solflare = (window as any).solflare;

        if (solana?.isPhantom) {
          setWalletDetected(true);
          setConnectionStatus('Phantom wallet detected');
        } else if (solflare) {
          setWalletDetected(true);
          setConnectionStatus('Solflare wallet detected');
        } else {
          setWalletDetected(false);
          setConnectionStatus('No Solana wallet detected. Please install Phantom or Solflare extension.');
        }
      }
    };

    checkWallet();
    const interval = setInterval(checkWallet, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectWallet = async () => {
    setConnectionStatus('Attempting connection...');
    soundManager.playClick();

    try {
      await connectWallet();
      setConnectionStatus('Connected successfully!');
    } catch (error: any) {
      setConnectionStatus(`Connection failed: ${error.message}`);
      soundManager.playError();
    }
  };

  if (!walletConnected) {
    return (
      <div className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">DeFi Yield Farming</h2>
        </div>

        <div className="text-center p-8">
          <div className="win98-inset p-4 mb-4 text-left">
            <h3 className="font-bold mb-2">Wallet Status</h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${walletDetected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{connectionStatus || 'Checking for wallet...'}</span>
              </div>
              {walletDetected && (
                <div className="text-xs text-gray-600 mt-2">
                  Click the button below to connect
                </div>
              )}
              {!walletDetected && (
                <div className="text-xs text-blue-600 mt-2">
                  Install Phantom from chrome.google.com/webstore or phantom.app
                </div>
              )}
            </div>
          </div>

          <button
            className="win98-button"
            onClick={handleConnectWallet}
            disabled={!walletDetected}
          >
            {walletDetected ? 'Connect Wallet' : 'Wallet Not Found'}
          </button>

          <div className="mt-4 text-xs text-gray-600">
            <p>Supported wallets: Phantom, Solflare</p>
            <p className="mt-2">Console logs available in DevTools (F12)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Wallet size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">DeFi Yield Farming</h2>
      </div>

      <div className="win98-inset p-3 mb-4 bg-yellow-50 border border-yellow-600 text-xs">
        <strong>Note:</strong> Staking is database-only simulation. Does not lock real SOL on-chain.
        Deploy a Solana staking program with PDAs for real on-chain staking.
      </div>

      <div className="win98-inset p-4 mb-4">
        <h3 className="font-bold mb-2">Wallet Balance</h3>
        <div className="flex items-center gap-2 mb-2">
          <DollarSign size={20} color="var(--solana-purple)" />
          <span className="text-xl">{walletBalance.toFixed(4)} SOL</span>
        </div>
        <div className="text-xs font-mono text-gray-600 break-all">{walletAddress}</div>
      </div>

      {totalStaked > 0 && (
        <div className="win98-inset p-4 mb-4 bg-blue-50">
          <h3 className="font-bold mb-2">Your Staking Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-600">Total Staked</div>
              <div className="font-bold">{totalStaked.toFixed(4)} SOL</div>
            </div>
            <div>
              <div className="text-gray-600">Total Rewards</div>
              <div className="font-bold text-green-600">{totalRewards.toFixed(6)} SOL</div>
            </div>
          </div>
        </div>
      )}

      <div className="win98-inset p-4 mb-4">
        <h3 className="font-bold mb-2">Stake Tokens</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-bold mb-1">Select Pool:</label>
            <select
              className="win98-inset w-full p-1"
              value={selectedPool}
              onChange={(e) => setSelectedPool(e.target.value)}
            >
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name} - {pool.apy}% APY
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Amount:</label>
            <input
              type="number"
              className="win98-inset w-full p-1"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>
        <button
          className="win98-button mt-2 w-full"
          onClick={handleStake}
          disabled={staking || !selectedPool || !stakeAmount}
        >
          {staking ? 'Staking...' : 'Stake Tokens'}
        </button>
        {staking && (
          <div className="progress-bar mt-2">
            <div className="progress-bar-fill animate-pulse" style={{ width: '80%' }} />
          </div>
        )}
      </div>

      {userStakes.length > 0 && (
        <div className="win98-inset p-4 mb-4">
          <h3 className="font-bold mb-2">Your Stakes</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {userStakes.map((stake) => {
              const pendingRewards = stakingService.calculateRewards(
                stake.amount,
                stake.pool?.apy || 0,
                stake.last_claim
              );
              return (
                <div key={stake.id} className="bg-gray-100 p-2 text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{stake.pool?.name}</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp size={12} />
                      {stake.pool?.apy}% APY
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>Staked: {stake.amount.toFixed(4)} SOL</div>
                    <div>Pending Rewards: {pendingRewards.toFixed(6)} SOL</div>
                    <div>Total Earned: {stake.rewards_earned.toFixed(6)} SOL</div>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button
                      className="win98-button text-xs flex-1"
                      onClick={() => handleClaimRewards(stake.id)}
                      disabled={pendingRewards <= 0}
                    >
                      Claim Rewards
                    </button>
                    <button
                      className="win98-button text-xs flex-1"
                      onClick={() => handleUnstake(stake.id)}
                      disabled={unstaking}
                    >
                      Unstake All
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="win98-inset p-4">
        <h3 className="font-bold mb-2">Available Pools</h3>
        <div className="space-y-2">
          {pools.map((pool) => (
            <div
              key={pool.id}
              className={`flex justify-between items-center p-2 cursor-pointer ${
                selectedPool === pool.id ? 'bg-blue-100 border border-blue-400' : 'bg-gray-100'
              }`}
              onClick={() => setSelectedPool(pool.id)}
            >
              <div>
                <div className="font-bold">{pool.name}</div>
                <div className="text-xs text-gray-600">TVL: ${parseFloat(pool.tvl).toLocaleString()}</div>
                <div className="text-xs text-gray-600">Min: {pool.min_stake} SOL</div>
              </div>
              <span className="flex items-center gap-1">
                <TrendingUp size={14} color="green" />
                <span className="text-green-600 font-bold">{pool.apy}% APY</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
