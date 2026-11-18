import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { statsApi, invitationApi } from '../api/endpoints.js';
import { UserStatsDTO, RoomInvitationDTO, GAME_CATALOG } from '@aashi/shared';
import { soundManager } from '../utils/sound.js';
import {
  Heart,
  Gamepad2,
  Trophy,
  Flame,
  Play,
  Sparkles,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  Radio
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    partnerInfo,
    partnerOnline,
    invitePartner,
    acceptInvitation,
    declineInvitation
  } = useSocket();
  const navigate = useNavigate();

  const [stats, setStats] = useState<UserStatsDTO | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<RoomInvitationDTO[]>([]);
  const [isSelectGameModalOpen, setIsSelectGameModalOpen] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  useEffect(() => {
    // Fetch real-time stats
    statsApi.getMyStats().then(res => setStats(res.statistics)).catch(() => {});
    // Fetch pending invitations
    invitationApi.getPending().then(res => setPendingInvitations(res.invitations)).catch(() => {});
  }, []);

  const handlePlayTogetherClick = (gameId?: string) => {
    soundManager.playPop();
    const partnerName = user?.partnerName || partnerInfo?.name || 'Your partner';

    if (!partnerOnline) {
      setOfflineNotice(`${partnerName} is currently offline. You can play together as soon as they log into AASHI!`);
      return;
    }

    if (gameId) {
      invitePartner(gameId);
    } else {
      setIsSelectGameModalOpen(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 md:pb-12">
      {/* Personalized Greeting & Direct Partner Status Pill */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-aashi-pink/40 via-aashi-lilac/50 to-aashi-peach/30 border border-aashi-pink/60 shadow-glass">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-aashi-berry bg-white/70 px-3 py-1 rounded-full shadow-xs">
              Welcome Back
            </span>
            <span className="text-xs text-aashi-plum/60 font-semibold">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            {user?.partnerName && (
              <span className="text-xs font-bold text-aashi-berry bg-white/80 px-3 py-1 rounded-full border border-aashi-pink/50 flex items-center gap-1.5 shadow-xs">
                <Heart className="w-3.5 h-3.5 fill-aashi-berry text-aashi-berry" />
                Partner: {user.partnerName}
                {partnerOnline ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Offline
                  </span>
                )}
              </span>
            )}
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-aashi-plum">
            Hey {user?.name.split(' ')[0]} 💕
          </h1>
          <p className="text-sm text-aashi-plum/80 font-medium mt-1">
            Challenge your partner to any game with a single click.
          </p>
        </div>

        {/* Direct Play Together Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handlePlayTogetherClick()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-aashi-berry to-aashi-lavender text-white font-heading font-bold text-sm shadow-neon hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>PLAY TOGETHER</span>
          </button>
        </div>
      </div>

      {/* Offline Notice Alert if triggered */}
      {offlineNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-900 text-xs sm:text-sm font-semibold shadow-xs">
          <span>⚠️ {offlineNotice}</span>
          <button onClick={() => setOfflineNotice(null)} className="p-1 text-amber-700 hover:text-amber-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Invitations Section (If Any) */}
      {pendingInvitations.length > 0 && (
        <div className="p-6 rounded-3xl bg-white/90 border border-aashi-pink shadow-glow space-y-4">
          <div className="flex items-center gap-2 text-aashi-berry font-heading font-bold text-lg">
            <Heart className="w-5 h-5 fill-aashi-berry" />
            <span>Pending Game Invitations ({pendingInvitations.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingInvitations.map(inv => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-aashi-lilac/30 border border-aashi-pink/60 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-sm text-aashi-plum">{inv.senderName} invited you!</h4>
                  <p className="text-xs text-aashi-berry font-semibold">{inv.gameTitle || 'Couple Game'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await acceptInvitation(inv.id);
                      setPendingInvitations(prev => prev.filter(i => i.id !== inv.id));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-aashi-berry text-white font-bold text-xs shadow-sm hover:opacity-90"
                  >
                    Accept
                  </button>
                  <button
                    onClick={async () => {
                      await declineInvitation(inv.id);
                      setPendingInvitations(prev => prev.filter(i => i.id !== inv.id));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-aashi-pink text-aashi-plum font-semibold text-xs hover:bg-gray-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'GAMES PLAYED', value: stats?.gamesPlayed ?? 0, icon: Gamepad2, color: 'text-aashi-berry' },
          { label: 'GAMES WON', value: stats?.gamesWon ?? 0, icon: Trophy, color: 'text-amber-500' },
          { label: 'CURRENT STREAK', value: `${stats?.currentStreak ?? 0} 🔥`, icon: Flame, color: 'text-rose-500' },
          { label: 'WIN RATE', value: `${stats?.winRate ?? 0}%`, icon: TrendingUp, color: 'text-emerald-500' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white/80 backdrop-blur-sm border border-aashi-pink/50 shadow-glass flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider text-aashi-plum/60 uppercase">
                  {item.label}
                </span>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="font-heading font-black text-2xl sm:text-3xl text-aashi-plum">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Featured Games Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-black text-2xl text-aashi-plum">Featured Games</h2>
            <p className="text-xs text-aashi-plum/70 font-medium">Click "Play Together" to invite your partner instantly</p>
          </div>
          <Link to="/games" className="text-xs font-bold text-aashi-berry hover:underline flex items-center gap-1">
            Explore All 26 Games <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAME_CATALOG.slice(0, 6).map(game => (
            <div
              key={game.id}
              className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-aashi-pink/60 shadow-glass hover:shadow-glass-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-aashi-berry bg-aashi-pink/40">
                    {game.category}
                  </span>
                  <span className="text-[11px] font-semibold text-aashi-plum/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~{game.estimatedMinutes}m
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-aashi-plum mb-1">{game.title}</h3>
                <p className="text-xs text-aashi-plum/75 font-body line-clamp-2 leading-relaxed">
                  {game.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-aashi-pink/30 flex items-center justify-between">
                <span className="text-xs font-bold text-aashi-plum/60">{game.minPlayers}-{game.maxPlayers} Players</span>
                <button
                  onClick={() => handlePlayTogetherClick(game.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-aashi-plum text-white font-bold text-xs shadow-sm hover:bg-aashi-berry hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Play Together</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SELECT GAME TO PLAY MODAL */}
      {isSelectGameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aashi-plum/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] p-6 rounded-3xl bg-white border border-aashi-pink shadow-glow flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-aashi-pink/40 mb-4">
              <div>
                <h3 className="font-heading font-bold text-xl text-aashi-plum">Select Game to Play Together</h3>
                <p className="text-xs text-aashi-plum/60 font-medium">Partner: {user?.partnerName || 'Connected'}</p>
              </div>
              <button
                onClick={() => setIsSelectGameModalOpen(false)}
                className="p-1 rounded-lg text-aashi-plum/50 hover:text-aashi-plum"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
              {GAME_CATALOG.map(game => (
                <button
                  key={game.id}
                  onClick={() => {
                    setIsSelectGameModalOpen(false);
                    handlePlayTogetherClick(game.id);
                  }}
                  className="p-3.5 rounded-2xl border border-aashi-pink/50 hover:border-aashi-berry bg-aashi-cloud/60 hover:bg-white text-left transition-all hover:scale-[1.01] flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-aashi-berry">
                      {game.category}
                    </span>
                    <h4 className="font-heading font-bold text-sm text-aashi-plum">{game.title}</h4>
                    <p className="text-[11px] text-aashi-plum/70 line-clamp-2 mt-0.5">{game.description}</p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-aashi-berry self-end flex items-center gap-1">
                    Play with Partner →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
