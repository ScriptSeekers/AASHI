import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { soundManager } from '../../utils/sound.js';
import { RefreshCw, Trophy, Crown } from 'lucide-react';

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
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);

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
    const myPlayerIndex = state.players.findIndex((p: any) => p.userId === userId);
    const isMyTurn = state.currentTurnIndex === myPlayerIndex;
    const selectedPiece = state.pieces?.find((p: any) => p.id === selectedPieceId);

    // Compute legal move squares for selected piece
    const legalTargets: { row: number; col: number; isJump: boolean }[] = [];
    if (selectedPiece && isMyTurn && !isGameOver) {
      const directions = selectedPiece.isKing
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : selectedPiece.playerIndex === 0
        ? [[1, -1], [1, 1]]
        : [[-1, -1], [-1, 1]];

      for (const [dr, dc] of directions) {
        // 1-step move
        const r1 = selectedPiece.row + dr;
        const c1 = selectedPiece.col + dc;
        if (r1 >= 0 && r1 < 8 && c1 >= 0 && c1 < 8 && (r1 + c1) % 2 === 1) {
          const occ1 = state.pieces?.find((p: any) => p.row === r1 && p.col === c1);
          if (!occ1) legalTargets.push({ row: r1, col: c1, isJump: false });
        }

        // 2-step jump
        const r2 = selectedPiece.row + dr * 2;
        const c2 = selectedPiece.col + dc * 2;
        if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && (r2 + c2) % 2 === 1) {
          const occ2 = state.pieces?.find((p: any) => p.row === r2 && p.col === c2);
          const jumped = state.pieces?.find((p: any) => p.row === selectedPiece.row + dr && p.col === selectedPiece.col + dc);
          if (!occ2 && jumped && jumped.playerIndex !== selectedPiece.playerIndex) {
            legalTargets.push({ row: r2, col: c2, isJump: true });
          }
        }
      }
    }

    const handleSquareClick = (r: number, c: number) => {
      if (!isMyTurn || isGameOver) return;

      const piece = state.pieces?.find((p: any) => p.row === r && p.col === c);

      // If clicked own piece: select it
      if (piece && piece.playerIndex === myPlayerIndex) {
        soundManager.playCardFlip();
        setSelectedPieceId(selectedPieceId === piece.id ? null : piece.id);
        return;
      }

      // If piece is selected and clicked empty target square
      if (selectedPieceId && !piece) {
        const isLegal = legalTargets.some(t => t.row === r && t.col === c);
        if (isLegal) {
          soundManager.playPop();
          onAction('move', { pieceId: selectedPieceId, toRow: r, toCol: c });
          setSelectedPieceId(null);
        }
      }
    };

    return (
      <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-4 p-4 bg-duvora-cloud/90 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass">
        <div className="w-full flex items-center justify-between pb-2 border-b border-duvora-pink/40">
          <span className="font-semibold text-sm text-duvora-plum">
            {isGameOver
              ? isWinner
                ? '🎉 Victory! All opponent checkers captured!'
                : 'Match Concluded!'
              : isMyTurn
              ? selectedPieceId
                ? 'Select a highlighted square to move or jump!'
                : '✨ Your Turn! Select one of your checkers.'
              : `Waiting for ${state.players[state.currentTurnIndex]?.name}...`}
          </span>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-rose-500">
              {state.players[0]?.name}: {state.pieces?.filter((p: any) => p.playerIndex === 0).length}
            </span>
            <span className="text-duvora-plum/40">vs</span>
            <span className="text-duvora-berry">
              {state.players[1]?.name}: {state.pieces?.filter((p: any) => p.playerIndex === 1).length}
            </span>
          </div>
        </div>

        {/* 8x8 Board */}
        <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] p-2 bg-duvora-plum rounded-2xl shadow-glow border-4 border-white select-none">
          {Array(8).fill(null).map((_, r) =>
            Array(8).fill(null).map((_, c) => {
              const isDark = (r + c) % 2 === 1;
              const piece = state.pieces?.find((p: any) => p.row === r && p.col === c);
              const isSelected = selectedPiece?.row === r && selectedPiece?.col === c;
              const isLegalTarget = legalTargets.some(t => t.row === r && t.col === c);
              const isJumpTarget = legalTargets.some(t => t.row === r && t.col === c && t.isJump);

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  disabled={!isMyTurn || isGameOver || (!isDark && !piece)}
                  className={`relative flex items-center justify-center transition-all ${
                    isDark ? 'bg-duvora-plum/85 hover:bg-duvora-plum' : 'bg-duvora-lilac/60'
                  } ${isSelected ? 'ring-4 ring-duvora-berry z-10' : ''}`}
                >
                  {/* Checker Piece */}
                  {piece && (
                    <motion.div
                      whileHover={isMyTurn && piece.playerIndex === myPlayerIndex ? { scale: 1.15 } : {}}
                      className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 ${
                        piece.playerIndex === 0
                          ? 'bg-rose-500 text-white border-rose-300'
                          : 'bg-gradient-to-tr from-duvora-berry to-duvora-lavender text-white border-white'
                      } ${isSelected ? 'ring-4 ring-white animate-bounce' : ''}`}
                    >
                      {piece.isKing ? '👑' : ''}
                    </motion.div>
                  )}

                  {/* Legal Destination Highlight */}
                  {isLegalTarget && (
                    <div
                      className={`w-4 h-4 rounded-full ${
                        isJumpTarget
                          ? 'bg-rose-500 ring-4 ring-rose-300 animate-pulse'
                          : 'bg-emerald-400 ring-2 ring-emerald-200'
                      }`}
                    />
                  )}
                </button>
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
