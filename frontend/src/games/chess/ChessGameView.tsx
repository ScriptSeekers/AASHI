import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChessGameState } from '@duvora/shared';
import { Chess, Square } from 'chess.js';
import { soundManager } from '../../utils/sound.js';
import { Flag, Handshake, RefreshCw, Trophy } from 'lucide-react';

interface ChessGameViewProps {
  state: ChessGameState & { statusReason?: string; drawOfferedBy?: string | null; lastMove?: any };
  userId: string;
  onAction: (action: string, payload?: any) => void;
  onRematch?: () => void;
}

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

export const ChessGameView: React.FC<ChessGameViewProps> = ({ state, userId, onAction, onRematch }) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{ from: Square; to: Square } | null>(null);

  const isWhite = state.whiteUserId === userId;
  const isBlack = state.blackUserId === userId;
  const isMyTurn = (state.turn === 'w' && isWhite) || (state.turn === 'b' && isBlack);
  const isGameOver = state.status === 'completed';
  const amIWinner = state.winnerUserId === userId;

  // Local chess instance for finding legal moves for the selected piece
  let chess: Chess;
  try {
    chess = new Chess(state.fen);
  } catch {
    chess = new Chess();
  }

  const handleSquareClick = (square: Square) => {
    if (!isMyTurn || isGameOver) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Check if clicked square is among legal moves
      if (legalMoves.includes(square)) {
        // Check pawn promotion condition
        const piece = chess.get(selectedSquare);
        const isPromotion = piece?.type === 'p' && (square.endsWith('8') || square.endsWith('1'));
        if (isPromotion) {
          setPendingPromotionMove({ from: selectedSquare, to: square });
          return;
        }

        soundManager.playPop();
        onAction('move', { from: selectedSquare, to: square });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    // Select piece
    const piece = chess.get(square);
    const myColor = isWhite ? 'w' : 'b';
    if (piece && piece.color === myColor) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(moves.map((m: any) => m.to));
      soundManager.playCardFlip();
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handlePromotionSelection = (pieceType: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotionMove) return;
    soundManager.playPop();
    onAction('move', {
      from: pendingPromotionMove.from,
      to: pendingPromotionMove.to,
      promotion: pieceType
    });
    setPendingPromotionMove(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  // Generate 8x8 grid rows/cols (oriented from current player's perspective)
  const files = isBlack ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = isBlack ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4 p-4 bg-duvora-cloud/85 backdrop-blur-md rounded-3xl border border-duvora-pink shadow-glass">
      {/* Match Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-duvora-pink/40">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-duvora-berry animate-pulse" />
          <span className="font-semibold text-sm text-duvora-plum">
            {isGameOver
              ? state.statusReason || 'Game Over'
              : isMyTurn
              ? '👑 Your Turn! Make your move.'
              : `Waiting for opponent (${state.turn === 'w' ? 'White' : 'Black'})...`}
          </span>
        </div>

        {state.isCheck && !isGameOver && (
          <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-extrabold text-xs animate-bounce shadow-sm">
            CHECK! ⚠️
          </span>
        )}
      </div>

      {/* Opponent Info & Captured Pieces */}
      <div className="w-full flex items-center justify-between px-2 text-xs text-duvora-plum/80 font-medium">
        <span>Opponent ({isWhite ? 'Black' : 'White'})</span>
        <div className="flex items-center gap-1 text-base">
          {(isWhite ? state.capturedPieces?.w : state.capturedPieces?.b)?.map((p, i) => (
            <span key={i}>{PIECE_SYMBOLS[p] || p}</span>
          ))}
        </div>
      </div>

      {/* Chessboard Grid */}
      <div className="relative p-2 rounded-2xl bg-duvora-plum shadow-glow border-4 border-white/80">
        <div className="grid grid-cols-8 grid-rows-8 w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] md:w-[480px] md:h-[480px]">
          {ranks.map(rank =>
            files.map(file => {
              const square = `${file}${rank}` as Square;
              const isDark = (file.charCodeAt(0) + rank) % 2 === 1;
              const piece = chess.get(square);
              const isSelected = selectedSquare === square;
              const isLegal = legalMoves.includes(square);
              const isLastMove =
                state.lastMove &&
                (state.lastMove.from === square || state.lastMove.to === square);

              return (
                <button
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  disabled={!isMyTurn || isGameOver}
                  className={`relative flex items-center justify-center text-3xl sm:text-4xl transition-colors ${
                    isDark ? 'bg-duvora-plum/70' : 'bg-duvora-lilac/70'
                  } ${isSelected ? 'ring-4 ring-duvora-berry inset-0 z-10' : ''} ${
                    isLastMove ? 'bg-duvora-pink/50' : ''
                  }`}
                >
                  {/* Piece Symbol */}
                  {piece && (
                    <span
                      className={`select-none transition-transform hover:scale-110 drop-shadow ${
                        piece.color === 'w' ? 'text-white' : 'text-duvora-dark'
                      }`}
                    >
                      {PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                    </span>
                  )}

                  {/* Legal Move Dot */}
                  {isLegal && (
                    <div
                      className={`absolute w-3.5 h-3.5 rounded-full ${
                        piece ? 'ring-4 ring-rose-400 bg-transparent' : 'bg-duvora-berry/70'
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Player Info & Captured Pieces */}
      <div className="w-full flex items-center justify-between px-2 text-xs text-duvora-plum/80 font-medium">
        <span>You ({isWhite ? 'White' : 'Black'})</span>
        <div className="flex items-center gap-1 text-base">
          {(isWhite ? state.capturedPieces?.b : state.capturedPieces?.w)?.map((p, i) => (
            <span key={i}>{PIECE_SYMBOLS[p] || p}</span>
          ))}
        </div>
      </div>

      {/* Match Actions (Resign, Draw, Rematch) */}
      {!isGameOver ? (
        <div className="w-full flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onAction('offer_draw')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-duvora-pink bg-white/70 hover:bg-white text-xs font-semibold text-duvora-plum transition-all"
          >
            <Handshake className="w-3.5 h-3.5" />
            <span>Offer Draw</span>
          </button>
          <button
            onClick={() => onAction('resign')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-600 transition-all"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Resign</span>
          </button>
        </div>
      ) : (
        onRematch && (
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-duvora-berry to-duvora-lavender text-white font-bold text-sm shadow-neon hover:opacity-95 transition-all mt-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>PLAY REMATCH</span>
          </button>
        )
      )}

      {/* Pawn Promotion Modal */}
      <AnimatePresence>
        {pendingPromotionMove && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-duvora-plum/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-3xl bg-white border border-duvora-pink shadow-glow text-center max-w-xs w-full"
            >
              <h3 className="font-heading font-bold text-lg text-duvora-plum mb-4">Promote Pawn</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: 'q', label: 'Queen', sym: '♛' },
                  { type: 'r', label: 'Rook', sym: '♜' },
                  { type: 'b', label: 'Bishop', sym: '♝' },
                  { type: 'n', label: 'Knight', sym: '♞' }
                ].map(p => (
                  <button
                    key={p.type}
                    onClick={() => handlePromotionSelection(p.type as any)}
                    className="p-3 rounded-2xl bg-duvora-lilac/50 hover:bg-duvora-pink text-2xl font-bold flex flex-col items-center justify-center shadow-sm transition-all"
                  >
                    <span>{p.sym}</span>
                    <span className="text-[10px] mt-1 font-semibold">{p.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Draw Offer Notification */}
      {state.drawOfferedBy && state.drawOfferedBy !== userId && !isGameOver && (
        <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
          <span>Opponent offered a draw. Accept?</span>
          <div className="flex gap-2">
            <button
              onClick={() => onAction('accept_draw')}
              className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold"
            >
              Accept
            </button>
            <button
              onClick={() => onAction('decline_draw')}
              className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 font-bold"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
