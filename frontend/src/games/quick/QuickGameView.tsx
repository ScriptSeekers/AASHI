import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../utils/sound.js';
import { RefreshCw, Zap, Touchpad, HelpCircle, Trophy } from 'lucide-react';

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
  const isGameOver = state.status === 'completed';
  const isWinner = state.winnerUserId === userId;

  // 1. ROCK PAPER SCISSORS
  if (gameType === 'rock_paper_scissors') {
    const myChoice = state.data?.choices?.[userId];

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass">
        <div className="w-full flex items-center justify-between pb-3 border-b border-duvora-pink/40">
          <span className="font-semibold text-sm text-duvora-plum">
            {isGameOver ? 'Match Finished!' : 'Round ' + state.round + ' / ' + state.maxRounds}
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

        {/* 3 Choices: Rock, Paper, Scissors */}
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
            Locked in! Waiting for partner to reveal...
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
            <span>Rematch</span>
          </button>
        )}
      </div>
    );
  }

  // 3. REACTION RACE
  if (gameType === 'reaction_race') {
    const hasTapped = state.data?.taps?.[userId] !== undefined;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Reaction Race</h3>
        <p className="text-xs text-duvora-plum/80 font-medium">
          Wait for the green light, then tap as fast as your reflexes allow! Premature taps are disqualified!
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
          className={`w-48 h-48 rounded-full border-4 border-white shadow-neon flex flex-col items-center justify-center text-white font-heading font-black text-2xl transition-all ${
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
            <span>Rematch</span>
          </button>
        )}
      </div>
    );
  }

  // 4. FAST TAP BATTLE
  if (gameType === 'fast_tap') {
    const myTaps = state.data?.taps?.[userId] || 0;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
        <h3 className="font-heading font-extrabold text-2xl text-duvora-plum">Fast Tap Mash Battle</h3>
        <p className="text-xs text-duvora-plum/80 font-medium">Tap furious and fast before the 10-second timer expires!</p>

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
            <span>Rematch</span>
          </button>
        )}
      </div>
    );
  }

  // 5. GENERIC QUICK GAME FALLBACK (Word chain, Guess Number, Dice duel)
  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass text-center">
      <h3 className="font-heading font-extrabold text-2xl text-duvora-plum capitalize">
        {gameType.replace(/_/g, ' ')}
      </h3>

      {state.lastMessage && (
        <p className="text-xs font-bold text-duvora-berry bg-duvora-lilac/40 px-3 py-1.5 rounded-xl">
          {state.lastMessage}
        </p>
      )}

      {/* Action form */}
      {!isGameOver ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            if (inputVal.trim()) {
              soundManager.playPop();
              if (gameType === 'guess_number') {
                onAction('guess', { guess: Number(inputVal) });
              } else if (gameType === 'word_chain') {
                onAction('submit_word', { word: inputVal });
              } else {
                onAction('action', { value: inputVal });
              }
              setInputVal('');
            }
          }}
          className="w-full flex gap-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder={gameType === 'guess_number' ? 'Enter number 1-100...' : 'Type your answer...'}
            className="flex-1 px-4 py-2.5 rounded-2xl border border-duvora-pink bg-white text-sm outline-none focus:ring-2 focus:ring-duvora-berry"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-duvora-berry text-white font-bold text-sm shadow-sm hover:opacity-95"
          >
            Submit
          </button>
        </form>
      ) : (
        onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon hover:opacity-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY REMATCH</span>
          </button>
        )
      )}
    </div>
  );
};
