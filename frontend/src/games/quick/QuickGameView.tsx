import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundManager } from '../../utils/sound.js';
import {
  RefreshCw,
  Zap,
  HelpCircle,
  Trophy,
  Dices,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Disc,
  Heart,
  Lock,
  Compass
} from 'lucide-react';

interface QuickGameViewProps {
  gameType: string;
  state: any;
  userId: string;
  onAction: (action: string, payload?: any) => void;
  onRematch?: () => void;
}

export const QuickGameView: React.FC<QuickGameViewProps> = ({
  gameType,
  state,
  userId,
  onAction,
  onRematch
}) => {
  const [inputVal, setInputVal] = useState('');
  const [wheelSpinning, setWheelSpinning] = useState(false);

  const isGameOver = state.status === 'completed';
  const isWinner = state.winnerUserId === userId;

  // 1. ROCK PAPER SCISSORS
  if (gameType === 'rock_paper_scissors') {
    const myChoice = state.data?.choices?.[userId];

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass">
        <div className="w-full flex items-center justify-between pb-3 border-b border-duvora-pink/40">
          <span className="font-semibold text-sm text-duvora-plum">
            {isGameOver ? 'Match Finished!' : `Round ${state.round} / ${state.maxRounds}`}
          </span>
          <div className="flex gap-4 text-xs font-bold text-duvora-berry">
            <span>{state.players[0].name}: {state.scores[state.players[0].userId]}</span>
            <span>{state.players[1].name}: {state.scores[state.players[1].userId]}</span>
          </div>
        </div>

        {state.lastMessage && (
          <div className="w-full text-center py-2 px-3 bg-duvora-lilac/40 rounded-xl text-xs font-semibold text-duvora-plum">
            {state.lastMessage}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 w-full">
          {[
            { id: 'rock', label: 'Rock', icon: '✊' },
            { id: 'paper', label: 'Paper', icon: '✋' },
            { id: 'scissors', label: 'Scissors', icon: '✌️' }
          ].map(opt => (
            <motion.button
              key={opt.id}
              whileHover={!myChoice && !isGameOver ? { scale: 1.08, y: -4 } : {}}
              whileTap={!myChoice && !isGameOver ? { scale: 0.95 } : {}}
              onClick={() => {
                if (!myChoice && !isGameOver) {
                  soundManager.playPop();
                  onAction('choose', { choice: opt.id });
                }
              }}
              disabled={Boolean(myChoice) || isGameOver}
              className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 shadow-sm transition-all ${
                myChoice === opt.id
                  ? 'border-duvora-berry bg-duvora-pink/50 text-duvora-plum scale-105 shadow-neon'
                  : 'border-duvora-pink/40 bg-white hover:bg-duvora-lilac/30 text-duvora-plum'
              } ${myChoice && myChoice !== opt.id ? 'opacity-40' : ''}`}
            >
              <span className="text-4xl">{opt.icon}</span>
              <span className="text-xs font-bold uppercase">{opt.label}</span>
            </motion.button>
          ))}
        </div>

        {myChoice && !isGameOver && (
          <span className="text-xs font-semibold text-duvora-berry animate-pulse">
            Choice locked in! Waiting for partner to reveal...
          </span>
        )}

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
  }

  // 2. COIN FLIP
  if (gameType === 'coin_flip') {
    const myChoice = state.data?.choices?.[userId];

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Coin Flip Showdown</h3>
        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-300 via-amber-400 to-amber-500 border-4 border-white shadow-glow flex items-center justify-center text-3xl font-heading font-black text-amber-900">
          {state.data?.flipResult ? state.data.flipResult.toUpperCase() : '🪙'}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          {['heads', 'tails'].map(side => (
            <button
              key={side}
              onClick={() => {
                soundManager.playPop();
                onAction('choose', { choice: side });
              }}
              disabled={Boolean(myChoice) || isGameOver}
              className={`py-3.5 rounded-2xl font-heading font-bold text-sm uppercase transition-all ${
                myChoice === side
                  ? 'bg-duvora-berry text-white shadow-neon'
                  : 'bg-white border border-duvora-pink text-duvora-plum hover:bg-duvora-lilac/40'
              }`}
            >
              {side}
            </button>
          ))}
        </div>

        {isGameOver && onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY REMATCH</span>
          </button>
        )}
      </div>
    );
  }

  // 3. DICE DUEL
  if (gameType === 'dice_duel') {
    const myRoll = state.data?.rolls?.[userId];
    const opponent = state.players.find((p: any) => p.userId !== userId);
    const oppRoll = opponent ? state.data?.rolls?.[opponent.userId] : null;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Dice Duel</h3>
        <div className="flex gap-4 text-xs font-bold text-duvora-berry">
          <span>{state.players[0].name}: {state.scores[state.players[0].userId]}</span>
          <span>{state.players[1].name}: {state.scores[state.players[1].userId]}</span>
        </div>

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        <div className="grid grid-cols-2 gap-6 w-full">
          <div className="p-4 rounded-2xl bg-white border border-duvora-pink/60 shadow-sm flex flex-col items-center">
            <span className="text-xs font-bold text-duvora-plum/70 mb-2">You</span>
            <div className="w-20 h-20 rounded-2xl bg-duvora-berry text-white flex items-center justify-center font-heading font-black text-4xl shadow-neon">
              {myRoll !== undefined ? myRoll : '?'}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-duvora-pink/60 shadow-sm flex flex-col items-center">
            <span className="text-xs font-bold text-duvora-plum/70 mb-2">{opponent?.name || 'Partner'}</span>
            <div className="w-20 h-20 rounded-2xl bg-duvora-lavender text-duvora-plum flex items-center justify-center font-heading font-black text-4xl shadow-glow">
              {oppRoll !== undefined && myRoll !== undefined ? oppRoll : '?'}
            </div>
          </div>
        </div>

        {!isGameOver ? (
          <button
            onClick={() => {
              soundManager.playPop();
              onAction('roll');
            }}
            disabled={myRoll !== undefined}
            className={`w-full py-4 rounded-2xl font-heading font-bold text-sm shadow-neon transition-all ${
              myRoll !== undefined
                ? 'bg-duvora-plum/40 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white hover:scale-105 active:scale-95'
            }`}
          >
            {myRoll !== undefined ? '🎲 ROLLED! Waiting for partner...' : '🎲 ROLL HIGH-STAKES DICE'}
          </button>
        ) : (
          onRematch && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>PLAY REMATCH</span>
            </button>
          )
        )}
      </div>
    );
  }

  // 4. MEMORY MATCH
  if (gameType === 'memory_match') {
    const isMyTurn = state.data?.currentTurnUserId === userId;
    const cards = state.data?.cards || [];
    const flippedIds = state.data?.flippedIds || [];

    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-5 p-4 sm:p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <div className="w-full flex items-center justify-between pb-2 border-b border-duvora-pink/40">
          <span className="font-semibold text-sm text-duvora-plum">
            {isGameOver ? 'All Pairs Matched!' : isMyTurn ? '✨ Your Turn! Flip a card.' : 'Waiting for partner...'}
          </span>
          <div className="flex gap-4 text-xs font-bold text-duvora-berry">
            <span>{state.players[0].name}: {state.scores[state.players[0].userId]} pairs</span>
            <span>{state.players[1].name}: {state.scores[state.players[1].userId]} pairs</span>
          </div>
        </div>

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        {/* 4x4 Grid of 16 Cards */}
        <div className="grid grid-cols-4 gap-3 p-3 bg-duvora-plum rounded-3xl shadow-glow border-4 border-white select-none">
          {cards.map((card: any) => {
            const isFlipped = card.isMatched || flippedIds.includes(card.id);

            return (
              <motion.button
                key={card.id}
                whileHover={isMyTurn && !isFlipped && !isGameOver ? { scale: 1.08 } : {}}
                whileTap={isMyTurn && !isFlipped && !isGameOver ? { scale: 0.92 } : {}}
                onClick={() => {
                  if (isMyTurn && !isFlipped && !isGameOver && flippedIds.length < 2) {
                    soundManager.playCardFlip();
                    onAction('flip_card', { cardId: card.id });
                  }
                }}
                disabled={!isMyTurn || isFlipped || isGameOver || flippedIds.length >= 2}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md transition-all ${
                  isFlipped
                    ? card.isMatched
                      ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-800'
                      : 'bg-white border-2 border-duvora-berry text-duvora-plum'
                    : 'bg-gradient-to-tr from-duvora-berry to-duvora-lavender text-white hover:brightness-110'
                }`}
              >
                {isFlipped ? card.sym : '💖'}
              </motion.button>
            );
          })}
        </div>

        {flippedIds.length === 2 && (
          <button
            onClick={() => onAction('reset_flipped')}
            className="px-4 py-1.5 rounded-xl bg-duvora-plum text-white text-xs font-bold shadow-sm"
          >
            Continue
          </button>
        )}

        {isGameOver && onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY REMATCH</span>
          </button>
        )}
      </div>
    );
  }

  // 5. REACTION RACE
  if (gameType === 'reaction_race') {
    const hasTapped = state.data?.taps?.[userId] !== undefined;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Reaction Race</h3>
        <p className="text-xs text-duvora-plum/80 font-medium">
          Wait for the green signal, then tap! False starts get penalized!
        </p>

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        <motion.button
          whileTap={!hasTapped && !isGameOver ? { scale: 0.92 } : {}}
          onClick={() => {
            soundManager.playPop();
            onAction('tap');
          }}
          disabled={hasTapped || isGameOver}
          className={`w-44 h-44 rounded-full border-4 border-white shadow-neon flex flex-col items-center justify-center text-white font-heading font-black text-2xl transition-all ${
            hasTapped
              ? 'bg-duvora-plum/60 opacity-60'
              : 'bg-gradient-to-tr from-rose-500 to-duvora-berry hover:scale-105 active:scale-95'
          }`}
        >
          <Zap className="w-12 h-12 mb-1" />
          <span>{hasTapped ? 'TAPPED!' : 'TAP NOW!'}</span>
        </motion.button>

        {isGameOver && onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY REMATCH</span>
          </button>
        )}
      </div>
    );
  }

  // 6. GUESS THE NUMBER
  if (gameType === 'guess_number') {
    const isMyTurn = state.data?.currentTurnUserId === userId;
    const guesses = state.data?.guesses || [];

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Secret Number (1-100)</h3>
        <p className="text-xs text-duvora-plum/70 font-medium">
          {isGameOver ? 'Match Finished!' : isMyTurn ? '✨ Your Turn! Enter a guess.' : 'Waiting for partner...'}
        </p>

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        <div className="w-full max-h-36 overflow-y-auto space-y-1.5 p-2 bg-white/70 rounded-2xl border border-duvora-pink/40 text-xs">
          {guesses.length === 0 ? (
            <span className="text-gray-400">No guesses yet. Take a guess!</span>
          ) : (
            guesses.map((g: any, i: number) => (
              <div key={i} className="flex justify-between px-2 font-semibold">
                <span>Guess: {g.guess}</span>
                <span className={g.hint === 'CORRECT' ? 'text-emerald-600 font-bold' : 'text-duvora-berry'}>
                  {g.hint}
                </span>
              </div>
            ))
          )}
        </div>

        {!isGameOver ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (inputVal.trim() && isMyTurn) {
                soundManager.playPop();
                onAction('guess', { guess: Number(inputVal) });
                setInputVal('');
              }
            }}
            className="w-full flex gap-2"
          >
            <input
              type="number"
              min="1"
              max="100"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              disabled={!isMyTurn}
              placeholder="Enter 1 - 100..."
              className="flex-1 px-4 py-2.5 rounded-2xl border border-duvora-pink bg-white text-sm outline-none focus:ring-2 focus:ring-duvora-berry"
            />
            <button
              type="submit"
              disabled={!isMyTurn}
              className="px-5 py-2.5 rounded-2xl bg-duvora-berry text-white font-bold text-sm shadow-sm hover:opacity-95 disabled:opacity-50"
            >
              Guess
            </button>
          </form>
        ) : (
          onRematch && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>PLAY REMATCH</span>
            </button>
          )
        )}
      </div>
    );
  }

  // 7. FAST TAP BATTLE
  if (gameType === 'fast_tap') {
    const myTaps = state.data?.taps?.[userId] || 0;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Fast Tap Mash Battle</h3>
        <p className="text-xs text-duvora-plum/80 font-medium">Mash fast before the 10-second timer expires!</p>

        <div className="w-32 h-32 rounded-3xl bg-duvora-plum text-white flex flex-col items-center justify-center border-4 border-white shadow-glow">
          <span className="text-4xl font-black font-heading text-duvora-pink">{myTaps}</span>
          <span className="text-[10px] font-bold tracking-wider text-white/70">YOUR TAPS</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            soundManager.playPop();
            onAction('tap');
          }}
          disabled={isGameOver}
          className="w-full py-5 rounded-3xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-heading font-extrabold text-xl shadow-neon transition-transform"
        >
          MASH ME FAST! 💥
        </motion.button>

        {isGameOver && onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY REMATCH</span>
          </button>
        )}
      </div>
    );
  }

  // 8. HANGMAN
  if (gameType === 'hangman') {
    const word = state.data?.word || '';
    const guessed = state.data?.guessedLetters || [];
    const strikes = state.data?.remainingStrikes ?? 6;
    const isMyTurn = !state.data?.currentTurnUserId || state.data?.currentTurnUserId === userId;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Hangman Romance</h3>

        {/* Hearts counter */}
        <div className="flex items-center gap-1.5">
          {Array(6).fill(null).map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 transition-all ${
                i < strikes ? 'fill-rose-500 text-rose-500' : 'text-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Word Blanks */}
        <div className="flex flex-wrap justify-center gap-2 py-4">
          {word.split('').map((letter: string, i: number) => {
            const revealed = guessed.includes(letter) || isGameOver;
            return (
              <span
                key={i}
                className="w-8 h-10 border-b-4 border-duvora-plum flex items-center justify-center font-heading font-black text-2xl text-duvora-plum"
              >
                {revealed ? letter : ''}
              </span>
            );
          })}
        </div>

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        {/* On-screen A-Z Keyboard */}
        {!isGameOver ? (
          <div className="grid grid-cols-7 gap-1.5 w-full">
            {alphabet.map(letter => {
              const used = guessed.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => {
                    if (!used && isMyTurn) {
                      soundManager.playPop();
                      onAction('guess_letter', { letter });
                    }
                  }}
                  disabled={used || !isMyTurn}
                  className={`p-2 rounded-xl text-xs font-extrabold uppercase transition-all ${
                    used
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isMyTurn
                      ? 'bg-white hover:bg-duvora-pink/60 border border-duvora-pink text-duvora-plum shadow-xs'
                      : 'bg-white/60 text-duvora-plum/40 cursor-not-allowed'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ) : (
          onRematch && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>PLAY REMATCH</span>
            </button>
          )
        )}
      </div>
    );
  }

  // 9. HIGHER OR LOWER
  if (gameType === 'higher_lower') {
    const isMyTurn = state.data?.currentTurnUserId === userId;
    const currentNum = state.data?.currentNumber;
    const streak = state.data?.streak ?? 0;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Higher or Lower</h3>
        <div className="flex gap-4 text-xs font-bold text-duvora-berry">
          <span>{state.players[0].name}: {state.scores[state.players[0].userId]}</span>
          <span>{state.players[1].name}: {state.scores[state.players[1].userId]}</span>
          <span>Streak: {streak} 🔥</span>
        </div>

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        <div className="w-36 h-36 rounded-3xl bg-duvora-plum border-4 border-white shadow-neon flex flex-col items-center justify-center text-white">
          <span className="text-5xl font-heading font-black text-duvora-pink">{currentNum}</span>
          <span className="text-[10px] font-bold tracking-wider text-white/70 mt-1">CURRENT NUMBER</span>
        </div>

        {!isGameOver ? (
          <div className="grid grid-cols-2 gap-4 w-full">
            <button
              onClick={() => {
                if (isMyTurn) {
                  soundManager.playPop();
                  onAction('predict', { prediction: 'higher' });
                }
              }}
              disabled={!isMyTurn}
              className="py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-heading font-bold text-sm shadow-md hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              HIGHER ⬆️
            </button>
            <button
              onClick={() => {
                if (isMyTurn) {
                  soundManager.playPop();
                  onAction('predict', { prediction: 'lower' });
                }
              }}
              disabled={!isMyTurn}
              className="py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-heading font-bold text-sm shadow-md hover:scale-105 active:scale-95 disabled:opacity-40"
            >
              LOWER ⬇️
            </button>
          </div>
        ) : (
          onRematch && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>PLAY REMATCH</span>
            </button>
          )
        )}
      </div>
    );
  }

  // 10. EMOJI RIDDLE BATTLE
  if (gameType === 'emoji_guess') {
    const isMyTurn = state.data?.currentTurnUserId === userId;
    const puzzles = state.data?.puzzles || [];
    const pIdx = state.data?.puzzleIndex || 0;
    const currentPuzzle = puzzles[pIdx];

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Emoji Riddle Battle</h3>
        <p className="text-xs text-duvora-plum/70 font-medium">
          Puzzle {pIdx + 1} of {Math.min(5, puzzles.length)}
        </p>

        {currentPuzzle && (
          <div className="w-full p-6 rounded-3xl bg-white border border-duvora-pink/60 shadow-sm flex flex-col items-center gap-2">
            <span className="text-4xl">{currentPuzzle.emojis}</span>
            <span className="text-xs font-semibold text-duvora-berry bg-duvora-lilac/40 px-3 py-1 rounded-full mt-2">
              Clue: {currentPuzzle.clue}
            </span>
          </div>
        )}

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        {!isGameOver ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (inputVal.trim() && isMyTurn) {
                soundManager.playPop();
                onAction('guess_emoji', { guess: inputVal });
                setInputVal('');
              }
            }}
            className="w-full flex gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              disabled={!isMyTurn}
              placeholder={isMyTurn ? 'Type your guess...' : 'Waiting for partner...'}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-duvora-pink bg-white text-sm outline-none focus:ring-2 focus:ring-duvora-berry"
            />
            <button
              type="submit"
              disabled={!isMyTurn}
              className="px-5 py-2.5 rounded-2xl bg-duvora-berry text-white font-bold text-sm shadow-sm hover:opacity-95 disabled:opacity-40"
            >
              Submit
            </button>
          </form>
        ) : (
          onRematch && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>PLAY REMATCH</span>
            </button>
          )
        )}
      </div>
    );
  }

  // 11. QUICK QUIZ BATTLE
  if (gameType === 'quick_quiz') {
    const questions = state.data?.questions || [];
    const qIdx = state.data?.questionIndex || 0;
    const currentQ = questions[qIdx];
    const myAnswer = state.data?.answers?.[userId];

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Quick Quiz Battle</h3>
        <span className="text-xs font-bold text-duvora-berry bg-duvora-pink/40 px-3 py-1 rounded-full">
          Question {qIdx + 1} of {questions.length}
        </span>

        {currentQ && (
          <div className="w-full p-5 rounded-2xl bg-white border border-duvora-pink/60 shadow-sm text-sm font-bold text-duvora-plum">
            {currentQ.question}
          </div>
        )}

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        {!isGameOver && currentQ ? (
          <div className="grid grid-cols-1 gap-2.5 w-full">
            {currentQ.options.map((opt: string, idx: number) => (
              <button
                key={idx}
                onClick={() => {
                  if (myAnswer === undefined) {
                    soundManager.playPop();
                    onAction('answer_quiz', { optionIndex: idx });
                  }
                }}
                disabled={myAnswer !== undefined}
                className={`p-3.5 rounded-2xl border text-sm font-semibold transition-all ${
                  myAnswer === idx
                    ? 'border-duvora-berry bg-duvora-berry text-white shadow-neon'
                    : 'border-duvora-pink/60 bg-white hover:bg-duvora-lilac/40 text-duvora-plum'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          onRematch && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>PLAY REMATCH</span>
            </button>
          )
        )}
      </div>
    );
  }

  // 12. SPIN THE WHEEL
  if (gameType === 'spin_wheel') {
    const isMyTurn = state.data?.currentTurnUserId === userId;
    const selectedSector = state.data?.selectedSector;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Spin The Wheel</h3>
        <p className="text-xs text-duvora-plum/80 font-medium">Spin for playful romantic dares and rewards!</p>

        {selectedSector && (
          <div className="w-full p-4 rounded-2xl bg-white border border-duvora-pink/60 shadow-sm text-sm font-bold text-duvora-berry animate-bounce">
            {selectedSector}
          </div>
        )}

        <motion.div
          animate={{ rotate: wheelSpinning ? 1800 : 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="w-40 h-40 rounded-full bg-gradient-to-tr from-duvora-berry via-duvora-pink to-duvora-lavender p-1 shadow-glow flex items-center justify-center"
        >
          <div className="w-full h-full bg-duvora-plum rounded-full flex items-center justify-center text-white">
            <Compass className="w-16 h-16 text-duvora-pink animate-pulse" />
          </div>
        </motion.div>

        {!isGameOver ? (
          <button
            onClick={() => {
              if (isMyTurn && !wheelSpinning) {
                setWheelSpinning(true);
                soundManager.playPop();
                setTimeout(() => {
                  setWheelSpinning(false);
                  onAction('spin');
                }, 1500);
              }
            }}
            disabled={!isMyTurn || wheelSpinning}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-heading font-bold text-sm shadow-neon hover:opacity-95 disabled:opacity-40"
          >
            {wheelSpinning ? 'SPINNING...' : isMyTurn ? 'SPIN THE WHEEL 🎡' : 'Waiting for partner...'}
          </button>
        ) : (
          onRematch && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>PLAY REMATCH</span>
            </button>
          )
        )}
      </div>
    );
  }

  // 13. GUESS MY ANSWER
  if (gameType === 'guess_my_answer') {
    const isSubject = state.data?.subjectUserId === userId;
    const isGuesser = state.data?.guesserUserId === userId;
    const prompts = state.data?.prompts || [];
    const pIdx = state.data?.promptIndex || 0;
    const prompt = prompts[pIdx] || 'Share your mind...';
    const hasSecret = Boolean(state.data?.secretAnswer);
    const isRevealed = state.data?.isRevealed;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Guess My Answer</h3>
        <div className="p-4 rounded-2xl bg-white border border-duvora-pink/60 shadow-sm text-sm font-bold text-duvora-plum">
          "{prompt}"
        </div>

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        {!isRevealed ? (
          isSubject ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (inputVal.trim() && !hasSecret) {
                  soundManager.playPop();
                  onAction('set_secret', { answer: inputVal });
                  setInputVal('');
                }
              }}
              className="w-full space-y-3"
            >
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                disabled={hasSecret}
                placeholder="Type your secret answer..."
                className="w-full px-4 py-2.5 rounded-2xl border border-duvora-pink bg-white text-sm outline-none"
              />
              <button
                type="submit"
                disabled={hasSecret}
                className="w-full py-3 rounded-2xl bg-duvora-berry text-white font-bold text-sm shadow-neon disabled:opacity-50"
              >
                {hasSecret ? '🔒 Secret Answer Locked In!' : 'Lock in Secret Answer'}
              </button>
            </form>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (inputVal.trim() && hasSecret) {
                  soundManager.playPop();
                  onAction('guess_answer', { guess: inputVal });
                  setInputVal('');
                }
              }}
              className="w-full space-y-3"
            >
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                disabled={!hasSecret}
                placeholder={hasSecret ? "Guess what your partner typed..." : "Waiting for partner to set answer..."}
                className="w-full px-4 py-2.5 rounded-2xl border border-duvora-pink bg-white text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!hasSecret}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon disabled:opacity-50"
              >
                Submit Guess!
              </button>
            </form>
          )
        ) : (
          <button
            onClick={() => onAction('next_prompt')}
            className="w-full py-3 rounded-2xl bg-duvora-plum text-white font-bold text-sm shadow-sm"
          >
            Next Prompt →
          </button>
        )}

        {isGameOver && onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY REMATCH</span>
          </button>
        )}
      </div>
    );
  }

  // 14. WORD CHAIN (Shiritori)
  if (gameType === 'word_chain') {
    const isMyTurn = state.data?.currentTurnUserId === userId;
    const words = state.data?.words || [];
    const lastLetter = state.data?.lastLetter || 'e';

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Word Chain (Shiritori)</h3>

        <div className="w-full p-4 rounded-2xl bg-white border border-duvora-pink/60 shadow-sm flex flex-col items-center">
          <span className="text-xs text-duvora-plum/60 font-medium">Next word must begin with:</span>
          <span className="text-4xl font-heading font-black text-duvora-berry uppercase mt-1">
            "{lastLetter}"
          </span>
        </div>

        {/* Word History Chips */}
        <div className="flex flex-wrap gap-1.5 justify-center max-h-24 overflow-y-auto">
          {words.map((w: string, i: number) => (
            <span key={i} className="px-2.5 py-1 rounded-full bg-duvora-lilac/50 text-duvora-plum text-xs font-semibold">
              {w}
            </span>
          ))}
        </div>

        {state.lastMessage && (
          <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
            {state.lastMessage}
          </p>
        )}

        {!isGameOver ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              if (inputVal.trim() && isMyTurn) {
                soundManager.playPop();
                onAction('submit_word', { word: inputVal });
                setInputVal('');
              }
            }}
            className="w-full flex gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              disabled={!isMyTurn}
              placeholder={`Word starting with "${lastLetter.toUpperCase()}"...`}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-duvora-pink bg-white text-sm outline-none focus:ring-2 focus:ring-duvora-berry"
            />
            <button
              type="submit"
              disabled={!isMyTurn}
              className="px-5 py-2.5 rounded-2xl bg-duvora-berry text-white font-bold text-sm shadow-sm hover:opacity-95 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        ) : (
          onRematch && (
            <button
              onClick={onRematch}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-duvora-plum text-white font-bold text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>PLAY REMATCH</span>
            </button>
          )
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-8 text-center text-duvora-plum">
      <h3>Active Game: {gameType}</h3>
    </div>
  );
};
