export interface TicTacToeState {
  board: (string | null)[]; // 9 cells
  players: { userId: string; name: string; symbol: 'X' | 'O' }[];
  currentTurnUserId: string;
  winnerUserId: string | null;
  isDraw: boolean;
  status: 'playing' | 'completed';
}

export class TicTacToeEngine {
  static init(players: { userId: string; name: string }[]): TicTacToeState {
    const p1 = players[0];
    const p2 = players[1] || players[0];

    return {
      board: Array(9).fill(null),
      players: [
        { userId: p1.userId, name: p1.name, symbol: 'X' },
        { userId: p2.userId, name: p2.name, symbol: 'O' }
      ],
      currentTurnUserId: p1.userId,
      winnerUserId: null,
      isDraw: false,
      status: 'playing'
    };
  }

  static checkWinner(board: (string | null)[]): string | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  static handleAction(state: TicTacToeState, userId: string, action: string, payload: any): { state: TicTacToeState; error?: string } {
    if (state.status === 'completed') {
      return { state, error: 'Game is over.' };
    }

    if (action === 'move') {
      if (state.currentTurnUserId !== userId) {
        return { state, error: 'It is not your turn.' };
      }

      const cellIndex = Number(payload.index);
      if (cellIndex < 0 || cellIndex > 8 || state.board[cellIndex] !== null) {
        return { state, error: 'Invalid or occupied cell.' };
      }

      const player = state.players.find(p => p.userId === userId)!;
      state.board[cellIndex] = player.symbol;

      const winningSymbol = this.checkWinner(state.board);
      if (winningSymbol) {
        state.status = 'completed';
        state.winnerUserId = userId;
        return { state };
      }

      if (state.board.every(cell => cell !== null)) {
        state.status = 'completed';
        state.isDraw = true;
        return { state };
      }

      const nextPlayer = state.players.find(p => p.userId !== userId)!;
      state.currentTurnUserId = nextPlayer.userId;
      return { state };
    }

    return { state, error: 'Unknown action.' };
  }
}

// ----------------- CONNECT FOUR -----------------
export interface ConnectFourState {
  grid: (string | null)[][]; // 6 rows x 7 cols
  players: { userId: string; name: string; color: 'pink' | 'lavender' }[];
  currentTurnUserId: string;
  winnerUserId: string | null;
  isDraw: boolean;
  status: 'playing' | 'completed';
}

export class ConnectFourEngine {
  static init(players: { userId: string; name: string }[]): ConnectFourState {
    const p1 = players[0];
    const p2 = players[1] || players[0];
    // 6 rows, 7 cols
    const grid = Array(6).fill(null).map(() => Array(7).fill(null));

    return {
      grid,
      players: [
        { userId: p1.userId, name: p1.name, color: 'pink' },
        { userId: p2.userId, name: p2.name, color: 'lavender' }
      ],
      currentTurnUserId: p1.userId,
      winnerUserId: null,
      isDraw: false,
      status: 'playing'
    };
  }

  static checkWin(grid: (string | null)[][], row: number, col: number, color: string): boolean {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1]   // diagonal down-left
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      // forward
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && grid[r][c] === color) {
        count++;
        r += dr;
        c += dc;
      }
      // backward
      r = row - dr;
      c = col - dc;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && grid[r][c] === color) {
        count++;
        r -= dr;
        c -= dc;
      }
      if (count >= 4) return true;
    }
    return false;
  }

  static handleAction(state: ConnectFourState, userId: string, action: string, payload: any): { state: ConnectFourState; error?: string } {
    if (state.status === 'completed') {
      return { state, error: 'Game is over.' };
    }

    if (action === 'drop') {
      if (state.currentTurnUserId !== userId) {
        return { state, error: 'Not your turn.' };
      }

      const col = Number(payload.col);
      if (col < 0 || col >= 7) {
        return { state, error: 'Invalid column.' };
      }

      // Find lowest available row in column
      let targetRow = -1;
      for (let r = 5; r >= 0; r--) {
        if (state.grid[r][col] === null) {
          targetRow = r;
          break;
        }
      }

      if (targetRow === -1) {
        return { state, error: 'Column is full.' };
      }

      const player = state.players.find(p => p.userId === userId)!;
      state.grid[targetRow][col] = player.color;

      if (this.checkWin(state.grid, targetRow, col, player.color)) {
        state.status = 'completed';
        state.winnerUserId = userId;
        return { state };
      }

      // Check board full draw
      let isFull = true;
      for (let c = 0; c < 7; c++) {
        if (state.grid[0][c] === null) {
          isFull = false;
          break;
        }
      }

      if (isFull) {
        state.status = 'completed';
        state.isDraw = true;
        return { state };
      }

      const nextPlayer = state.players.find(p => p.userId !== userId)!;
      state.currentTurnUserId = nextPlayer.userId;
      return { state };
    }

    return { state, error: 'Unknown action.' };
  }
}

