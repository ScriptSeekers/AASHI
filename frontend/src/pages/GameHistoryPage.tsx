import React, { useState, useEffect } from 'react';
import { statsApi } from '../api/endpoints.js';
import { GameHistoryItemDTO } from '@duvora/shared';
import { History, Trophy, Clock, Swords } from 'lucide-react';

export const GameHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<GameHistoryItemDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.getMyStats()
      .then(res => setHistory(res.statistics.recentGames || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24 md:pb-12">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-duvora-pink/40 text-duvora-berry flex items-center justify-center shadow-sm">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-heading font-black text-3xl text-duvora-plum">Game Match History</h1>
          <p className="text-xs text-duvora-plum/70 font-medium">Your recent battles, victories, and couple showdowns</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-duvora-plum/60 text-center py-12">Loading match history...</p>
      ) : history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/80 border border-duvora-pink shadow-sm">
          <Swords className="w-12 h-12 text-duvora-berry/40 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg text-duvora-plum mb-1">No Games Played Yet</h3>
          <p className="text-xs text-duvora-plum/70 max-w-sm mx-auto">
            Create or join a room from the dashboard and start your very first duel!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white/90 border border-duvora-pink/60 shadow-glass flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full ${
                    item.result === 'won'
                      ? 'bg-emerald-500'
                      : item.result === 'lost'
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                />
                <div>
                  <h4 className="font-bold text-sm text-duvora-plum">{item.gameTitle}</h4>
                  <p className="text-xs text-duvora-plum/60 font-medium flex items-center gap-2">
                    <span>vs {item.opponentName}</span>
                    <span>•</span>
                    <span>{new Date(item.playedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs text-duvora-plum/60 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {item.durationSeconds}s
                </span>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                    item.result === 'won'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.result === 'lost'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {item.result}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
