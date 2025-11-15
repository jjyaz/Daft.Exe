import React, { useState } from 'react';
import { Shield, AlertTriangle, Lock } from 'lucide-react';
import { blockchainBridge } from '../lib/blockchain';
import { aiEngine } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';

export const ControlPanel: React.FC = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [scanning, setScanning] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [riskScore, setRiskScore] = useState(0);
  const [zkProofGenerated, setZkProofGenerated] = useState(false);

  const handleScan = async () => {
    if (!contractAddress) return;

    setScanning(true);
    soundManager.playClick();

    try {
      const result = await blockchainBridge.scanContract(contractAddress);
      setVulnerabilities(result.vulnerabilities);
      setRiskScore(result.riskScore);
      soundManager.playNotification();

      await supabase.from('security_scans').insert([{
        user_id: getMockUserId(),
        contract_address: contractAddress,
        vulnerabilities: result.vulnerabilities,
        risk_score: result.riskScore,
        status: 'completed'
      }]);
    } catch (error) {
      console.error('Scan error:', error);
      soundManager.playError();
    } finally {
      setScanning(false);
    }
  };

  const handleGenerateZKProof = async () => {
    soundManager.playClick();
    const proof = await aiEngine.generateZKProof(contractAddress);

    await supabase.from('zk_proofs').insert([{
      user_id: getMockUserId(),
      proof_type: 'audit',
      proof_data: proof,
      verified: false
    }]);

    setZkProofGenerated(true);
    soundManager.playSuccess();
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Smart Contract Security</h2>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-bold">Contract Address:</label>
        <input
          type="text"
          className="win98-inset w-full p-2 mb-2"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="Enter Solana program address"
        />
        <button className="win98-button" onClick={handleScan} disabled={scanning || !contractAddress}>
          {scanning ? 'Scanning...' : 'Scan Contract'}
        </button>
      </div>

      {scanning && (
        <div className="progress-bar mb-4">
          <div className="progress-bar-fill" style={{ width: '75%' }} />
        </div>
      )}

      {vulnerabilities.length > 0 && (
        <div className="win98-inset p-4">
          <div className="mb-2 p-2 bg-yellow-100 border border-yellow-400">
            <span className="font-bold">Risk Score: {riskScore}/100</span>
          </div>
          <h3 className="font-bold mb-2">Vulnerabilities Found:</h3>
          {vulnerabilities.map((vuln, idx) => (
            <div key={idx} className="flex items-start gap-2 mb-2 p-2 bg-gray-100">
              <AlertTriangle
                size={16}
                color={vuln.level === 'high' ? 'red' : vuln.level === 'medium' ? 'orange' : 'yellow'}
              />
              <div className="flex-1">
                <div>
                  <span className="font-bold uppercase">{vuln.level}: </span>
                  <span>{vuln.description}</span>
                </div>
                {vuln.line && <div className="text-xs text-gray-600">Line {vuln.line}</div>}
              </div>
            </div>
          ))}
          {zkProofGenerated ? (
            <div className="mt-2 p-2 bg-green-100 border border-green-400 flex items-center gap-2">
              <Lock size={14} color="green" />
              <span className="text-sm font-bold">ZK Audit Proof Generated</span>
            </div>
          ) : (
            <button className="win98-button mt-2" onClick={handleGenerateZKProof}>
              Generate ZK Audit Proof
            </button>
          )}
        </div>
      )}
    </div>
  );
};
