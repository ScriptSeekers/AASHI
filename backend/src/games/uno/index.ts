import { UnoCard, UnoColor, UnoValue, UnoGameState, UnoPublicPlayer } from '../../shared/index.js';

export interface InternalUnoState {
  players: {
    userId: string;
    name: string;
    hand: UnoCard[];
    calledUno: boolean;
  }[];
  drawPile: UnoCard[];
  discardPile: UnoCard[];
  currentColor: 'red' | 'blue' | 'green' | 'yellow';
  topCard: UnoCard;
  currentTurnIndex: number;
  direction: 1 | -1;
  drawCountPenalty: number;
  winnerUserId: string | null;
  status: 'playing' | 'completed';
  lastActionDescription?: string;
}

export function createUnoDeck(): UnoCard[] {
  const colors: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow'];
  const values: UnoValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
  const deck: UnoCard[] = [];
  let cardIdCounter = 1;

  for (const color of colors) {
    for (const val of values) {
      deck.push({ id: `c_${cardIdCounter++}`, color, value: val });
      if (val !== '0') {
        deck.push({ id: `c_${cardIdCounter++}`, color, value: val });
      }
    }
  }

  // 4 Wild and 4 Wild Draw 4
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c_${cardIdCounter++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `c_${cardIdCounter++}`, color: 'wild', value: 'wild4' });
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export class UnoGameEngine {
  static init(playerList: { userId: string; name: string }[]): InternalUnoState {
    const deck = createUnoDeck();
    const players = playerList.map(p => ({
      userId: p.userId,
      name: p.name,
      hand: [] as UnoCard[],
      calledUno: false
    }));

    // Deal 7 cards to each player
    for (let c = 0; c < 7; c++) {
      for (const p of players) {
        if (deck.length > 0) {
          p.hand.push(deck.pop()!);
        }
      }
    }

    // Find a valid non-wild starting card for the discard pile
    let topIndex = deck.length - 1;
    while (topIndex >= 0 && deck[topIndex].color === 'wild') {
      topIndex--;
    }
    const startingCard = topIndex >= 0 ? deck.splice(topIndex, 1)[0] : deck.pop()!;
    const currentColor = (startingCard.color === 'wild' ? 'red' : startingCard.color) as 'red' | 'blue' | 'green' | 'yellow';

    return {
      players,
      drawPile: deck,
      discardPile: [startingCard],
      topCard: startingCard,
      currentColor,
      currentTurnIndex: 0,
      direction: 1,
      drawCountPenalty: 0,
      winnerUserId: null,
      status: 'playing',
      lastActionDescription: `Game started! Top card is ${startingCard.color.toUpperCase()} ${startingCard.value}.`
    };
  }

  static refillDrawPileIfNeeded(state: InternalUnoState): void {
    if (state.drawPile.length === 0 && state.discardPile.length > 1) {
      const top = state.discardPile.pop()!;
      state.drawPile = [...state.discardPile];
      state.discardPile = [top];
      // Shuffle drawn cards
      for (let i = state.drawPile.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.drawPile[i], state.drawPile[j]] = [state.drawPile[j], state.drawPile[i]];
      }
    }
  }

  static advanceTurn(state: InternalUnoState, steps = 1): void {
    const n = state.players.length;
    let nextIndex = (state.currentTurnIndex + state.direction * steps) % n;
    if (nextIndex < 0) nextIndex += n;
    state.currentTurnIndex = nextIndex;
  }

  static isValidMove(card: UnoCard, topCard: UnoCard, currentColor: string): boolean {
    if (card.color === 'wild') return true;
    if (card.color === currentColor) return true;
    if (card.value === topCard.value) return true;
    return false;
  }

  static handleAction(
    state: InternalUnoState,
    userId: string,
    action: string,
    payload: any
  ): { state: InternalUnoState; error?: string } {
    if (state.status === 'completed') {
      return { state, error: 'Game is already completed.' };
    }

    const currentPlayer = state.players[state.currentTurnIndex];

    // CATCH UNO (can be triggered by an opponent at any time)
    if (action === 'catch_uno') {
      const targetUserId = payload.targetUserId;
      const targetPlayer = state.players.find(p => p.userId === targetUserId);
      if (!targetPlayer) return { state, error: 'Player not found.' };

      if (targetPlayer.hand.length === 1 && !targetPlayer.calledUno) {
        // Penalize target with 2 cards
        for (let i = 0; i < 2; i++) {
          this.refillDrawPileIfNeeded(state);
          if (state.drawPile.length > 0) {
            targetPlayer.hand.push(state.drawPile.pop()!);
          }
        }
        state.lastActionDescription = `${targetPlayer.name} was caught without declaring UNO! +2 cards penalty.`;
        return { state };
      }
      return { state, error: 'Player cannot be penalized.' };
    }

    // CALL UNO (triggered by player holding 1 card or playing down to 1 card)
    if (action === 'call_uno') {
      const p = state.players.find(pl => pl.userId === userId);
      if (p) {
        p.calledUno = true;
        state.lastActionDescription = `🔥 ${p.name} shouted UNO!`;
        return { state };
      }
      return { state, error: 'Player not found.' };
    }

    // Ensure it's player's turn for other actions
    if (currentPlayer.userId !== userId) {
      return { state, error: 'It is not your turn.' };
    }

    if (action === 'draw_card') {
      this.refillDrawPileIfNeeded(state);
      if (state.drawPile.length === 0) {
        return { state, error: 'Draw pile is empty.' };
      }
      const drawn = state.drawPile.pop()!;
      currentPlayer.hand.push(drawn);
      currentPlayer.calledUno = false; // Reset uno call if cards increased

      state.lastActionDescription = `${currentPlayer.name} drew a card.`;

      // In standard UNO, drawing passes the turn
      this.advanceTurn(state, 1);
      return { state };
    }

    if (action === 'play_card') {
      const { cardId, chosenColor } = payload;
      const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) {
        return { state, error: 'Card is not in your hand.' };
      }

      const card = currentPlayer.hand[cardIndex];
      if (!this.isValidMove(card, state.topCard, state.currentColor)) {
        return { state, error: 'Invalid move! Card must match color, number, or be a Wild.' };
      }

      // Check wild chosen color
      let newColor = card.color;
      if (card.color === 'wild') {
        if (!chosenColor || !['red', 'blue', 'green', 'yellow'].includes(chosenColor)) {
          return { state, error: 'Please choose a color for the wild card (red, blue, green, or yellow).' };
        }
        newColor = chosenColor;
      }

      // Remove card from hand
      currentPlayer.hand.splice(cardIndex, 1);
      state.discardPile.push(card);
      state.topCard = card;
      state.currentColor = newColor as any;

      state.lastActionDescription = `${currentPlayer.name} played ${card.color.toUpperCase()} ${card.value}${card.color === 'wild' ? ` (Color: ${chosenColor.toUpperCase()})` : ''}.`;

      // Check win condition
      if (currentPlayer.hand.length === 0) {
        state.status = 'completed';
        state.winnerUserId = currentPlayer.userId;
        state.lastActionDescription = `🏆 ${currentPlayer.name} won the UNO match!`;
        return { state };
      }

      // Apply card special actions
      if (card.value === 'skip') {
        state.lastActionDescription += ' Next player is skipped!';
        this.advanceTurn(state, 2);
      } else if (card.value === 'reverse') {
        if (state.players.length === 2) {
          // In 2-player UNO, reverse acts like a skip
          state.lastActionDescription += ' Turn reversed (acts as skip in 2-player)!';
          this.advanceTurn(state, 2);
        } else {
          state.direction = state.direction === 1 ? -1 : 1;
          state.lastActionDescription += ' Turn direction reversed!';
          this.advanceTurn(state, 1);
        }
      } else if (card.value === 'draw2') {
        const nextIndex = (state.currentTurnIndex + state.direction + state.players.length) % state.players.length;
        const victim = state.players[nextIndex];
        for (let i = 0; i < 2; i++) {
          this.refillDrawPileIfNeeded(state);
          if (state.drawPile.length > 0) victim.hand.push(state.drawPile.pop()!);
        }
        victim.calledUno = false;
        state.lastActionDescription += ` ${victim.name} draws 2 and is skipped!`;
        this.advanceTurn(state, 2);
      } else if (card.value === 'wild4') {
        const nextIndex = (state.currentTurnIndex + state.direction + state.players.length) % state.players.length;
        const victim = state.players[nextIndex];
        for (let i = 0; i < 4; i++) {
          this.refillDrawPileIfNeeded(state);
          if (state.drawPile.length > 0) victim.hand.push(state.drawPile.pop()!);
        }
        victim.calledUno = false;
        state.lastActionDescription += ` ${victim.name} draws 4 and is skipped!`;
        this.advanceTurn(state, 2);
      } else {
        this.advanceTurn(state, 1);
      }

      return { state };
    }

    return { state, error: 'Unknown action.' };
  }

  // Security: Sanitize for player so they NEVER see opponents' cards or the draw deck!
  static sanitizeForPlayer(state: InternalUnoState, userId: string): UnoGameState {
    const players: UnoPublicPlayer[] = state.players.map(p => ({
      userId: p.userId,
      name: p.name,
      cardCount: p.hand.length,
      calledUno: p.calledUno
    }));

    const myData = state.players.find(p => p.userId === userId);

    return {
      players,
      myHand: myData ? myData.hand : [],
      topCard: state.topCard,
      currentColor: state.currentColor,
      currentTurnIndex: state.currentTurnIndex,
      direction: state.direction,
      drawCountPenalty: state.drawCountPenalty,
      winnerUserId: state.winnerUserId,
      status: state.status,
      lastActionDescription: state.lastActionDescription
    };
  }
}
