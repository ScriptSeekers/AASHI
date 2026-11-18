import { Chess } from 'chess.js';
import { ChessGameState } from '../../shared/index.js';

export interface InternalChessState {
  fen: string;
  whiteUserId: string;
  blackUserId: string;
  whiteName: string;
  blackName: string;
  history: string[]; // SAN history
  capturedPieces: {
    w: string[];
    b: string[];
  };
  drawOfferedBy: string | null;
  winnerUserId: string | null;
  status: 'playing' | 'completed';
  statusReason?: string;
  lastMove?: { from: string; to: string };
}

export class ChessGameEngine {
  static init(players: { userId: string; name: string }[]): InternalChessState {
    const chess = new Chess();
    // Player 0 is white, Player 1 is black
    const white = players[0];
    const black = players[1] || players[0];

    return {
      fen: chess.fen(),
      whiteUserId: white.userId,
      blackUserId: black.userId,
      whiteName: white.name,
      blackName: black.name,
      history: [],
      capturedPieces: { w: [], b: [] },
      drawOfferedBy: null,
      winnerUserId: null,
      status: 'playing'
    };
  }

  static handleAction(
    state: InternalChessState,
    userId: string,
    action: string,
    payload: any
  ): { state: InternalChessState; error?: string } {
    if (state.status === 'completed') {
      return { state, error: 'Match is already completed.' };
    }

    // RESIGN
    if (action === 'resign') {
      if (userId !== state.whiteUserId && userId !== state.blackUserId) {
        return { state, error: 'Not a player in this match.' };
      }
      state.status = 'completed';
      state.winnerUserId = userId === state.whiteUserId ? state.blackUserId : state.whiteUserId;
      const winnerName = userId === state.whiteUserId ? state.blackName : state.whiteName;
      state.statusReason = `${userId === state.whiteUserId ? state.whiteName : state.blackName} resigned. ${winnerName} wins!`;
      return { state };
    }

    // OFFER DRAW
    if (action === 'offer_draw') {
      if (userId !== state.whiteUserId && userId !== state.blackUserId) {
        return { state, error: 'Not a player in this match.' };
      }
      state.drawOfferedBy = userId;
      return { state };
    }

    // ACCEPT DRAW
    if (action === 'accept_draw') {
      if (!state.drawOfferedBy || state.drawOfferedBy === userId) {
        return { state, error: 'No draw offer to accept.' };
      }
      state.status = 'completed';
      state.winnerUserId = null;
      state.statusReason = 'Draw accepted by both players.';
      return { state };
    }

    // DECLINE DRAW
    if (action === 'decline_draw') {
      state.drawOfferedBy = null;
      return { state };
    }

    // MOVE
    if (action === 'move') {
      const chess = new Chess(state.fen);
      const isWhiteTurn = chess.turn() === 'w';
      const expectedUserId = isWhiteTurn ? state.whiteUserId : state.blackUserId;

      if (userId !== expectedUserId) {
        return { state, error: `It is not your turn (${chess.turn() === 'w' ? 'White' : 'Black'}'s turn).` };
      }

      const { from, to, promotion } = payload;
      if (!from || !to) {
        return { state, error: 'Move requires "from" and "to" squares.' };
      }

      try {
        const moveResult = chess.move({
          from,
          to,
          promotion: promotion || 'q'
        });

        if (!moveResult) {
          return { state, error: 'Illegal chess move.' };
        }

        // Track captured piece
        if (moveResult.captured) {
          const capturingColor = moveResult.color; // 'w' or 'b'
          state.capturedPieces[capturingColor].push(moveResult.captured);
        }

        state.fen = chess.fen();
        state.history.push(moveResult.san);
        state.lastMove = { from, to };
        state.drawOfferedBy = null; // Clear pending draw offer on move

        // Check end game states
        if (chess.isCheckmate()) {
          state.status = 'completed';
          state.winnerUserId = isWhiteTurn ? state.whiteUserId : state.blackUserId;
          state.statusReason = `Checkmate! ${isWhiteTurn ? state.whiteName : state.blackName} wins!`;
        } else if (chess.isDraw()) {
          state.status = 'completed';
          state.winnerUserId = null;
          if (chess.isStalemate()) {
            state.statusReason = 'Stalemate! Game is a draw.';
          } else if (chess.isThreefoldRepetition()) {
            state.statusReason = 'Draw by threefold repetition.';
          } else if (chess.isInsufficientMaterial()) {
            state.statusReason = 'Draw by insufficient material.';
          } else {
            state.statusReason = 'Draw by 50-move rule.';
          }
        }

        return { state };
      } catch (err: any) {
        return { state, error: err.message || 'Illegal chess move.' };
      }
    }

    return { state, error: 'Unknown chess action.' };
  }

  static sanitizeForPlayer(state: InternalChessState, _userId: string): ChessGameState & { statusReason?: string; drawOfferedBy: string | null; lastMove?: any } {
    const chess = new Chess(state.fen);
    return {
      fen: state.fen,
      turn: chess.turn(),
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
      winnerUserId: state.winnerUserId,
      whiteUserId: state.whiteUserId,
      blackUserId: state.blackUserId,
      history: state.history,
      capturedPieces: state.capturedPieces,
      status: state.status,
      statusReason: state.statusReason,
      drawOfferedBy: state.drawOfferedBy,
      lastMove: state.lastMove
    };
  }
}
