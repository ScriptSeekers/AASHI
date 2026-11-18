import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LudoGameState, LudoColor } from '@aashi/shared';
import { soundManager } from '../../utils/sound.js';
import { Dices, RefreshCw, Trophy, Star, ArrowRight, ShieldCheck } from 'lucide-react';

interface LudoGameViewProps {
  state: LudoGameState;
  userId: string;
  onAction: (action: string, payload?: any) => void;
  onRematch?: () => void;
}

const COLOR_CLASSES: Record<LudoColor, { bg: string; border: string; text: string; token: string; lightBg: string }> = {
  red: { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-600', token: 'bg-rose-500 ring-rose-300', lightBg: 'bg-rose-50' },
  green: { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-600', token: 'bg-emerald-500 ring-emerald-300', lightBg: 'bg-emerald-50' },
  yellow: { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-amber-600', token: 'bg-amber-400 ring-amber-200', lightBg: 'bg-amber-50' },
  blue: { bg: 'bg-sky-500', border: 'border-sky-400', text: 'text-sky-600', token: 'bg-sky-500 ring-sky-300', lightBg: 'bg-sky-50' }
};

export const LudoGameView: React.FC<LudoGameViewProps> = ({ state, userId, onAction, onRematch }) => {
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);

  const myPlayer = state.players.find(p => p.userId === userId);
  const currentPlayer = state.players.find(p => p.color === state.currentTurnColor);
  const isMyTurn = myPlayer && myPlayer.color === state.currentTurnColor;
  const isGameOver = state.status === 'completed';
  const amIWinner = state.winnerUserId === userId;

  const handleRollDice = () => {
    if (!isMyTurn || state.hasRolled || isGameOver) return;
    setIsRollingAnimation(true);
    soundManager.playPop();

    setTimeout(() => {
      setIsRollingAnimation(false);
      onAction('roll_dice');
    }, 400);
  };

  const handleSelectToken = (tokenId: number) => {
    if (!isMyTurn || !state.hasRolled || isGameOver) return;
    soundManager.playCardFlip();
    onAction('move_token', { tokenId });
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-5 p-4 sm:p-6 bg-aashi-cloud/90 backdrop-blur-md rounded-3xl border border-aashi-pink shadow-glass">
      {/* Header Turn Tracker */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-aashi-pink/40">
        <div className="flex items-center gap-2">
          <span
            className={`w-3.5 h-3.5 rounded-full shadow-sm animate-pulse ${
              COLOR_CLASSES[state.currentTurnColor]?.bg || 'bg-aashi-berry'
            }`}
          />
          <span className="font-semibold text-sm text-aashi-plum">
            {isGameOver
              ? amIWinner
                ? '🏆 Victory! All your tokens are Home!'
                : `${state.players.find(p => p.userId === state.winnerUserId)?.name || 'Partner'} Won the Game!`
              : isMyTurn
              ? state.hasRolled
                ? state.canMoveTokens.length > 0
                  ? `Rolled ${state.diceValue}! Select which token to move:`
                  : `Rolled ${state.diceValue}! No legal moves available.`
                : 'Your Turn! Roll the dice.'
              : `${currentPlayer?.name}'s Turn...`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {state.players.map(p => (
            <div key={p.userId} className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={`w-3 h-3 rounded-full ${COLOR_CLASSES[p.color].bg} shadow-xs`} />
              <span className="text-aashi-plum font-bold">{p.name.split(' ')[0]}</span>
              <span className="text-[10px] text-aashi-plum/60">
                ({p.tokens.filter(t => t.isHome).length}/4 🏁)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ludo Arena Visual Representation */}
      <div className="w-full grid grid-cols-2 gap-4">
        {state.players.map(p => {
          const isPlayerTurn = p.color === state.currentTurnColor;
          const isMe = p.userId === userId;

          return (
            <div
              key={p.userId}
              className={`p-3.5 rounded-2xl border-2 transition-all ${
                isPlayerTurn
                  ? 'border-aashi-berry bg-white shadow-neon'
                  : 'border-aashi-pink/40 bg-white/70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${COLOR_CLASSES[p.color].bg}`} />
                  <span className="font-heading font-bold text-xs text-aashi-plum">
                    {p.name} {isMe ? '(You)' : ''}
                  </span>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${COLOR_CLASSES[p.color].lightBg} ${COLOR_CLASSES[p.color].text}`}>
                  {p.color}
                </span>
              </div>

              {/* Tokens Grid */}
              <div className="grid grid-cols-2 gap-2">
                {p.tokens.map(t => {
                  const isMovable = isMe && isMyTurn && state.hasRolled && state.canMoveTokens.includes(t.id);

                  let statusText = 'In Base';
                  if (t.isHome) statusText = 'Home 🏁';
                  else if (!t.isAtBase) statusText = `Step ${t.step}/56`;

                  return (
                    <motion.button
                      key={t.id}
                      whileHover={isMovable ? { scale: 1.05 } : {}}
                      whileTap={isMovable ? { scale: 0.95 } : {}}
                      onClick={() => isMovable && handleSelectToken(t.id)}
                      disabled={!isMovable}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                        isMovable
                          ? 'border-aashi-berry bg-aashi-pink/40 shadow-neon cursor-pointer ring-2 ring-aashi-berry animate-pulse'
                          : t.isHome
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-aashi-pink/30 bg-aashi-cloud/60 text-aashi-plum/80'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className={`w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center ${COLOR_CLASSES[p.color].bg}`}>
                          {t.id + 1}
                        </span>
                        <span className="text-[10px] font-bold">{statusText}</span>
                      </div>
                      {isMovable && state.diceValue !== null && (
                        <span className="text-[9px] font-black text-aashi-berry mt-0.5">
                          {t.isAtBase ? 'Deploy! (6)' : `Move +${state.diceValue}`}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Log ticker */}
      {state.lastLog && (
        <div className="w-full text-center py-2 px-4 bg-aashi-lilac/40 rounded-xl text-xs font-semibold text-aashi-plum shadow-xs">
          {state.lastLog}
        </div>
      )}

      {/* Controls & Dice Roller */}
      <div className="w-full flex items-center justify-between px-5 py-3 bg-white/80 rounded-2xl border border-aashi-pink/40 shadow-sm">
        <div className="text-xs text-aashi-plum font-medium">
          <span className="font-bold">Turn: </span>
          <span className={`font-black uppercase ${COLOR_CLASSES[state.currentTurnColor]?.text}`}>
            {state.currentTurnColor}
          </span>
          {isMyTurn && (
            <span className="ml-2 font-bold text-aashi-berry">
              {state.hasRolled ? '👉 Select token above' : '🎲 Tap dice to roll'}
            </span>
          )}
        </div>

        {/* Dice Button */}
        <motion.button
          whileHover={isMyTurn && !state.hasRolled ? { scale: 1.08 } : {}}
          whileTap={isMyTurn && !state.hasRolled ? { scale: 0.95 } : {}}
          onClick={handleRollDice}
          disabled={!isMyTurn || state.hasRolled || isGameOver}
          className={`w-14 h-14 rounded-2xl bg-aashi-plum border-2 border-white shadow-neon flex items-center justify-center text-white text-2xl font-black transition-all ${
            isRollingAnimation ? 'animate-spin' : ''
          } ${
            isMyTurn && !state.hasRolled
              ? 'cursor-pointer hover:border-aashi-pink ring-4 ring-aashi-berry/40'
              : 'opacity-70 cursor-not-allowed'
          }`}
        >
          {state.diceValue ? state.diceValue : <Dices className="w-7 h-7" />}
        </motion.button>
      </div>

      {/* Rematch on Game Over */}
      {isGameOver && onRematch && (
        <button
          onClick={onRematch}
          className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-aashi-berry to-aashi-lavender text-white font-bold text-sm shadow-neon hover:scale-105 active:scale-95 transition-all mt-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>PLAY REMATCH</span>
        </button>
      )}
    </div>
  );
};
