import React, { useState } from 'react';
import { Shield, Lock, CheckCircle } from 'lucide-react';
import { aiEngine } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';

export const PrivacyShield: React.FC = () => {
  const [data, setData] = useState('');
  const [generating, setGenerating] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleGenerateProof = async () => {
    if (!data) return;

    setGenerating(true);
    soundManager.playClick();

    try {
      const proofData = await aiEngine.generateZKProof(data);
      setProof(proofData);
      soundManager.playSuccess();

      await supabase.from('zk_proofs').insert([{
        user_id: getMockUserId(),
        proof_type: 'privacy',
        proof_data: proofData,
        verified: false
      }]);
    } catch (error) {
      console.error('Proof generation error:', error);
      soundManager.playError();
    } finally {
      setGenerating(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!proof) return;

    setVerifying(true);
    soundManager.playClick();

    try {
      const isValid = await aiEngine.verifyZKProof(proof);
      setVerified(isValid);
      soundManager.playSuccess();

      if (isValid) {
        await supabase
          .from('zk_proofs')
          .update({ verified: true })
          .eq('proof_data', proof)
          .eq('user_id', getMockUserId());
      }
    } catch (error) {
      console.error('Verification error:', error);
      soundManager.playError();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">ZK Privacy Dashboard</h2>
      </div>

      <div className="win98-inset p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={16} />
          <h3 className="font-bold">Zero-Knowledge Proofs</h3>
        </div>
        <p className="text-sm mb-4">
          Generate cryptographic proofs without revealing sensitive data
        </p>
        <label className="block mb-2 font-bold text-sm">Input Data:</label>
        <input
          type="text"
          className="win98-inset w-full p-2 mb-2"
          value={data}
          onChange={(e) => setData(e.target.value)}
          placeholder="Enter data to prove"
        />
        <button
          className="win98-button"
          onClick={handleGenerateProof}
          disabled={generating || !data}
        >
          {generating ? 'Generating Proof...' : 'Generate ZK Proof'}
        </button>
      </div>

      {generating && (
        <div className="progress-bar mb-4">
          <div className="progress-bar-fill animate-pulse" style={{ width: '100%' }} />
        </div>
      )}

      {proof && (
        <div className="win98-inset p-4 bg-green-50 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} color="green" />
            <h3 className="font-bold">Proof Generated</h3>
          </div>
          <p className="text-xs font-mono break-all mb-2">{proof}</p>
          {verified ? (
            <div className="p-2 bg-green-100 border border-green-400">
              <span className="text-green-700 font-bold">✓ Verified</span>
            </div>
          ) : (
            <button
              className="win98-button"
              onClick={handleVerifyProof}
              disabled={verifying}
            >
              {verifying ? 'Verifying...' : 'Verify Proof'}
            </button>
          )}
        </div>
      )}

      <div className="win98-inset p-4">
        <h3 className="font-bold mb-2">Privacy Features</h3>
        <div className="space-y-1 text-sm">
          <div>✓ Groth16 Proofs</div>
          <div>✓ Private Transactions</div>
          <div>✓ Anonymous Credentials</div>
          <div>✓ Light Protocol Integration</div>
        </div>
      </div>
    </div>
  );
};
