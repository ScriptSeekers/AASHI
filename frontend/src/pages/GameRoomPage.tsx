import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useSocket } from '../context/SocketContext.js';
import { roomApi, gameApi } from '../api/endpoints.js';
import { CoupleRoomDTO, SOCKET_EVENTS, GAME_CATALOG } from '@duvora/shared';
import { soundManager } from '../utils/sound.js';

// Game Views
import { UnoGameView } from '../games/uno/UnoGameView.js';
import { ChessGameView } from '../games/chess/ChessGameView.js';
import { LudoGameView } from '../games/ludo/LudoGameView.js';
import { BoardGameView } from '../games/board/BoardGameView.js';
import { CoupleGameView } from '../games/couple/CoupleGameView.js';
import { QuickGameView } from '../games/quick/QuickGameView.js';

import {
  Users,
  Copy,
  Check,
  Send,
  MessageCircle,
  Gamepad2,
  LogOut,
  Sparkles,
  Heart,
  X,
  Play
} from 'lucide-react';

export const GameRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [room, setRoom] = useState<CoupleRoomDTO | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  // In-room Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Active Game State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeGameType, setActiveGameType] = useState<string | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [selectGameModalOpen, setSelectGameModalOpen] = useState(false);

  // Load Room Details
  useEffect(() => {
    if (!roomId) return;
    roomApi.get(roomId).then(res => {
      setRoom(res.room);
      if (res.room.activeSessionId && res.room.activeGameType) {
        setActiveSessionId(res.room.activeSessionId);
        setActiveGameType(res.room.activeGameType);
      }
    }).catch(() => {
      navigate('/dashboard');
    });
  }, [roomId]);

  // Join Room via Socket.IO
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomId });

    socket.on(SOCKET_EVENTS.ROOM_UPDATE, (updatedRoom: CoupleRoomDTO) => {
      setRoom(updatedRoom);
    });

    socket.on(SOCKET_EVENTS.ROOM_PLAYER_STATUS, (data: any) => {
      // Re-fetch room to update member presence
      roomApi.get(roomId).then(r => setRoom(r.room)).catch(() => {});
    });

    socket.on(SOCKET_EVENTS.ROOM_CHAT, (msg: any) => {
      setChatMessages(prev => [...prev, msg]);
      soundManager.playPop();
    });

    socket.on(SOCKET_EVENTS.ROOM_REACTION, (rx: any) => {
      soundManager.playPop();
    });

    socket.on(SOCKET_EVENTS.GAME_STATE, (payload: { sessionId: string; gameType: string; state: any }) => {
      setActiveSessionId(payload.sessionId);
      setActiveGameType(payload.gameType);
      setGameState(payload.state);
    });

    socket.on(SOCKET_EVENTS.GAME_REMATCH_OFFER, (data: { offeredByName: string }) => {
      alert(`${data.offeredByName} has offered a rematch!`);
    });

    // Auto-start game if URL has ?start=<gameId>
    const startParam = searchParams.get('start');
    if (startParam) {
      setTimeout(() => {
        handleStartGame(startParam);
      }, 500);
    }

    return () => {
      socket.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomId });
      socket.off(SOCKET_EVENTS.ROOM_UPDATE);
      socket.off(SOCKET_EVENTS.ROOM_PLAYER_STATUS);
      socket.off(SOCKET_EVENTS.ROOM_CHAT);
      socket.off(SOCKET_EVENTS.ROOM_REACTION);
      socket.off(SOCKET_EVENTS.GAME_STATE);
      socket.off(SOCKET_EVENTS.GAME_REMATCH_OFFER);
    };
  }, [socket, roomId]);

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    soundManager.playPop();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim() || !room) return;
    setInviteStatus(null);
    try {
      soundManager.playPop();
      await roomApi.invite({
        roomId: room.id,
        recipientIdentifier: inviteIdentifier.trim()
      });
      setInviteStatus(`💗 Invitation dispatched in real-time to "${inviteIdentifier}"!`);
      setInviteIdentifier('');
    } catch (err: any) {
      setInviteStatus(`⚠️ ${err.message || 'Failed to send invitation.'}`);
    }
  };

  const handleStartGame = (gameType: string) => {
    if (!socket || !room) return;
    soundManager.playPop();
    socket.emit(SOCKET_EVENTS.GAME_START, {
      roomId: room.id,
      gameType
    });
    setSelectGameModalOpen(false);
  };

  const handleGameAction = (action: string, payload: any = {}) => {
    if (!socket || !activeSessionId) return;
    socket.emit(SOCKET_EVENTS.GAME_ACTION, {
      sessionId: activeSessionId,
      action,
      payload
    });
  };

  const handleRematch = () => {
    if (!socket || !activeSessionId) return;
    soundManager.playPop();
    socket.emit(SOCKET_EVENTS.GAME_REMATCH_ACCEPTED, { sessionId: activeSessionId });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !room) return;
    socket.emit(SOCKET_EVENTS.ROOM_CHAT, {
      roomId: room.id,
      message: chatInput.trim()
    });
    setChatInput('');
  };

  const handleSendReaction = (emoji: string) => {
    if (!socket || !room) return;
    soundManager.playPop();
    socket.emit(SOCKET_EVENTS.ROOM_REACTION, {
      roomId: room.id,
      emoji
    });
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    soundManager.playPop();
    await roomApi.leave(room.id).catch(() => {});
    navigate('/dashboard');
  };

  if (!room) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <span className="text-sm font-semibold text-duvora-plum animate-pulse">Loading Room...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-12">
      {/* Room Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/90 backdrop-blur-md border border-duvora-pink shadow-glass">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-duvora-pink/50 text-duvora-berry flex items-center justify-center shadow-sm">
            <Heart className="w-6 h-6 fill-duvora-berry animate-heartbeat" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-xl sm:text-2xl text-duvora-plum">{room.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-duvora-lilac text-duvora-plum">
                {room.members.length}/{room.maxPlayers} PLAYERS
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-duvora-plum/60">Invite Code:</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs font-bold font-heading px-2 py-0.5 rounded-lg bg-duvora-lilac/50 hover:bg-duvora-pink text-duvora-plum transition-all"
              >
                <span>{room.code}</span>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Room Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              soundManager.playPop();
              setInviteModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-duvora-pink/60 hover:bg-duvora-pink text-duvora-plum font-bold text-xs shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5 text-duvora-berry" />
            <span>Invite Partner</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              setSelectGameModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-xs shadow-neon hover:scale-105 active:scale-95 transition-all"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Select Game</span>
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="p-2 rounded-xl border border-duvora-pink bg-white/80 text-duvora-plum hover:text-duvora-berry transition-all"
            aria-label="Toggle Chat"
          >
            <MessageCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handleLeaveRoom}
            className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
            aria-label="Leave Room"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Emoji Reactions Bar */}
      <div className="flex items-center justify-between p-2.5 px-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-duvora-pink/40 shadow-xs">
        <span className="text-xs font-bold text-duvora-plum/70">Send Reaction:</span>
        <div className="flex items-center gap-2">
          {['💗', '🔥', '👑', '✨', '🥺', '🎉', '🥂'].map(emoji => (
            <motion.button
              key={emoji}
              whileTap={{ scale: 1.3 }}
              onClick={() => handleSendReaction(emoji)}
              className="text-xl hover:scale-125 transition-transform"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Playing Arena */}
      <div className="w-full">
        {gameState && activeGameType ? (
          <div>
            {activeGameType === 'uno' && (
              <UnoGameView
                state={gameState}
                userId={user!.id}
                onAction={handleGameAction}
                onRematch={handleRematch}
              />
            )}
            {activeGameType === 'chess' && (
              <ChessGameView
                state={gameState}
                userId={user!.id}
                onAction={handleGameAction}
                onRematch={handleRematch}
              />
            )}
            {activeGameType === 'ludo' && (
              <LudoGameView
                state={gameState}
                userId={user!.id}
                onAction={handleGameAction}
                onRematch={handleRematch}
              />
            )}
            {['tic_tac_toe', 'connect_four', 'checkers'].includes(activeGameType) && (
              <BoardGameView
                gameType={activeGameType}
                state={gameState}
                userId={user!.id}
                onAction={handleGameAction}
                onRematch={handleRematch}
              />
            )}
            {['never_have_i_ever', 'truth_or_dare', 'would_you_rather', 'who_knows_who_better', 'dare_roulette', 'love_quiz'].includes(activeGameType) && (
              <CoupleGameView
                gameType={activeGameType}
                state={gameState}
                userId={user!.id}
                onAction={handleGameAction}
                onRematch={handleRematch}
              />
            )}
            {['rock_paper_scissors', 'coin_flip', 'dice_duel', 'memory_match', 'reaction_race', 'guess_number', 'word_chain', 'fast_tap', 'hangman', 'higher_lower'].includes(activeGameType) && (
              <QuickGameView
                gameType={activeGameType}
                state={gameState}
                userId={user!.id}
                onAction={handleGameAction}
                onRematch={handleRematch}
              />
            )}
          </div>
        ) : (
          /* Empty Room Lobby State */
          <div className="p-12 rounded-3xl bg-duvora-cloud/80 backdrop-blur-md border border-duvora-pink shadow-glass flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-duvora-pink/40 text-duvora-berry flex items-center justify-center mb-4 shadow-neon animate-float-slow">
              <Gamepad2 className="w-10 h-10" />
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-duvora-plum mb-2">
              The Arena is Waiting!
            </h2>
            <p className="max-w-md text-sm text-duvora-plum/70 font-medium mb-6">
              Pick from our collection of 26 games above or invite your partner to join you.
            </p>
            <button
              onClick={() => {
                soundManager.playPop();
                setSelectGameModalOpen(true);
              }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-heading font-bold text-sm shadow-neon hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>CHOOSE A GAME</span>
            </button>
          </div>
        )}
      </div>

      {/* Slide-out In-Room Chat Drawer */}
      {chatOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-3xl bg-white border border-duvora-pink shadow-glow flex flex-col overflow-hidden">
          <div className="p-3.5 bg-duvora-plum text-white flex items-center justify-between">
            <span className="font-heading font-bold text-xs">Room Chat</span>
            <button onClick={() => setChatOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 h-52 overflow-y-auto space-y-2 text-xs">
            {chatMessages.length === 0 ? (
              <p className="text-center text-gray-400 mt-16">No messages yet. Say hi! 💕</p>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="flex flex-col">
                  <span className="font-bold text-duvora-berry text-[10px]">{msg.userName}:</span>
                  <span className="text-duvora-plum">{msg.message}</span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSendChat} className="p-2 border-t border-duvora-pink/40 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Send love note..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-duvora-pink text-xs outline-none focus:ring-1 focus:ring-duvora-berry"
            />
            <button type="submit" className="p-1.5 rounded-xl bg-duvora-berry text-white">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* INVITE PARTNER MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-duvora-pink shadow-glow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-xl text-duvora-plum">Invite Your Partner</h3>
              <button onClick={() => setInviteModalOpen(false)}>
                <X className="w-5 h-5 text-duvora-plum/50" />
              </button>
            </div>
            <p className="text-xs text-duvora-plum/70 font-medium mb-4">
              Enter your partner's username or email address. A real-time popup will immediately ring on their screen!
            </p>
            {inviteStatus && (
              <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/50 p-2.5 rounded-xl mb-3">
                {inviteStatus}
              </p>
            )}
            <form onSubmit={handleSendInvite} className="space-y-4">
              <input
                type="text"
                required
                value={inviteIdentifier}
                onChange={e => setInviteIdentifier(e.target.value)}
                placeholder="Partner's username or email..."
                className="w-full px-4 py-2.5 rounded-2xl border border-duvora-pink bg-white text-sm outline-none focus:ring-2 focus:ring-duvora-berry"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-heading font-bold text-sm shadow-neon"
              >
                SEND REAL-TIME INVITATION 💌
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SELECT GAME MODAL */}
      {selectGameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[85vh] p-6 rounded-3xl bg-white border border-duvora-pink shadow-glow flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-duvora-pink/40 mb-4">
              <h3 className="font-heading font-bold text-xl text-duvora-plum">Select a Game to Launch</h3>
              <button onClick={() => setSelectGameModalOpen(false)}>
                <X className="w-5 h-5 text-duvora-plum/50" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
              {GAME_CATALOG.map(game => (
                <button
                  key={game.id}
                  onClick={() => handleStartGame(game.id)}
                  className="p-3.5 rounded-2xl border border-duvora-pink/50 hover:border-duvora-berry bg-duvora-cloud/60 hover:bg-white text-left transition-all hover:scale-[1.01] flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-duvora-berry">
                      {game.category}
                    </span>
                    <h4 className="font-heading font-bold text-sm text-duvora-plum">{game.title}</h4>
                    <p className="text-[11px] text-duvora-plum/70 line-clamp-2 mt-0.5">{game.description}</p>
                  </div>
                  <span className="mt-2 text-[10px] font-bold text-duvora-berry self-end">Click to Start →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
