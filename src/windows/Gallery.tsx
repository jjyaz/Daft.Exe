import React, { useState, useEffect } from 'react';
import { Image, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';

export const Gallery: React.FC = () => {
  const [nfts, setNfts] = useState<any[]>([]);
  const [minting, setMinting] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [nftName, setNftName] = useState('');
  const [showMintForm, setShowMintForm] = useState(false);

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    const { data } = await supabase
      .from('nfts')
      .select('*')
      .eq('listed', true)
      .order('created_at', { ascending: false });

    if (data) {
      setNfts(data);
    } else {
      const defaultNfts = [
        { id: '1', name: 'Daft Bunny #001', price_sol: '0.5', listed: true },
        { id: '2', name: 'Daft Bunny #002', price_sol: '0.7', listed: true },
        { id: '3', name: 'Daft Bunny #003', price_sol: '1.2', listed: true },
      ];
      setNfts(defaultNfts);
    }
  };

  const handleMint = async () => {
    if (!nftName) return;

    setMinting(true);
    soundManager.playClick();

    await new Promise(resolve => setTimeout(resolve, 2000));

    const mintAddress = Array.from({ length: 44 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[
        Math.floor(Math.random() * 58)
      ]
    ).join('');

    const { data } = await supabase.from('nfts').insert([{
      user_id: getMockUserId(),
      name: nftName,
      description: 'Pixel art NFT from daft.exe',
      price_sol: (Math.random() * 2 + 0.1).toFixed(2),
      mint_address: mintAddress,
      listed: true
    }]).select().single();

    if (data) {
      setNfts([data, ...nfts]);
      setNftName('');
      setShowMintForm(false);
      soundManager.playSuccess();
    }

    setMinting(false);
  };

  const handleBuy = async (nftId: string) => {
    setPurchasing(nftId);
    soundManager.playClick();

    await new Promise(resolve => setTimeout(resolve, 1500));

    setPurchasing(null);
    soundManager.playSuccess();
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Image size={24} color="var(--pink-accent)" />
        <h2 className="text-lg font-bold">NFT Marketplace</h2>
      </div>

      <div className="mb-4">
        <button
          className="win98-button mr-2"
          onClick={() => setShowMintForm(!showMintForm)}
        >
          <Upload size={14} className="inline mr-1" />
          Mint New NFT
        </button>
        <button className="win98-button" onClick={loadNFTs}>Browse Collection</button>
      </div>

      {showMintForm && (
        <div className="win98-inset p-4 mb-4">
          <h3 className="font-bold mb-2">Mint New NFT</h3>
          <input
            type="text"
            className="win98-inset w-full p-2 mb-2"
            value={nftName}
            onChange={(e) => setNftName(e.target.value)}
            placeholder="NFT Name"
          />
          <button
            className="win98-button"
            onClick={handleMint}
            disabled={minting || !nftName}
          >
            {minting ? 'Minting...' : 'Mint'}
          </button>
          {minting && (
            <div className="progress-bar mt-2">
              <div className="progress-bar-fill" style={{ width: '90%' }} />
            </div>
          )}
        </div>
      )}

      <div className="win98-inset p-4">
        <h3 className="font-bold mb-2">Pixel Art Collection</h3>
        <div className="grid grid-cols-3 gap-2">
          {nfts.map((nft) => (
            <div key={nft.id} className="win98-border p-2 text-center">
              <div
                className="w-full h-20 mb-2"
                style={{
                  background: `linear-gradient(${Math.random() * 360}deg,
                    hsl(${Math.random() * 360}, 70%, 60%),
                    hsl(${Math.random() * 360}, 70%, 60%))`
                }}
              ></div>
              <div className="text-xs font-bold">{nft.name}</div>
              <div className="text-xs text-gray-600">{nft.price_sol} SOL</div>
              <button
                className="win98-button text-xs mt-1 w-full"
                onClick={() => handleBuy(nft.id)}
                disabled={purchasing === nft.id}
              >
                {purchasing === nft.id ? '...' : 'Buy'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <button className="win98-button">Open Pixel Editor</button>
      </div>
    </div>
  );
};
