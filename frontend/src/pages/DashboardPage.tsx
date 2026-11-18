import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { roomApi, statsApi, invitationApi } from '../api/endpoints.js';
import { UserStatsDTO, RoomInvitationDTO, GAME_CATALOG } from '@duvora/shared';
import { soundManager } from '../utils/sound.js';
import {
  Heart,
  Gamepad2,
  Trophy,
  Flame,
  Plus,
  LogIn,
  Send,
  Sparkles,
  Users,
  Clock,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, acceptInvitation, declineInvitation } = useSocket();
  const navigate = useNavigate();

  const [stats, setStats] = useState<UserStatsDTO | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<RoomInvitationDTO[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Fetch real-time stats
    statsApi.getMyStats().then(res => setStats(res.statistics)).catch(() => {});
    // Fetch pending invitations
    invitationApi.getPending().then(res => setPendingInvitations(res.invitations)).catch(() => {});
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      soundManager.playPop();
      const res = await roomApi.create({
        name: roomNameInput.trim() || 'Our Love Haven',
        isPrivate: true,
        maxPlayers: 2
      });
      setIsCreateModalOpen(false);
      navigate(`/room/${res.room.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create room.');
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      soundManager.playPop();
      const res = await roomApi.join({
        code: joinCodeInput.trim().toUpperCase()
      });
      setIsJoinModalOpen(false);
      navigate(`/room/${res.room.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join room.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24 md:pb-12">
      {/* Personalized Greeting & Partner Pill */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-duvora-pink/40 via-duvora-lilac/50 to-duvora-peach/30 border border-duvora-pink/60 shadow-glass">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-duvora-berry bg-white/70 px-3 py-1 rounded-full shadow-xs">
              Welcome Back
            </span>
            <span className="text-xs text-duvora-plum/60 font-semibold">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            {user?.partnerName && (
              <span className="text-xs font-bold text-duvora-berry bg-white/80 px-3 py-1 rounded-full border border-duvora-pink/50 flex items-center gap-1.5 shadow-xs">
                <Heart className="w-3.5 h-3.5 fill-duvora-berry text-duvora-berry" />
                Partner: {user.partnerName}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </span>
            )}
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-duvora-plum">
            Hey {user?.name.split(' ')[0]} 💕
          </h1>
          <p className="text-sm text-duvora-plum/80 font-medium mt-1">
            Ready to challenge your partner and create unforgettable memories?
          </p>
        </div>

        {/* Quick Room Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playPop();
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-heading font-bold text-sm shadow-neon hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE ROOM</span>
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setIsJoinModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/90 border border-duvora-pink text-duvora-plum font-heading font-bold text-sm shadow-sm hover:bg-white hover:text-duvora-berry transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>JOIN ROOM</span>
          </button>
        </div>
      </div>

      {/* Pending Invitations Section (If Any) */}
      {pendingInvitations.length > 0 && (
        <div className="p-6 rounded-3xl bg-white/90 border border-duvora-pink shadow-glow space-y-4">
          <div className="flex items-center gap-2 text-duvora-berry font-heading font-bold text-lg">
            <Heart className="w-5 h-5 fill-duvora-berry" />
            <span>Pending Game Invitations ({pendingInvitations.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingInvitations.map(inv => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-duvora-lilac/30 border border-duvora-pink/60 flex items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-sm text-duvora-plum">{inv.senderName} invited you!</h4>
                  <p className="text-xs text-duvora-plum/70 font-medium">Room: {inv.roomName} ({inv.roomCode})</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await acceptInvitation(inv.id);
                      setPendingInvitations(prev => prev.filter(i => i.id !== inv.id));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-duvora-berry text-white font-bold text-xs shadow-sm hover:opacity-90"
                  >
                    Accept
                  </button>
                  <button
                    onClick={async () => {
                      await declineInvitation(inv.id);
                      setPendingInvitations(prev => prev.filter(i => i.id !== inv.id));
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-duvora-pink text-duvora-plum font-semibold text-xs hover:bg-gray-50"
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
          { label: 'GAMES PLAYED', value: stats?.gamesPlayed ?? 0, icon: Gamepad2, color: 'text-duvora-berry' },
          { label: 'GAMES WON', value: stats?.gamesWon ?? 0, icon: Trophy, color: 'text-amber-500' },
          { label: 'CURRENT STREAK', value: `${stats?.currentStreak ?? 0} 🔥`, icon: Flame, color: 'text-rose-500' },
          { label: 'WIN RATE', value: `${stats?.winRate ?? 0}%`, icon: TrendingUp, color: 'text-emerald-500' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-white/80 backdrop-blur-sm border border-duvora-pink/50 shadow-glass flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider text-duvora-plum/60 uppercase">
                  {item.label}
                </span>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="font-heading font-black text-2xl sm:text-3xl text-duvora-plum">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recent Matches Section (Only when games have actually been played) */}
      {stats?.recentGames && stats.recentGames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-xl text-duvora-plum">Recent Battles</h2>
              <p className="text-xs text-duvora-plum/70 font-medium">Your latest head-to-head match results</p>
            </div>
            <Link to="/history" className="text-xs font-bold text-duvora-berry hover:underline flex items-center gap-1">
              Match History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.recentGames.slice(0, 3).map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white/90 border border-duvora-pink/60 shadow-glass flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-duvora-plum">{item.gameTitle}</h4>
                  <p className="text-xs text-duvora-plum/60 font-medium">vs {item.opponentName}</p>
                </div>
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
            ))}
          </div>
        </div>
      )}

      {/* Featured Games Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-black text-2xl text-duvora-plum">Featured Couple Games</h2>
            <p className="text-xs text-duvora-plum/70 font-medium">Ready to play in 1 click inside your room</p>
          </div>
          <Link to="/games" className="text-xs font-bold text-duvora-berry hover:underline flex items-center gap-1">
            Explore All 26 Games <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAME_CATALOG.slice(0, 6).map(game => (
            <div
              key={game.id}
              className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-duvora-pink/60 shadow-glass hover:shadow-glass-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-duvora-berry bg-duvora-pink/40">
                    {game.category}
                  </span>
                  <span className="text-[11px] font-semibold text-duvora-plum/60 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ~{game.estimatedMinutes}m
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-duvora-plum mb-1">{game.title}</h3>
                <p className="text-xs text-duvora-plum/75 font-body line-clamp-2 leading-relaxed">
                  {game.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-duvora-pink/30 flex items-center justify-between">
                <span className="text-xs font-bold text-duvora-plum/60">{game.minPlayers}-{game.maxPlayers} Players</span>
                <button
                  onClick={() => {
                    soundManager.playPop();
                    setIsCreateModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-duvora-plum text-white font-bold text-xs shadow-sm hover:bg-duvora-plum/90 transition-all"
                >
                  Create Match
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE ROOM MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-duvora-pink shadow-glow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-xl text-duvora-plum">Create Couple Room</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-lg text-duvora-plum/50 hover:text-duvora-plum">
                <X className="w-5 h-5" />
              </button>
            </div>
            {errorMsg && <p className="text-xs text-rose-600 mb-3">{errorMsg}</p>}
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-duvora-plum uppercase mb-1">Room Name</label>
                <input
                  type="text"
                  value={roomNameInput}
                  onChange={e => setRoomNameInput(e.target.value)}
                  placeholder="Our Love Nest"
                  className="w-full px-4 py-2.5 rounded-2xl border border-duvora-pink bg-white text-sm outline-none focus:ring-2 focus:ring-duvora-berry"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-heading font-bold text-sm shadow-neon"
              >
                CREATE & ENTER ROOM
              </button>
            </form>
          </div>
        </div>
      )}

      {/* JOIN ROOM MODAL */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-duvora-pink shadow-glow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-xl text-duvora-plum">Join Private Room</h3>
              <button onClick={() => setIsJoinModalOpen(false)} className="p-1 rounded-lg text-duvora-plum/50 hover:text-duvora-plum">
                <X className="w-5 h-5" />
              </button>
            </div>
            {errorMsg && <p className="text-xs text-rose-600 mb-3">{errorMsg}</p>}
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-duvora-plum uppercase mb-1">Enter Room Code</label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value)}
                  placeholder="e.g. 8K2M9P"
                  className="w-full px-4 py-2.5 rounded-2xl border border-duvora-pink bg-white text-sm uppercase tracking-widest font-heading font-bold outline-none focus:ring-2 focus:ring-duvora-berry"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-heading font-bold text-sm shadow-neon"
              >
                JOIN MATCH
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
