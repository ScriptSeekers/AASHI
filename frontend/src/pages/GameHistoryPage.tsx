import React, { useState, useEffect } from 'react';
import { statsApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.js';
import { GameHistoryItemDTO } from '@duvora/shared';
import { soundManager } from '../utils/sound.js';
import { 
  History, 
  Clock, 
  Swords, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export const GameHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistoryItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isArpit = Boolean(
    user && (
      user.email.toLowerCase() === 'arpit@duvora.com' ||
      user.username.toLowerCase() === 'arpit'
    )
  );

  const fetchHistory = () => {
    setLoading(true);
    statsApi.getMyStats()
      .then(res => setHistory(res.statistics.recentGames || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearAll = async () => {
    if (!isArpit || isClearingAll) return;
    setIsClearingAll(true);
    setMessage(null);
    try {
      soundManager.playPop();
      const res = await statsApi.clearAllHistory();
      setHistory([]);
      setShowConfirmModal(false);
      setMessage({ type: 'success', text: res.message || 'All game history cleared successfully.' });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to clear game history.' });
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isArpit || deletingId) return;
    if (!window.confirm('Delete this match record? This action cannot be undone.')) return;

    setDeletingId(id);
    setMessage(null);
    try {
      soundManager.playPop();
      await statsApi.deleteHistoryItem(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      setMessage({ type: 'success', text: 'Match record deleted successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete match record.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24 md:pb-12">
      {/* Header with Title and Arpit's Delete All Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-duvora-pink/40 text-duvora-berry flex items-center justify-center shadow-sm">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl text-duvora-plum">Game Match History</h1>
            <p className="text-xs text-duvora-plum/70 font-medium">Your recent battles, victories, and couple showdowns</p>
          </div>
        </div>

        {/* Arpit's Exclusive Clear All History Button */}
        {isArpit && history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-95"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>CLEAR ALL HISTORY</span>
          </button>
        )}
      </div>

      {/* Arpit Authority Notice Badge */}
      {isArpit && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-duvora-lilac/30 border border-duvora-lavender/60 text-duvora-plum text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 text-duvora-berry flex-shrink-0" />
          <span>Arpit Master Control: You have administrator authority to delete match history and reset statistics.</span>
        </div>
      )}

      {/* Feedback Alert */}
      {message && (
        <div className={`flex items-center gap-2 p-3.5 rounded-2xl text-xs font-bold ${
          message.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border border-rose-200 text-rose-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Loading & Empty State */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-duvora-plum/60">
          <Loader2 className="w-7 h-7 animate-spin text-duvora-berry" />
          <p className="text-xs font-semibold">Loading match history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/80 border border-duvora-pink shadow-sm">
          <Swords className="w-12 h-12 text-duvora-berry/40 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-lg text-duvora-plum mb-1">No Games Played Yet</h3>
          <p className="text-xs text-duvora-plum/70 max-w-sm mx-auto">
            Invite your partner from the Couple Zone and start your very first duel!
          </p>
        </div>
      ) : (
        /* Match History List */
        <div className="space-y-3">
          {history.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white/90 border border-duvora-pink/60 shadow-glass flex items-center justify-between gap-4 transition-all hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
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

              <div className="flex items-center gap-3">
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

                {/* Arpit's Individual Delete Button */}
                {isArpit && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteItem(item.id, e)}
                    disabled={deletingId === item.id}
                    title="Delete this match record (Arpit exclusive)"
                    className="p-2 rounded-xl text-duvora-plum/40 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all ml-1"
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Clearing All History */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-duvora-pink shadow-glow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-heading font-black text-xl text-duvora-plum">Clear All Match History?</h3>
              <p className="text-xs text-duvora-plum/70 leading-relaxed">
                As Arpit, confirming this will permanently delete all match records and reset both player statistics to 0. This action cannot be reversed.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-duvora-pink text-xs font-bold text-duvora-plum hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isClearingAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {isClearingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Clearing...</span>
                  </>
                ) : (
                  <span>Yes, Delete All</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
