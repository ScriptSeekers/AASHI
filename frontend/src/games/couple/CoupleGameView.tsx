import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../utils/sound.js';
import { Heart, Sparkles, RefreshCw, Compass, ArrowRight } from 'lucide-react';

interface CoupleGameViewProps {
  gameType: string;
  state: any;
  userId: string;
  onAction: (action: string, payload?: any) => void;
  onRematch?: () => void;
}

export const CoupleGameView: React.FC<CoupleGameViewProps> = ({
  gameType,
  state,
  userId,
  onAction,
  onRematch
}) => {
  const [spinning, setSpinning] = useState(false);
  const myAnswer = state.answers?.[userId];
  const isRevealed = state.isRevealed;
  const isGameOver = state.status === 'completed';

  const handleSelectOption = (choice: string) => {
    soundManager.playPop();
    onAction('submit_answer', { answer: choice });
  };

  const handleSpinWheel = () => {
    setSpinning(true);
    soundManager.playPop();
    setTimeout(() => {
      setSpinning(false);
      onAction('spin_wheel');
    }, 1200);
  };

  const handleNext = () => {
    soundManager.playCardFlip();
    onAction('next_round');
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-duvora-pink/40">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-duvora-berry fill-duvora-berry animate-heartbeat" />
          <span className="font-heading font-bold text-lg text-duvora-plum capitalize">
            {gameType.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="text-xs font-bold text-duvora-berry bg-duvora-pink/40 px-3 py-1 rounded-full">
          Round {state.currentRound} / {state.totalRounds}
        </span>
      </div>

      {/* Prompt Card */}
      <div className="w-full p-6 rounded-3xl bg-gradient-to-tr from-white to-duvora-lilac/30 border border-duvora-pink/50 shadow-sm text-center relative overflow-hidden">
        <Sparkles className="absolute top-3 right-3 w-5 h-5 text-duvora-lavender opacity-60" />
        <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-duvora-plum leading-snug">
          "{state.currentPrompt?.text || 'Ready for the next prompt?'}"
        </h3>
      </div>

      {/* Interactive Arena based on gameType */}
      {!isGameOver ? (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Would You Rather (Choice A vs Choice B) */}
          {gameType === 'would_you_rather' && (
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'A', text: state.currentPrompt?.optionA || 'Option A' },
                { key: 'B', text: state.currentPrompt?.optionB || 'Option B' }
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => handleSelectOption(opt.key)}
                  disabled={myAnswer !== undefined}
                  className={`p-5 rounded-2xl border-2 font-semibold text-sm transition-all text-center flex flex-col items-center justify-center gap-2 ${
                    myAnswer === opt.key
                      ? 'border-duvora-berry bg-duvora-pink/50 text-duvora-plum shadow-neon scale-[1.02]'
                      : 'border-duvora-pink/50 bg-white hover:bg-duvora-lilac/40 text-duvora-plum shadow-sm'
                  }`}
                >
                  <span className="text-xs font-black text-duvora-berry bg-white px-2 py-0.5 rounded-full shadow-xs">
                    OPTION {opt.key}
                  </span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Never Have I Ever (I Have vs I Have Never) */}
          {gameType === 'never_have_i_ever' && (
            <div className="w-full grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectOption('have')}
                disabled={myAnswer !== undefined}
                className={`py-4 rounded-2xl font-heading font-bold text-sm shadow-sm transition-all ${
                  myAnswer === 'have'
                    ? 'bg-rose-500 text-white shadow-neon ring-4 ring-rose-200'
                    : 'bg-white hover:bg-rose-50 border border-rose-300 text-rose-600'
                }`}
              >
                🙋 I HAVE!
              </button>
              <button
                onClick={() => handleSelectOption('never')}
                disabled={myAnswer !== undefined}
                className={`py-4 rounded-2xl font-heading font-bold text-sm shadow-sm transition-all ${
                  myAnswer === 'never'
                    ? 'bg-emerald-500 text-white shadow-neon ring-4 ring-emerald-200'
                    : 'bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-600'
                }`}
              >
                🙅 NEVER!
              </button>
            </div>
          )}

          {/* Dare Roulette (Animated Wheel) */}
          {gameType === 'dare_roulette' && (
            <div className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ rotate: spinning ? 1440 : 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="w-36 h-36 rounded-full bg-gradient-to-tr from-duvora-berry via-duvora-pink to-duvora-lavender p-1 shadow-glow flex items-center justify-center"
              >
                <div className="w-full h-full bg-duvora-plum rounded-full flex items-center justify-center text-white">
                  <Compass className="w-16 h-16 text-duvora-pink animate-pulse" />
                </div>
              </motion.div>

              <button
                onClick={handleSpinWheel}
                disabled={spinning}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon hover:opacity-95 transition-all"
              >
                {spinning ? 'SPINNING...' : 'SPIN THE ROULETTE 🎡'}
              </button>
            </div>
          )}

          {/* Truth or Dare & Love Quiz */}
          {(gameType === 'truth_or_dare' || gameType === 'love_quiz' || gameType === 'who_knows_who_better') && (
            <div className="w-full flex items-center justify-center gap-3">
              <button
                onClick={() => handleSelectOption('completed')}
                disabled={myAnswer !== undefined}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon hover:scale-105 transition-all"
              >
                {myAnswer ? 'Answer Locked In 🔒' : 'Complete Challenge / Answer!'}
              </button>
            </div>
          )}

          {/* Reveal Status */}
          {isRevealed && (
            <div className="w-full flex flex-col items-center gap-3 mt-2 p-4 rounded-2xl bg-duvora-lilac/40 border border-duvora-pink">
              <span className="font-heading font-bold text-sm text-duvora-berry">✨ Answers Revealed!</span>
              <div className="flex justify-around w-full text-xs font-semibold text-duvora-plum">
                {state.players.map((p: any) => (
                  <div key={p.userId} className="flex flex-col items-center gap-1">
                    <span>{p.name}</span>
                    <span className="px-3 py-1 rounded-lg bg-white shadow-xs font-bold uppercase text-duvora-berry">
                      {state.answers?.[p.userId] || 'Waiting'}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleNext}
                className="mt-2 flex items-center gap-2 px-5 py-2 rounded-xl bg-duvora-plum text-white text-xs font-bold shadow-md hover:bg-duvora-plum/90 transition-all"
              >
                <span>NEXT ROUND</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-4 py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-duvora-pink/40 flex items-center justify-center text-duvora-berry mb-2">
            <Heart className="w-8 h-8 fill-duvora-berry" />
          </div>
          <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Romantic Match Completed!</h3>
          <p className="text-sm text-duvora-plum/80 font-medium max-w-sm">
            You both connected, confessed and shared moments together!
          </p>
          {onRematch && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon hover:opacity-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
