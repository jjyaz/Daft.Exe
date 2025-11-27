import React, { useState } from 'react';
import { Shield, Eye, TrendingUp, Award } from 'lucide-react';
import { PortfolioAnalyticsService } from '../lib/portfolioAnalyticsService';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';

export const PrivatePortfolio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'whale' | 'reputation'>('analyze');
  const [snapshot, setSnapshot] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateSnapshot = async () => {
    setLoading(true);
    soundManager.playClick();
    try {
      const holdings = PortfolioAnalyticsService.generateMockHoldings();
      const data = await PortfolioAnalyticsService.createPortfolioSnapshot(getMockUserId(), holdings, false);
      setSnapshot(data);
      soundManager.playSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWhale = async () => {
    setLoading(true);
    soundManager.playClick();
    try {
      const balance = 50000 + Math.random() * 500000;
      const data = await PortfolioAnalyticsService.createWhaleVerification(getMockUserId(), balance);
      setVerification(data);
      soundManager.playSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      soundManager.playError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Private Portfolio Analytics</h2>
      </div>

      <div className="flex gap-1 mb-4">
        <button className={`win98-button text-xs ${activeTab === 'analyze' ? 'bg-white' : ''}`} onClick={() => {setActiveTab('analyze'); soundManager.playClick();}}>
          <TrendingUp size={14} className="inline mr-1" />Analyze
        </button>
        <button className={`win98-button text-xs ${activeTab === 'whale' ? 'bg-white' : ''}`} onClick={() => {setActiveTab('whale'); soundManager.playClick();}}>
          <Eye size={14} className="inline mr-1" />Whale Status
        </button>
        <button className={`win98-button text-xs ${activeTab === 'reputation' ? 'bg-white' : ''}`} onClick={() => {setActiveTab('reputation'); soundManager.playClick();}}>
          <Award size={14} className="inline mr-1" />Reputation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'analyze' && (
          <div className="space-y-3">
            <button className="win98-button w-full" onClick={handleCreateSnapshot} disabled={loading}>
              {loading ? 'Creating...' : 'Create Private Snapshot with ZK Proof'}
            </button>
            {snapshot && (
              <div className="win98-inset p-3">
                <h3 className="font-bold mb-2">Portfolio Snapshot</h3>
                <div className="text-sm space-y-1">
                  <div>Verified Value: <Shield size={12} className="inline text-blue-500" /> Hidden</div>
                  <div>Whale Tier: {snapshot.whale_tier.toUpperCase()}</div>
                  <div>Risk Score: {snapshot.risk_score}/100</div>
                  <div>Diversification: {snapshot.diversification_score}/100</div>
                  <div>Positions: {snapshot.position_count}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'whale' && (
          <div className="space-y-3">
            <button className="win98-button w-full" onClick={handleVerifyWhale} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Whale Status with ZK Proof'}
            </button>
            {verification && (
              <div className="win98-inset p-3 border-2 border-blue-500">
                <h3 className="font-bold mb-2 text-blue-600">Verified Whale Status</h3>
                <div className="text-sm space-y-1">
                  <div>Tier: {verification.verification_tier.toUpperCase()}</div>
                  <div>Balance Range: {verification.verified_balance_range}</div>
                  <div><Shield size={12} className="inline text-green-500" /> ZK Verified</div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="font-bold mb-1">Unlocked Perks:</div>
                    {verification.perks_unlocked.map((perk: string, i: number) => (
                      <div key={i} className="text-xs">• {perk}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reputation' && (
          <div className="win98-inset p-4 text-center text-gray-600">
            <Award size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Reputation proofs allow you to verify trading performance without revealing exact numbers</p>
          </div>
        )}
      </div>
    </div>
  );
};
