import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LudoGameState, LudoColor } from '@duvora/shared';
import { soundManager } from '../../utils/sound.js';
import { Dices, RefreshCw, Trophy, Star } from 'lucide-react';

interface LudoGameViewProps {
  state: LudoGameState;
  userId: string;
  onAction: (action: string, payload?: any) => void;
  onRematch?: () => void;
}

const COLOR_CLASSES: Record<LudoColor, { bg: string; border: string; text: string; token: string }> = {
  red: { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-600', token: 'bg-rose-500 ring-rose-300' },
  green: { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-600', token: 'bg-emerald-500 ring-emerald-300' },
  yellow: { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-amber-600', token: 'bg-amber-400 ring-amber-200' },
  blue: { bg: 'bg-sky-500', border: 'border-sky-400', text: 'text-sky-600', token: 'bg-sky-500 ring-sky-300' }
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
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 p-4 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass">
      {/* Header Turn Tracker */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-duvora-pink/40">
        <div className="flex items-center gap-2">
          <span
            className={`w-3.5 h-3.5 rounded-full shadow-sm animate-pulse ${
              COLOR_CLASSES[state.currentTurnColor]?.bg || 'bg-duvora-berry'
            }`}
          />
          <span className="font-semibold text-sm text-duvora-plum">
            {isGameOver
              ? 'Match Finished'
              : isMyTurn
              ? state.hasRolled
                ? 'Select a highlighted token to move!'
                : 'Your Turn! Roll the dice.'
              : `${currentPlayer?.name}'s Turn...`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {state.players.map(p => (
            <div key={p.userId} className="flex items-center gap-1 text-xs font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${COLOR_CLASSES[p.color].bg}`} />
              <span className="text-duvora-plum">{p.name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ludo Board (Responsive Square) */}
      <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] bg-white rounded-2xl border-4 border-duvora-plum shadow-glow grid grid-cols-3 grid-rows-3 overflow-hidden select-none">
        {/* Top-Left: RED YARD */}
        <div className="p-3 bg-rose-100 border-r-2 border-b-2 border-duvora-plum flex flex-col items-center justify-center relative">
          <span className="absolute top-2 left-2 text-[10px] font-bold text-rose-700">RED BASE</span>
          <div className="grid grid-cols-2 gap-3 p-3 bg-white/80 rounded-xl shadow-inner">
            {state.players.find(p => p.color === 'red')?.tokens.map(t => (
              <div
                key={t.id}
                onClick={() => isMyTurn && myPlayer?.color === 'red' && state.canMoveTokens.includes(t.id) && handleSelectToken(t.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md transition-all ${
                  t.isAtBase ? 'bg-rose-500' : 'bg-rose-200 opacity-40'
                } ${
                  isMyTurn && myPlayer?.color === 'red' && state.canMoveTokens.includes(t.id)
                    ? 'ring-4 ring-rose-400 animate-bounce cursor-pointer'
                    : ''
                }`}
              >
                {t.id + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Top-Center: Green Path */}
        <div className="border-r-2 border-b-2 border-duvora-plum bg-emerald-50 flex flex-col items-center justify-around p-1">
          <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600">PATH</span>
        </div>

        {/* Top-Right: GREEN YARD */}
        <div className="p-3 bg-emerald-100 border-b-2 border-duvora-plum flex flex-col items-center justify-center relative">
          <span className="absolute top-2 right-2 text-[10px] font-bold text-emerald-700">GREEN BASE</span>
          <div className="grid grid-cols-2 gap-3 p-3 bg-white/80 rounded-xl shadow-inner">
            {state.players.find(p => p.color === 'green')?.tokens.map(t => (
              <div
                key={t.id}
                onClick={() => isMyTurn && myPlayer?.color === 'green' && state.canMoveTokens.includes(t.id) && handleSelectToken(t.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md transition-all ${
                  t.isAtBase ? 'bg-emerald-500' : 'bg-emerald-200 opacity-40'
                } ${
                  isMyTurn && myPlayer?.color === 'green' && state.canMoveTokens.includes(t.id)
                    ? 'ring-4 ring-emerald-400 animate-bounce cursor-pointer'
                    : ''
                }`}
              >
                {t.id + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Middle-Left: Red Path */}
        <div className="border-r-2 border-b-2 border-duvora-plum bg-rose-50 flex items-center justify-around p-1">
          <Star className="w-4 h-4 text-rose-500 fill-rose-500" />
        </div>

        {/* Center: HOME FINISH TRIANGLES */}
        <div className="relative border-r-2 border-b-2 border-duvora-plum bg-gradient-to-tr from-rose-200 via-amber-100 to-emerald-200 flex flex-col items-center justify-center p-2">
          <Trophy className="w-8 h-8 text-amber-500 fill-amber-400" />
          <span className="text-[9px] font-extrabold text-duvora-plum mt-1">HOME</span>
        </div>

        {/* Middle-Right: Yellow Path */}
        <div className="border-b-2 border-duvora-plum bg-amber-50 flex items-center justify-around p-1">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
        </div>

        {/* Bottom-Left: BLUE YARD */}
        <div className="p-3 bg-sky-100 border-r-2 border-duvora-plum flex flex-col items-center justify-center relative">
          <span className="absolute bottom-2 left-2 text-[10px] font-bold text-sky-700">BLUE BASE</span>
          <div className="grid grid-cols-2 gap-3 p-3 bg-white/80 rounded-xl shadow-inner">
            {state.players.find(p => p.color === 'blue')?.tokens.map(t => (
              <div
                key={t.id}
                onClick={() => isMyTurn && myPlayer?.color === 'blue' && state.canMoveTokens.includes(t.id) && handleSelectToken(t.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md transition-all ${
                  t.isAtBase ? 'bg-sky-500' : 'bg-sky-200 opacity-40'
                } ${
                  isMyTurn && myPlayer?.color === 'blue' && state.canMoveTokens.includes(t.id)
                    ? 'ring-4 ring-sky-400 animate-bounce cursor-pointer'
                    : ''
                }`}
              >
                {t.id + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom-Center: Blue Path */}
        <div className="border-r-2 border-duvora-plum bg-sky-50 flex flex-col items-center justify-around p-1">
          <Star className="w-4 h-4 text-sky-500 fill-sky-500" />
        </div>

        {/* Bottom-Right: YELLOW YARD */}
        <div className="p-3 bg-amber-100 flex flex-col items-center justify-center relative">
          <span className="absolute bottom-2 right-2 text-[10px] font-bold text-amber-700">YELLOW BASE</span>
          <div className="grid grid-cols-2 gap-3 p-3 bg-white/80 rounded-xl shadow-inner">
            {state.players.find(p => p.color === 'yellow')?.tokens.map(t => (
              <div
                key={t.id}
                onClick={() => isMyTurn && myPlayer?.color === 'yellow' && state.canMoveTokens.includes(t.id) && handleSelectToken(t.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md transition-all ${
                  t.isAtBase ? 'bg-amber-500' : 'bg-amber-200 opacity-40'
                } ${
                  isMyTurn && myPlayer?.color === 'yellow' && state.canMoveTokens.includes(t.id)
                    ? 'ring-4 ring-amber-400 animate-bounce cursor-pointer'
                    : ''
                }`}
              >
                {t.id + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Log ticker */}
      {state.lastLog && (
        <div className="w-full text-center py-1.5 px-4 bg-duvora-lilac/50 rounded-xl text-xs font-medium text-duvora-plum">
          {state.lastLog}
        </div>
      )}

      {/* Controls & Dice Roller */}
      <div className="w-full flex items-center justify-between px-4 py-2 bg-white/70 rounded-2xl border border-duvora-pink/40 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Active Player Tokens Status */}
          <div className="text-xs font-semibold text-duvora-plum">
            <span>Your Color: </span>
            <span className={`uppercase font-bold ${COLOR_CLASSES[myPlayer?.color || 'red'].text}`}>
              {myPlayer?.color}
            </span>
          </div>
        </div>

        {/* Dice Roller Component */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={isMyTurn && !state.hasRolled ? { scale: 1.08 } : {}}
            whileTap={isMyTurn && !state.hasRolled ? { scale: 0.95 } : {}}
            onClick={handleRollDice}
            disabled={!isMyTurn || state.hasRolled || isGameOver}
            className={`w-14 h-14 rounded-2xl bg-duvora-plum border-2 border-white shadow-neon flex items-center justify-center text-white text-2xl font-black transition-all ${
              isRollingAnimation ? 'animate-spin' : ''
            } ${
              isMyTurn && !state.hasRolled
                ? 'cursor-pointer hover:border-duvora-pink ring-4 ring-duvora-berry/40'
                : 'opacity-70 cursor-not-allowed'
            }`}
          >
            {state.diceValue ? state.diceValue : <Dices className="w-7 h-7" />}
          </motion.button>
        </div>
      </div>

      {/* Rematch on Game Over */}
      {isGameOver && onRematch && (
        <button
          onClick={onRematch}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon hover:opacity-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>PLAY REMATCH</span>
        </button>
      )}
    </div>
  );
};
