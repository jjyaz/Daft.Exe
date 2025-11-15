import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { soundManager } from '../lib/sounds';

export const Leaderboard: React.FC = () => {
  const [category, setCategory] = useState<'creators' | 'reviewers' | 'stakers'>('creators');
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    loadLeaders();
  }, [category]);

  const loadLeaders = async () => {
    soundManager.playClick();

    let viewName = '';
    if (category === 'creators') viewName = 'leaderboard_creators';
    else if (category === 'reviewers') viewName = 'leaderboard_reviewers';
    else viewName = 'leaderboard_stakers';

    const { data } = await supabase.from(viewName).select('*').limit(10);
    setLeaders(data || []);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={18} className="text-yellow-500" />;
    if (index === 1) return <Medal size={18} className="text-gray-400" />;
    if (index === 2) return <Award size={18} className="text-orange-600" />;
    return <span className="text-sm font-bold">#{index + 1}</span>;
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={24} color="var(--solana-purple)" />
        <h2 className="text-lg font-bold">Leaderboard</h2>
      </div>

      <div className="win98-inset p-2 mb-4 flex gap-1">
        <button className={`win98-button flex-1 text-xs ${category === 'creators' ? 'bg-blue-200' : ''}`} onClick={() => setCategory('creators')}>
          Token Creators
        </button>
        <button className={`win98-button flex-1 text-xs ${category === 'reviewers' ? 'bg-blue-200' : ''}`} onClick={() => setCategory('reviewers')}>
          Reviewers
        </button>
        <button className={`win98-button flex-1 text-xs ${category === 'stakers' ? 'bg-blue-200' : ''}`} onClick={() => setCategory('stakers')}>
          Stakers
        </button>
      </div>

      <div className="win98-inset p-4">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {leaders.map((leader, index) => (
            <div key={leader.user_id} className="bg-gray-100 p-2 flex items-center gap-2">
              <div className="w-8 flex justify-center">{getRankIcon(index)}</div>
              <div className="flex-1">
                <div className="text-xs font-mono truncate">{leader.user_id}</div>
                <div className="text-xs text-gray-600">
                  {category === 'creators' && `${leader.tokens_deployed} deployed`}
                  {category === 'reviewers' && `${leader.reviews_count} reviews`}
                  {category === 'stakers' && `${parseFloat(leader.total_staked || 0).toFixed(2)} SOL staked`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
