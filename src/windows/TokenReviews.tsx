import React, { useState, useEffect } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { getMockUserId } from '../lib/mockAuth';
import { soundManager } from '../lib/sounds';
import { COMMON_TOKENS } from '../lib/jupiterService';

export const TokenReviews: React.FC = () => {
  const { walletConnected, connectWallet } = useAppContext();
  const [reviews, setReviews] = useState<any[]>([]);
  const [tokenAddress, setTokenAddress] = useState(COMMON_TOKENS.SOL);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (walletConnected) {
      loadReviews();
    }
  }, [walletConnected, tokenAddress]);

  const loadReviews = async () => {
    const { data } = await supabase
      .from('token_reviews')
      .select('*')
      .eq('token_address', tokenAddress)
      .order('created_at', { ascending: false });
    setReviews(data || []);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    soundManager.playClick();

    const symbol = getTokenSymbol(tokenAddress);
    const { error } = await supabase.from('token_reviews').insert([{
      user_id: getMockUserId(),
      token_address: tokenAddress,
      token_symbol: symbol,
      rating,
      comment,
    }]);

    if (!error) {
      soundManager.playSuccess();
      setComment('');
      await loadReviews();
    } else {
      soundManager.playError();
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
          <MessageSquare size={24} color="var(--solana-purple)" />
          <h2 className="text-lg font-bold">Token Reviews</h2>
        </div>
        <div className="text-center p-8 win98-inset">
          <button className="win98-button" onClick={connectWallet}>Connect Wallet</button>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Token Reviews</h2>
      </div>

      <div className="win98-inset p-4 mb-4">
        <select className="win98-inset w-full p-1 mb-2" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)}>
          {Object.entries(COMMON_TOKENS).map(([symbol, address]) => (
            <option key={address} value={address}>{symbol}</option>
          ))}
        </select>

        <div className="mb-2">
          <label className="block text-sm font-bold mb-1">Rating:</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className="win98-button p-1">
                <Star size={16} className={n <= rating ? 'fill-yellow-400' : ''} />
              </button>
            ))}
          </div>
        </div>

        <textarea className="win98-inset w-full p-2 mb-2" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts..." rows={3} />
        <button className="win98-button w-full" onClick={handleSubmit}>Submit Review</button>
      </div>

      <div className="win98-inset p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold">{getTokenSymbol(tokenAddress)} Reviews</h3>
          <div className="flex items-center gap-1 text-sm">
            <Star size={14} className="fill-yellow-400" />
            <span>{avgRating.toFixed(1)} ({reviews.length})</span>
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-100 p-2 text-sm">
              <div className="flex gap-1 mb-1">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={12} className="fill-yellow-400" />
                ))}
              </div>
              <div className="text-xs">{review.comment}</div>
              <div className="text-xs text-gray-600 mt-1">
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
