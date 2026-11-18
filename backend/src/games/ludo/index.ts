import { LudoColor, LudoGameState, LudoPlayer, LudoToken } from '../../shared/index.js';

export interface InternalLudoState {
  players: LudoPlayer[];
  currentTurnIndex: number;
  diceValue: number | null;
  hasRolled: boolean;
  consecutiveSixes: number;
  winnerUserId: string | null;
  status: 'playing' | 'completed';
  lastLog?: string;
}

// Starting cell offsets on standard 52-cell track for 4 colors:
// Red starts at 0, Green starts at 13, Yellow starts at 26, Blue starts at 39
const COLOR_START_CELL: Record<LudoColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// Safe cells on standard 52-cell track: starting points (0, 13, 26, 39) + star spots (8, 21, 34, 47)
const SAFE_CELLS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export class LudoGameEngine {
  static init(playerList: { userId: string; name: string }[]): InternalLudoState {
    const colors: LudoColor[] = ['red', 'green', 'yellow', 'blue'];
    const players: LudoPlayer[] = playerList.slice(0, 4).map((p, idx) => ({
      userId: p.userId,
      name: p.name,
      color: colors[idx],
      tokens: [
        { id: 0, color: colors[idx], step: -1, isHome: false, isAtBase: true },
        { id: 1, color: colors[idx], step: -1, isHome: false, isAtBase: true },
        { id: 2, color: colors[idx], step: -1, isHome: false, isAtBase: true },
        { id: 3, color: colors[idx], step: -1, isHome: false, isAtBase: true }
      ],
      hasWon: false
    }));

    return {
      players,
      currentTurnIndex: 0,
      diceValue: null,
      hasRolled: false,
      consecutiveSixes: 0,
      winnerUserId: null,
      status: 'playing',
      lastLog: `Game started! ${players[0].name} (${players[0].color.toUpperCase()}) rolls first.`
    };
  }

  // Calculate global board cell (0-51) from color and token step (0-50)
  static getGlobalBoardCell(color: LudoColor, step: number): number | null {
    if (step < 0 || step > 50) return null; // In base or home column
    return (COLOR_START_CELL[color] + step) % 52;
  }

  static getMovableTokens(player: LudoPlayer, dice: number): number[] {
    const movable: number[] = [];
    for (const t of player.tokens) {
      if (t.isHome) continue;
      if (t.isAtBase) {
        if (dice === 6) movable.push(t.id);
      } else {
        // Can move if step + dice <= 56 (56 is home)
        if (t.step + dice <= 56) {
          movable.push(t.id);
        }
      }
    }
    return movable;
  }

  static advanceTurn(state: InternalLudoState): void {
    state.hasRolled = false;
    state.consecutiveSixes = 0;
    state.currentTurnIndex = (state.currentTurnIndex + 1) % state.players.length;
  }

  static handleAction(
    state: InternalLudoState,
    userId: string,
    action: string,
    payload: any
  ): { state: InternalLudoState; error?: string } {
    if (state.status === 'completed') {
      return { state, error: 'Game has already concluded.' };
    }

    const currentPlayer = state.players[state.currentTurnIndex];
    if (currentPlayer.userId !== userId) {
      return { state, error: `It is ${currentPlayer.name}'s turn.` };
    }

    // ROLL DICE
    if (action === 'roll_dice') {
      if (state.hasRolled) {
        return { state, error: 'You have already rolled the dice. Please select a token to move.' };
      }

      // Server-authoritative random dice 1 to 6
      const roll = Math.floor(Math.random() * 6) + 1;
      state.diceValue = roll;
      state.hasRolled = true;

      if (roll === 6) {
        state.consecutiveSixes += 1;
        // 3 consecutive sixes penalty rule: turn canceled
        if (state.consecutiveSixes >= 3) {
          state.lastLog = `${currentPlayer.name} rolled 3 consecutive sixes! Turn passed.`;
          this.advanceTurn(state);
          return { state };
        }
      } else {
        state.consecutiveSixes = 0;
      }

      const movable = this.getMovableTokens(currentPlayer, roll);
      state.lastLog = `${currentPlayer.name} rolled a ${roll}!`;

      // If no valid move exists, pass turn immediately
      if (movable.length === 0) {
        state.lastLog += ' No valid moves available.';
        this.advanceTurn(state);
      } else if (movable.length === 1 && currentPlayer.tokens[movable[0]].isAtBase && roll === 6) {
        // Auto-deploy base token if it's the only valid action
        return this.handleAction(state, userId, 'move_token', { tokenId: movable[0] });
      }

      return { state };
    }

    // MOVE TOKEN
    if (action === 'move_token') {
      if (!state.hasRolled || state.diceValue === null) {
        return { state, error: 'Please roll the dice first.' };
      }

      const tokenId = Number(payload.tokenId);
      const token = currentPlayer.tokens.find(t => t.id === tokenId);
      if (!token) {
        return { state, error: 'Token not found.' };
      }

      const movable = this.getMovableTokens(currentPlayer, state.diceValue);
      if (!movable.includes(tokenId)) {
        return { state, error: 'That token cannot make a legal move with this dice roll.' };
      }

      let capturedOpponent = false;

      if (token.isAtBase) {
        // Leaving base to start position
        token.isAtBase = false;
        token.step = 0;
        state.lastLog = `${currentPlayer.name} moved a token out of the base!`;
      } else {
        token.step += state.diceValue;
        if (token.step === 56) {
          token.isHome = true;
          state.lastLog = `🎉 ${currentPlayer.name}'s token reached HOME!`;
        } else {
          state.lastLog = `${currentPlayer.name} moved token ${token.id + 1} by ${state.diceValue} spaces.`;
        }
      }

      // Check capture on main board (step <= 50)
      if (!token.isHome && token.step <= 50) {
        const globalCell = this.getGlobalBoardCell(currentPlayer.color, token.step);
        if (globalCell !== null && !SAFE_CELLS.has(globalCell)) {
          // Check opponent tokens on same cell
          for (const opp of state.players) {
            if (opp.userId === currentPlayer.userId) continue;
            for (const oppToken of opp.tokens) {
              if (!oppToken.isAtBase && !oppToken.isHome && oppToken.step <= 50) {
                const oppGlobalCell = this.getGlobalBoardCell(opp.color, oppToken.step);
                if (oppGlobalCell === globalCell) {
                  // Capture opponent token!
                  oppToken.isAtBase = true;
                  oppToken.step = -1;
                  capturedOpponent = true;
                  state.lastLog += ` ⚔️ Captured ${opp.name}'s token back to base!`;
                }
              }
            }
          }
        }
      }

      // Check win condition (all 4 tokens home)
      const allHome = currentPlayer.tokens.every(t => t.isHome);
      if (allHome) {
        currentPlayer.hasWon = true;
        state.winnerUserId = currentPlayer.userId;
        state.status = 'completed';
        state.lastLog = `🏆 ${currentPlayer.name} has brought all tokens home and won the game!`;
        return { state };
      }

      // Extra turn if rolled 6 or captured opponent
      if (state.diceValue === 6 || capturedOpponent) {
        state.hasRolled = false;
        state.diceValue = null;
        state.lastLog += capturedOpponent ? ' Bonus roll for capture!' : ' Bonus roll for rolling a 6!';
      } else {
        this.advanceTurn(state);
      }

      return { state };
    }

    return { state, error: 'Unknown Ludo action.' };
  }

  static sanitizeForPlayer(state: InternalLudoState, _userId: string): LudoGameState {
    const currentPlayer = state.players[state.currentTurnIndex];
    let movable: number[] = [];
    if (state.hasRolled && state.diceValue !== null && currentPlayer) {
      movable = this.getMovableTokens(currentPlayer, state.diceValue);
    }

    return {
      players: state.players,
      currentTurnColor: currentPlayer?.color || 'red',
      diceValue: state.diceValue,
      hasRolled: state.hasRolled,
      canMoveTokens: movable,
      winnerUserId: state.winnerUserId,
      status: state.status,
      lastLog: state.lastLog
    };
  }
}