// ----------------- CHECKERS -----------------
export interface CheckerPiece {
  id: string;
  playerIndex: 0 | 1;
  isKing: boolean;
  row: number;
  col: number;
}

export interface CheckersState {
  pieces: CheckerPiece[];
  players: { userId: string; name: string }[];
  currentTurnIndex: 0 | 1;
  winnerUserId: string | null;
  status: 'playing' | 'completed';
  lastMove?: any;
}

export class CheckersEngine {
  static init(players: { userId: string; name: string }[]): CheckersState {
    const p1 = players[0];
    const p2 = players[1] || players[0];
    const pieces: CheckerPiece[] = [];
    let idCounter = 1;

    // Player 0 starts at top (rows 0, 1, 2)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          pieces.push({ id: `p0_${idCounter++}`, playerIndex: 0, isKing: false, row: r, col: c });
        }
      }
    }

    // Player 1 starts at bottom (rows 5, 6, 7)
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          pieces.push({ id: `p1_${idCounter++}`, playerIndex: 1, isKing: false, row: r, col: c });
        }
      }
    }

    return {
      pieces,
      players: [
        { userId: p1.userId, name: p1.name },
        { userId: p2.userId, name: p2.name }
      ],
      currentTurnIndex: 1, // Player 1 (bottom) moves first
      winnerUserId: null,
      status: 'playing'
    };
  }

  static handleAction(state: CheckersState, userId: string, action: string, payload: any): { state: CheckersState; error?: string } {
    if (state.status === 'completed') {
      return { state, error: 'Game is already completed.' };
    }

    const currentP = state.players[state.currentTurnIndex];
    if (currentP.userId !== userId) {
      return { state, error: 'Not your turn.' };
    }

    if (action === 'move') {
      const { pieceId, toRow, toCol } = payload;
      const piece = state.pieces.find(p => p.id === pieceId);
      if (!piece || piece.playerIndex !== state.currentTurnIndex) {
        return { state, error: 'Invalid piece.' };
      }

      if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
        return { state, error: 'Target position off board.' };
      }

      if ((toRow + toCol) % 2 === 0) {
        return { state, error: 'Must move on dark squares.' };
      }

      const occupant = state.pieces.find(p => p.row === toRow && p.col === toCol);
      if (occupant) {
        return { state, error: 'Target square is occupied.' };
      }

      const rowDiff = toRow - piece.row;
      const colDiff = Math.abs(toCol - piece.col);

      // Direction check (unless King, player 0 moves down (+), player 1 moves up (-))
      const isForward = piece.playerIndex === 0 ? rowDiff > 0 : rowDiff < 0;
      if (!piece.isKing && !isForward) {
        return { state, error: 'Regular pieces can only move forward.' };
      }

      // Normal single step diagonal move
      if (Math.abs(rowDiff) === 1 && colDiff === 1) {
        piece.row = toRow;
        piece.col = toCol;
      }
      // Jump/capture move
      else if (Math.abs(rowDiff) === 2 && colDiff === 2) {
        const jumpedRow = piece.row + rowDiff / 2;
        const jumpedCol = piece.col + (toCol - piece.col) / 2;
        const jumpedIndex = state.pieces.findIndex(p => p.row === jumpedRow && p.col === jumpedCol);

        if (jumpedIndex === -1 || state.pieces[jumpedIndex].playerIndex === piece.playerIndex) {
          return { state, error: 'Invalid jump. Must jump over opponent piece.' };
        }

        // Remove jumped piece
        state.pieces.splice(jumpedIndex, 1);
        piece.row = toRow;
        piece.col = toCol;
      } else {
        return { state, error: 'Illegal move distance.' };
      }

      // King promotion
      if (piece.playerIndex === 0 && piece.row === 7) piece.isKing = true;
      if (piece.playerIndex === 1 && piece.row === 0) piece.isKing = true;

      // Check win condition (all opponent pieces captured)
      const oppIndex = state.currentTurnIndex === 0 ? 1 : 0;
      const oppPieces = state.pieces.filter(p => p.playerIndex === oppIndex);
      if (oppPieces.length === 0) {
        state.status = 'completed';
        state.winnerUserId = currentP.userId;
        return { state };
      }

      // Switch turn
      state.currentTurnIndex = oppIndex;
      state.lastMove = { from: { row: piece.row, col: piece.col }, to: { row: toRow, col: toCol } };
      return { state };
    }

    return { state, error: 'Unknown checkers action.' };
  }
}
