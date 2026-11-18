import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { UnoGameState, UnoCard, UnoColor } from '@duvora/shared';
import { soundManager } from '../../utils/sound.js';
import { Flame, ShieldAlert, Sparkles, RefreshCw, Trophy } from 'lucide-react';

interface UnoGameViewProps {
  state: UnoGameState;
  userId: string;
  onAction: (action: string, payload?: any) => void;
  onRematch?: () => void;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  red: { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-500', glow: 'shadow-rose-400/50' },
  blue: { bg: 'bg-sky-500', border: 'border-sky-400', text: 'text-sky-500', glow: 'shadow-sky-400/50' },
  green: { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-500', glow: 'shadow-emerald-400/50' },
  yellow: { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-amber-500', glow: 'shadow-amber-300/50' },
  wild: { bg: 'bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500', border: 'border-white', text: 'text-purple-600', glow: 'shadow-purple-400/50' }
};

export const UnoGameView: React.FC<UnoGameViewProps> = ({ state, userId, onAction, onRematch }) => {
  const [selectedWildCard, setSelectedWildCard] = useState<UnoCard | null>(null);

  const currentPlayer = state.players[state.currentTurnIndex];
  const isMyTurn = currentPlayer?.userId === userId;
  const isGameOver = state.status === 'completed';
  const amIWinner = state.winnerUserId === userId;

  useEffect(() => {
    if (isGameOver) {
      if (amIWinner) {
        soundManager.playVictory();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } else {
        soundManager.playPop();
      }
    }
  }, [isGameOver, amIWinner]);

  const handleCardClick = (card: UnoCard) => {
    if (!isMyTurn) return;

    if (card.color === 'wild') {
      setSelectedWildCard(card);
      soundManager.playCardFlip();
      return;
    }

    // Play standard color card
    soundManager.playCardFlip();
    onAction('play_card', { cardId: card.id });
  };

  const handleWildColorSelect = (chosenColor: 'red' | 'blue' | 'green' | 'yellow') => {
    if (!selectedWildCard) return;
    soundManager.playCardFlip();
    onAction('play_card', { cardId: selectedWildCard.id, chosenColor });
    setSelectedWildCard(null);
  };

  const handleDraw = () => {
    if (!isMyTurn) return;
    soundManager.playPop();
    onAction('draw_card');
  };

  const handleCallUno = () => {
    soundManager.playVictory();
    onAction('call_uno');
  };

  const handleCatchUno = (targetUserId: string) => {
    soundManager.playPop();
    onAction('catch_uno', { targetUserId });
  };

  // Find opponents
  const opponents = state.players.filter(p => p.userId !== userId);
  const myPlayer = state.players.find(p => p.userId === userId);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-between min-h-[560px] p-4 bg-duvora-cloud/80 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass overflow-hidden select-none">
      {/* Turn & Status Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-duvora-pink/40">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full animate-pulse bg-duvora-berry" />
          <span className="text-sm font-semibold text-duvora-plum">
            {isGameOver
              ? 'Match Finished'
              : isMyTurn
              ? '✨ Your Turn! Play a matching card or draw.'
              : `Waiting for ${currentPlayer?.name}...`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-duvora-plum/60">Color:</span>
          <span
            className={`w-5 h-5 rounded-full border-2 border-white shadow-sm ${
              COLOR_MAP[state.currentColor]?.bg || 'bg-duvora-pink'
            }`}
          />
        </div>
      </div>

      {/* Opponents Section */}
      <div className="w-full flex items-center justify-around py-4">
        {opponents.map(opp => (
          <div key={opp.userId} className="flex flex-col items-center gap-1.5 relative">
            {opp.calledUno && (
              <span className="absolute -top-3 px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-bounce shadow-sm">
                UNO! 🔥
              </span>
            )}
            <div
              className={`relative p-1 rounded-2xl transition-all ${
                state.players[state.currentTurnIndex]?.userId === opp.userId
                  ? 'ring-4 ring-duvora-berry ring-offset-2 scale-105'
                  : ''
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-duvora-berry to-duvora-lavender flex items-center justify-center text-white font-heading text-xl font-bold shadow-md">
                {opp.name.charAt(0)}
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-duvora-plum text-white font-bold text-xs shadow-md">
                {opp.cardCount}
              </span>
            </div>
            <span className="text-xs font-semibold text-duvora-plum">{opp.name}</span>

            {/* Catch UNO button if opponent forgot to declare UNO */}
            {opp.cardCount === 1 && !opp.calledUno && !isGameOver && (
              <button
                onClick={() => handleCatchUno(opp.userId)}
                className="mt-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-sm transition-all"
              >
                <ShieldAlert className="w-3 h-3" />
                <span>CATCH UNO!</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Center Arena: Draw Pile & Discard Pile */}
      <div className="flex items-center justify-center gap-8 my-auto py-6">
        {/* Draw Pile */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            whileHover={isMyTurn ? { scale: 1.05, y: -4 } : {}}
            whileTap={isMyTurn ? { scale: 0.95 } : {}}
            onClick={handleDraw}
            disabled={!isMyTurn || isGameOver}
            className={`w-24 h-36 rounded-2xl bg-duvora-plum border-2 border-white/80 shadow-glow flex flex-col items-center justify-center text-white relative transition-opacity ${
              isMyTurn ? 'cursor-pointer hover:border-duvora-pink' : 'opacity-70 cursor-not-allowed'
            }`}
          >
            <div className="w-16 h-24 rounded-xl border border-white/40 flex items-center justify-center rotate-6 bg-gradient-to-tr from-duvora-berry to-duvora-plum">
              <span className="font-heading font-extrabold text-lg tracking-wider text-duvora-pink drop-shadow">
                DUVORA
              </span>
            </div>
            <span className="text-[11px] font-bold mt-1 text-white/80">DRAW CARD</span>
          </motion.button>
        </div>

        {/* Discard Pile */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            key={state.topCard.id}
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            className={`w-24 h-36 rounded-2xl ${COLOR_MAP[state.topCard.color]?.bg || 'bg-duvora-pink'} border-2 border-white shadow-xl flex flex-col items-center justify-between p-2 text-white relative`}
          >
            <span className="text-xs font-extrabold self-start">{state.topCard.value.toUpperCase()}</span>
            <div className="w-14 h-20 rounded-full border border-white/60 flex items-center justify-center bg-white/20 shadow-inner">
              <span className="font-heading font-extrabold text-2xl tracking-tighter drop-shadow">
                {state.topCard.value === 'wild'
                  ? '🌈'
                  : state.topCard.value === 'wild4'
                  ? '+4'
                  : state.topCard.value === 'draw2'
                  ? '+2'
                  : state.topCard.value === 'skip'
                  ? '⊘'
                  : state.topCard.value === 'reverse'
                  ? '⇄'
                  : state.topCard.value}
              </span>
            </div>
            <span className="text-xs font-extrabold self-end rotate-180">{state.topCard.value.toUpperCase()}</span>
          </motion.div>
          <span className="text-[11px] font-semibold text-duvora-plum/60">DISCARD PILE</span>
        </div>
      </div>

      {/* Action Description Log */}
      {state.lastActionDescription && (
        <div className="w-full text-center py-1.5 px-4 bg-duvora-lilac/50 rounded-xl text-xs font-medium text-duvora-plum mb-3">
          {state.lastActionDescription}
        </div>
      )}

      {/* Player's Own Hand */}
      <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-duvora-pink/40">
        <div className="w-full flex items-center justify-between px-2">
          <span className="text-xs font-bold text-duvora-plum">
            Your Hand ({state.myHand?.length || 0} cards)
          </span>

          {/* UNO Button */}
          {state.myHand && state.myHand.length <= 2 && !myPlayer?.calledUno && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleCallUno}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white font-heading font-black text-xs tracking-wider shadow-neon animate-pulse"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>DECLARE UNO!</span>
            </motion.button>
          )}
        </div>

        {/* Cards Row (Horizontal Scrollable) */}
        <div className="w-full flex items-center gap-2 overflow-x-auto py-3 px-2 no-scrollbar justify-center">
          {state.myHand?.map((card, idx) => {
            const isCardPlayable = isMyTurn && (
              card.color === 'wild' ||
              card.color === state.currentColor ||
              card.value === state.topCard.value
            );

            return (
              <motion.button
                key={card.id || idx}
                whileHover={isCardPlayable ? { scale: 1.1, y: -10 } : {}}
                whileTap={isCardPlayable ? { scale: 0.95 } : {}}
                onClick={() => isCardPlayable && handleCardClick(card)}
                disabled={!isCardPlayable || isGameOver}
                className={`flex-shrink-0 w-16 h-24 sm:w-20 sm:h-30 rounded-xl ${
                  COLOR_MAP[card.color]?.bg || 'bg-duvora-pink'
                } border-2 border-white shadow-md flex flex-col items-center justify-between p-1.5 text-white transition-all ${
                  isCardPlayable
                    ? 'cursor-pointer hover:shadow-neon'
                    : 'opacity-40 grayscale cursor-not-allowed'
                }`}
              >
                <span className="text-[10px] font-bold self-start">{card.value}</span>
                <span className="font-heading font-extrabold text-base sm:text-xl drop-shadow">
                  {card.value === 'wild'
                    ? '🌈'
                    : card.value === 'wild4'
                    ? '+4'
                    : card.value === 'draw2'
                    ? '+2'
                    : card.value === 'skip'
                    ? '⊘'
                    : card.value === 'reverse'
                    ? '⇄'
                    : card.value}
                </span>
                <span className="text-[10px] font-bold self-end rotate-180">{card.value}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Wild Color Picker Modal */}
      <AnimatePresence>
        {selectedWildCard && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="p-6 rounded-3xl bg-white border border-duvora-pink shadow-glow text-center max-w-xs w-full"
            >
              <h3 className="font-heading font-bold text-lg text-duvora-plum mb-4">Choose Next Color</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['red', 'blue', 'green', 'yellow'] as const).map(color => (
                  <button
                    key={color}
                    onClick={() => handleWildColorSelect(color)}
                    className={`p-4 rounded-2xl ${COLOR_MAP[color].bg} text-white font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-transform uppercase`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-white border border-duvora-pink shadow-glow text-center max-w-sm w-full"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-duvora-pink/40 flex items-center justify-center text-duvora-berry mb-4">
                <Trophy className="w-8 h-8 fill-duvora-berry" />
              </div>
              <h3 className="font-heading font-extrabold text-2xl text-duvora-plum mb-2">
                {amIWinner ? '🎉 You Won!' : 'Match Finished!'}
              </h3>
              <p className="text-sm text-duvora-plum/70 mb-6 font-medium">
                {state.lastActionDescription || 'What an exhilarating battle!'}
              </p>
              {onRematch && (
                <button
                  onClick={onRematch}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon hover:opacity-95 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>PLAY REMATCH</span>
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
