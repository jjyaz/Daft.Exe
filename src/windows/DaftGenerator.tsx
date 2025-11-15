import React, { useState } from 'react';
import { Sparkles, Coins, CheckCircle } from 'lucide-react';
import { aiEngine } from '../lib/ai';
import { walletManager } from '../lib/wallet';
import { supabase } from '../lib/supabase';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';

export const DaftGenerator: React.FC = () => {
  const [tokenName, setTokenName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [deployed, setDeployed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setErrorMsg('');
    soundManager.playClick();

    try {
      console.log('Generating memecoin concept with AI...');
      const concept = await aiEngine.generateMemecoinConcept(tokenName);
      setResult(concept);
      soundManager.playSuccess();

      console.log('Saving concept to database...');
      await supabase.from('memecoins').insert([
        {
          user_id: getMockUserId(),
          name: concept.name,
          symbol: concept.symbol,
          supply: concept.supply,
          description: concept.description,
          deployed: false
        }
      ]);
      console.log('Concept saved successfully');
    } catch (error: any) {
      console.error('Error generating memecoin:', error);
      setErrorMsg('AI generation uses local TensorFlow.js model. Full features require cloud AI API.');
      soundManager.playError();
    } finally {
      setGenerating(false);
    }
  };

  const handleDeploy = async () => {
    if (!result) return;

    if (!walletManager.publicKey) {
      setErrorMsg('Please connect your wallet first');
      soundManager.playError();
      return;
    }

    setDeploying(true);
    setErrorMsg('');
    soundManager.playClick();

    try {
      console.log('Creating real SPL token on Solana mainnet...');
      console.log('This requires SOL for rent and transaction fees');

      const mintAddress = await walletManager.createToken(9);
      console.log('SPL token created:', mintAddress);

      const { data } = await supabase
        .from('memecoins')
        .update({
          deployed: true,
          contract_address: mintAddress
        })
        .eq('name', result.name)
        .eq('user_id', getMockUserId())
        .select()
        .single();

      if (data) {
        setResult({ ...result, contract_address: mintAddress });
        setDeployed(true);
        soundManager.playSuccess();
        console.log('Token deployment successful!');
      }
    } catch (error: any) {
      console.error('Error deploying token:', error);
      setErrorMsg('Token deployment failed: ' + error.message + '. You need SOL for rent (~0.002 SOL) and transaction fees.');
      soundManager.playError();
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={24} color="var(--pink-accent)" />
        <h2 className="text-lg font-bold">AI Memecoin Generator</h2>
      </div>

      <div className="win98-inset p-3 mb-4 bg-yellow-50 border border-yellow-600 text-xs">
        <strong>Note:</strong> Token deployment creates REAL SPL tokens on Solana mainnet.
        Requires connected wallet with SOL for rent (~0.002 SOL) and transaction fees.
      </div>

      {errorMsg && (
        <div className="win98-inset p-3 mb-4 bg-red-50 border border-red-600 text-xs">
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      <div className="mb-4">
        <label className="block mb-2 font-bold">Token Name:</label>
        <input
          type="text"
          className="win98-inset w-full p-2"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="Enter token name"
        />
      </div>

      <button
        className="win98-button mb-4"
        onClick={handleGenerate}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Generate Memecoin'}
      </button>

      {generating && (
        <div className="progress-bar mb-4">
          <div
            className="progress-bar-fill animate-pulse"
            style={{ width: '100%' }}
          />
        </div>
      )}

      {result && (
        <div className="win98-inset p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins size={20} color="var(--solana-purple)" />
            <h3 className="font-bold">{result.name}</h3>
          </div>
          <p><strong>Symbol:</strong> {result.symbol}</p>
          <p><strong>Supply:</strong> {result.supply.toLocaleString()}</p>
          <p className="mt-2 text-sm">{result.description}</p>

          {deployed ? (
            <div className="mt-4 p-2 bg-green-100 border border-green-400">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} color="green" />
                <span className="font-bold text-green-700">Deployed!</span>
              </div>
              <p className="text-xs mt-1 font-mono break-all">{result.contract_address}</p>
            </div>
          ) : (
            <button
              className="win98-button mt-4"
              onClick={handleDeploy}
              disabled={deploying}
            >
              {deploying ? 'Deploying...' : 'Deploy to Solana'}
            </button>
          )}

          {deploying && (
            <div className="progress-bar mt-2">
              <div className="progress-bar-fill" style={{ width: '75%' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
