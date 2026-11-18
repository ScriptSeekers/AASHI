import React from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../utils/sound.js';
import { RefreshCw, Trophy } from 'lucide-react';

interface BoardGameViewProps {
  gameType: string;
  state: any;
  userId: string;
  onAction: (action: string, payload?: any) => void;
  onRematch?: () => void;
}

export const BoardGameView: React.FC<BoardGameViewProps> = ({
  gameType,
  state,
  userId,
  onAction,
  onRematch
}) => {
  const isGameOver = state.status === 'completed';
  const isWinner = state.winnerUserId === userId;

  // 1. TIC TAC TOE
  if (gameType === 'tic_tac_toe') {
    const isMyTurn = state.currentTurnUserId === userId;

    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-6 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass">
        <div className="w-full flex items-center justify-between pb-3 border-b border-duvora-pink/40">
          <span className="font-semibold text-sm text-duvora-plum">
            {isGameOver
              ? state.isDraw
                ? "It's a Draw! 🤝"
                : isWinner
                ? '🎉 You Won!'
                : 'Partner Won!'
              : isMyTurn
              ? '✨ Your Turn!'
              : 'Waiting for partner...'}
          </span>
          <div className="flex gap-4 text-xs font-bold text-duvora-plum">
            <span>{state.players[0].name}: {state.players[0].symbol}</span>
            <span>{state.players[1].name}: {state.players[1].symbol}</span>
          </div>
        </div>

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-duvora-plum rounded-3xl shadow-glow border-4 border-white">
          {state.board.map((cell: string | null, idx: number) => (
            <motion.button
              key={idx}
              whileHover={isMyTurn && !cell && !isGameOver ? { scale: 1.05 } : {}}
              whileTap={isMyTurn && !cell && !isGameOver ? { scale: 0.95 } : {}}
              onClick={() => {
                if (isMyTurn && !cell && !isGameOver) {
                  soundManager.playPop();
                  onAction('move', { index: idx });
                }
              }}
              disabled={!isMyTurn || cell !== null || isGameOver}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center font-heading font-black text-3xl sm:text-4xl shadow-md transition-all ${
                cell === 'X'
                  ? 'bg-rose-100 text-rose-500'
                  : cell === 'O'
                  ? 'bg-sky-100 text-sky-500'
                  : 'bg-white hover:bg-duvora-lilac/50 text-transparent'
              }`}
            >
              {cell}
            </motion.button>
          ))}
        </div>

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

  // 2. CONNECT FOUR
  if (gameType === 'connect_four') {
    const isMyTurn = state.currentTurnUserId === userId;

    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 p-4 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass">
        <div className="w-full flex items-center justify-between pb-2 border-b border-duvora-pink/40">
          <span className="font-semibold text-sm text-duvora-plum">
            {isGameOver
              ? isWinner
                ? '🎉 Connect Four! You Won!'
                : 'Match Concluded!'
              : isMyTurn
              ? '✨ Click a column to drop your chip!'
              : 'Waiting for partner...'}
          </span>
        </div>

        {/* 6 rows x 7 cols Board */}
        <div className="p-3 bg-duvora-plum rounded-3xl shadow-glow border-4 border-white flex flex-col gap-2">
          {state.grid.map((row: (string | null)[], rIdx: number) => (
            <div key={rIdx} className="flex gap-2">
              {row.map((cell: string | null, cIdx: number) => (
                <button
                  key={cIdx}
                  onClick={() => {
                    if (isMyTurn && !isGameOver) {
                      soundManager.playPop();
                      onAction('drop', { col: cIdx });
                    }
                  }}
                  disabled={!isMyTurn || isGameOver}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 border-duvora-plum shadow-inner transition-transform hover:scale-105 ${
                    cell === 'pink'
                      ? 'bg-duvora-berry shadow-neon'
                      : cell === 'lavender'
                      ? 'bg-duvora-lavender shadow-glow'
                      : 'bg-duvora-lilac/30 hover:bg-duvora-lilac/60'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>

        {isGameOver && onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon hover:opacity-95 transition-all mt-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY REMATCH</span>
          </button>
        )}
      </div>
    );
  }

  // 3. CHECKERS
  if (gameType === 'checkers') {
    const isMyTurn = state.players[state.currentTurnIndex]?.userId === userId;

    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 p-4 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass">
        <div className="w-full flex items-center justify-between pb-2 border-b border-duvora-pink/40">
          <span className="font-semibold text-sm text-duvora-plum">
            {isGameOver ? 'Checkers Match Over' : isMyTurn ? '✨ Your Turn!' : 'Waiting for partner...'}
          </span>
        </div>

        {/* 8x8 Board */}
        <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] p-2 bg-duvora-plum rounded-2xl shadow-glow border-4 border-white">
          {Array(8).fill(null).map((_, r) =>
            Array(8).fill(null).map((_, c) => {
              const isDark = (r + c) % 2 === 1;
              const piece = state.pieces?.find((p: any) => p.row === r && p.col === c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`flex items-center justify-center ${
                    isDark ? 'bg-duvora-plum/80' : 'bg-duvora-lilac/60'
                  }`}
                >
                  {piece && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 border-white ${
                        piece.playerIndex === 0
                          ? 'bg-rose-500 text-white'
                          : 'bg-duvora-lavender text-duvora-plum'
                      }`}
                    >
                      {piece.isKing ? '👑' : ''}
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {isGameOver && onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon hover:opacity-95 transition-all mt-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY REMATCH</span>
          </button>
        )}
      </div>
    );
  }

  return <div>Unknown board game</div>;
};
