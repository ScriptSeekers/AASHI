import React, { useState, useEffect } from 'react';
import { statsApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.js';
import { GameHistoryItemDTO } from '@aashi/shared';
import { soundManager } from '../utils/sound.js';
import { 
  History, 
  Clock, 
  Swords, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

export const GameHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistoryItemDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemPendingDelete, setItemPendingDelete] = useState<GameHistoryItemDTO | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Arpit has exclusive administrative rights
  const isArpit = Boolean(
    user && (
      (user.email && user.email.toLowerCase().includes('arpit')) ||
      (user.username && user.username.toLowerCase().includes('arpit')) ||
      (user.name && user.name.toLowerCase().includes('arpit'))
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
      setMessage({ type: 'success', text: res.message || 'All game history and statistics have been successfully cleared by Arpit.' });
      setTimeout(() => setMessage(null), 5000);
      fetchHistory();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to clear game history.' });
    } finally {
      setIsClearingAll(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemPendingDelete || !isArpit || deletingId) return;
    const target = itemPendingDelete;
    setDeletingId(target.id);
    setMessage(null);

    try {
      soundManager.playPop();
      await statsApi.deleteHistoryItem(target.id);
      setHistory(prev => prev.filter(item => item.id !== target.id));
      setItemPendingDelete(null);
      setMessage({ type: 'success', text: `Match record for "${target.gameTitle}" deleted successfully.` });
      setTimeout(() => setMessage(null), 4000);
      fetchHistory();
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
          <div className="w-12 h-12 rounded-2xl bg-aashi-pink/40 text-aashi-berry flex items-center justify-center shadow-sm">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading font-black text-3xl text-aashi-plum">Game Match History</h1>
            <p className="text-xs text-aashi-plum/70 font-medium">Your recent battles, victories, and couple showdowns</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            title="Refresh history"
            className="p-2.5 rounded-2xl bg-white/80 hover:bg-white border border-aashi-pink/40 text-aashi-plum/70 hover:text-aashi-berry transition-all shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Arpit's Exclusive Clear All History Button - Always accessible to Arpit */}
          {isArpit && (
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
      </div>

      {/* Arpit Authority Notice Badge */}
      {isArpit && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-r from-aashi-lilac/40 to-aashi-pink/30 border border-aashi-lavender/60 text-aashi-plum text-xs font-semibold shadow-xs">
          <ShieldAlert className="w-4 h-4 text-aashi-berry flex-shrink-0" />
          <span>
            <strong>Arpit Master Control Active:</strong> You hold exclusive administrator authority to delete individual match logs or clear all couple game history and reset statistics.
          </span>
        </div>
      )}

      {/* Feedback Alert */}
      {message && (
        <div className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-xs font-bold shadow-xs ${
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
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-aashi-plum/60">
          <Loader2 className="w-7 h-7 animate-spin text-aashi-berry" />
          <p className="text-xs font-semibold">Loading match history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/80 border border-aashi-pink shadow-sm space-y-4">
          <Swords className="w-12 h-12 text-aashi-berry/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-aashi-plum">No Games Played Yet</h3>
            <p className="text-xs text-aashi-plum/70 max-w-sm mx-auto">
              Match history is completely clean. Start your next duel from the Game Library or Couple Zone!
            </p>
          </div>
          {isArpit && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset All Player Statistics to 0</span>
            </button>
          )}
        </div>
      ) : (
        /* Match History List */
        <div className="space-y-3">
          {history.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white/90 border border-aashi-pink/60 shadow-glass flex items-center justify-between gap-4 transition-all hover:bg-white"
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
                  <h4 className="font-bold text-sm text-aashi-plum">{item.gameTitle}</h4>
                  <p className="text-xs text-aashi-plum/60 font-medium flex items-center gap-2">
                    <span>vs {item.opponentName}</span>
                    <span>•</span>
                    <span>{new Date(item.playedAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-aashi-plum/60 font-semibold flex items-center gap-1">
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemPendingDelete(item);
                    }}
                    disabled={deletingId === item.id}
                    title="Delete this match record (Arpit exclusive)"
                    className="p-2 rounded-xl text-aashi-plum/40 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all ml-1"
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

      {/* In-App Confirmation Modal for Deleting a Single Match Record */}
      {itemPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aashi-plum/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-white border border-aashi-pink shadow-glow space-y-4 animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-heading font-black text-xl text-aashi-plum">Delete Match Record?</h3>
              <p className="text-xs text-aashi-plum/70 leading-relaxed">
                Delete the match record for <strong>{itemPendingDelete.gameTitle}</strong> against <strong>{itemPendingDelete.opponentName}</strong>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemPendingDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-aashi-pink text-xs font-bold text-aashi-plum hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Match</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing All History */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aashi-plum/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-aashi-pink shadow-glow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-heading font-black text-xl text-aashi-plum">Clear All Match History?</h3>
              <p className="text-xs text-aashi-plum/70 leading-relaxed">
                As Arpit, confirming this will permanently delete all match history records and reset both player statistics (Games Played, Wins, Streak, Win Rate) to 0. This action cannot be reversed.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-aashi-pink text-xs font-bold text-aashi-plum hover:bg-gray-50 transition-all"
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
                    <span>Clearing All...</span>
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
