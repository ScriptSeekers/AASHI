export interface QuickGameState {
  gameType: string;
  players: { userId: string; name: string }[];
  round: number;
  maxRounds: number;
  scores: Record<string, number>;
  data: Record<string, any>;
  status: 'playing' | 'completed';
  winnerUserId: string | null;
  lastMessage?: string;
}

export class QuickGamesEngine {
  static init(gameType: string, players: { userId: string; name: string }[]): QuickGameState {
    const p1 = players[0];
    const p2 = players[1] || players[0];
    const scores: Record<string, number> = { [p1.userId]: 0, [p2.userId]: 0 };

    let data: Record<string, any> = {};

    if (gameType === 'rock_paper_scissors') {
      data = { choices: {}, history: [] };
    } else if (gameType === 'coin_flip') {
      data = { choices: {}, flipResult: null };
    } else if (gameType === 'dice_duel') {
      data = { rolls: {} };
    } else if (gameType === 'memory_match') {
      // 16 cards (8 pairs)
      const symbols = ['💖', '💌', '🌹', '💍', '🎁', '✨', '🧁', '🥂'];
      const deck = [...symbols, ...symbols]
        .map((sym, id) => ({ id, sym, isMatched: false }))
        .sort(() => Math.random() - 0.5);
      data = { cards: deck, flippedIds: [], currentTurnUserId: p1.userId };
    } else if (gameType === 'reaction_race') {
      data = {
        signalTime: Date.now() + 2000 + Math.random() * 3000,
        taps: {} // userId -> reaction ms
      };
    } else if (gameType === 'guess_number') {
      data = {
        secretNumber: Math.floor(Math.random() * 100) + 1,
        guesses: [],
        currentTurnUserId: p1.userId
      };
    } else if (gameType === 'word_chain') {
      data = {
        words: ['love'],
        lastLetter: 'e',
        currentTurnUserId: p1.userId
      };
    } else if (gameType === 'fast_tap') {
      data = {
        taps: { [p1.userId]: 0, [p2.userId]: 0 },
        startTime: Date.now() + 2000,
        endTime: Date.now() + 12000 // 10 second battle
      };
    } else if (gameType === 'hangman') {
      const words = ['SWEETHEART', 'ROMANCE', 'CANDLELIGHT', 'AFFECTION', 'FOREVER', 'BUTTERFLIES'];
      const word = words[Math.floor(Math.random() * words.length)];
      data = {
        word,
        guessedLetters: [],
        remainingStrikes: 6
      };
    } else if (gameType === 'higher_lower') {
      data = {
        currentNumber: Math.floor(Math.random() * 90) + 10,
        streak: 0,
        predictions: {}
      };
    } else {
      data = { responses: {} };
    }

    return {
      gameType,
      players: [p1, p2],
      round: 1,
      maxRounds: gameType === 'rock_paper_scissors' ? 3 : 5,
      scores,
      data,
      status: 'playing',
      winnerUserId: null,
      lastMessage: `Started ${gameType}!`
    };
  }

  static handleAction(
    state: QuickGameState,
    userId: string,
    action: string,
    payload: any
  ): { state: QuickGameState; error?: string } {
    if (state.status === 'completed') {
      return { state, error: 'Match has ended.' };
    }

    // 1. ROCK PAPER SCISSORS
    if (state.gameType === 'rock_paper_scissors') {
      if (action === 'choose') {
        const choice = payload.choice; // 'rock' | 'paper' | 'scissors'
        if (!['rock', 'paper', 'scissors'].includes(choice)) {
          return { state, error: 'Invalid RPS choice.' };
        }
        state.data.choices[userId] = choice;

        // If both submitted, resolve round
        const uids = state.players.map(p => p.userId);
        if (state.data.choices[uids[0]] && state.data.choices[uids[1]]) {
          const c1 = state.data.choices[uids[0]];
          const c2 = state.data.choices[uids[1]];

          let roundWinner: string | null = null;
          if (c1 === c2) {
            state.lastMessage = `Both picked ${c1.toUpperCase()}! It's a draw!`;
          } else if (
            (c1 === 'rock' && c2 === 'scissors') ||
            (c1 === 'scissors' && c2 === 'paper') ||
            (c1 === 'paper' && c2 === 'rock')
          ) {
            roundWinner = uids[0];
            state.scores[uids[0]] += 1;
            state.lastMessage = `${state.players[0].name} wins this round! (${c1} beats ${c2})`;
          } else {
            roundWinner = uids[1];
            state.scores[uids[1]] += 1;
            state.lastMessage = `${state.players[1].name} wins this round! (${c2} beats ${c1})`;
          }

          state.data.history.push({ p1: c1, p2: c2, roundWinner });

          // Check Best of 3 / 5
          if (state.scores[uids[0]] >= 2 || state.scores[uids[1]] >= 2 || state.round >= state.maxRounds) {
            state.status = 'completed';
            state.winnerUserId = state.scores[uids[0]] > state.scores[uids[1]] ? uids[0] : (state.scores[uids[1]] > state.scores[uids[0]] ? uids[1] : null);
          } else {
            state.round += 1;
            state.data.choices = {};
          }
        }
        return { state };
      }
    }

    // 2. COIN FLIP
    if (state.gameType === 'coin_flip') {
      if (action === 'choose') {
        state.data.choices[userId] = payload.choice; // 'heads' | 'tails'
        const uids = state.players.map(p => p.userId);
        if (state.data.choices[uids[0]] && state.data.choices[uids[1]]) {
          const flip = Math.random() < 0.5 ? 'heads' : 'tails';
          state.data.flipResult = flip;
          for (const uid of uids) {
            if (state.data.choices[uid] === flip) state.scores[uid] += 1;
          }
          state.lastMessage = `Coin landed on ${flip.toUpperCase()}!`;
          if (state.round >= 3) {
            state.status = 'completed';
            state.winnerUserId = state.scores[uids[0]] > state.scores[uids[1]] ? uids[0] : (state.scores[uids[1]] > state.scores[uids[0]] ? uids[1] : null);
          } else {
            state.round += 1;
            state.data.choices = {};
          }
        }
        return { state };
      }
    }

    // 3. DICE DUEL
    if (state.gameType === 'dice_duel') {
      if (action === 'roll') {
        state.data.rolls[userId] = Math.floor(Math.random() * 6) + 1;
        const uids = state.players.map(p => p.userId);
        if (state.data.rolls[uids[0]] && state.data.rolls[uids[1]]) {
          const r1 = state.data.rolls[uids[0]];
          const r2 = state.data.rolls[uids[1]];
          if (r1 > r2) {
            state.scores[uids[0]] += 1;
            state.lastMessage = `${state.players[0].name} rolled ${r1} vs ${r2}! Winner!`;
          } else if (r2 > r1) {
            state.scores[uids[1]] += 1;
            state.lastMessage = `${state.players[1].name} rolled ${r2} vs ${r1}! Winner!`;
          } else {
            state.lastMessage = `Tie roll! Both rolled ${r1}!`;
          }

          if (state.round >= 3) {
            state.status = 'completed';
            state.winnerUserId = state.scores[uids[0]] > state.scores[uids[1]] ? uids[0] : (state.scores[uids[1]] > state.scores[uids[0]] ? uids[1] : null);
          } else {
            state.round += 1;
            state.data.rolls = {};
          }
        }
        return { state };
      }
    }

    // 4. MEMORY MATCH
    if (state.gameType === 'memory_match') {
      if (action === 'flip_card') {
        if (state.data.currentTurnUserId !== userId) return { state, error: 'Not your turn.' };
        const cardId = Number(payload.cardId);
        const card = state.data.cards.find((c: any) => c.id === cardId);
        if (!card || card.isMatched || state.data.flippedIds.includes(cardId)) {
          return { state, error: 'Cannot flip this card.' };
        }

        state.data.flippedIds.push(cardId);
        if (state.data.flippedIds.length === 2) {
          const [id1, id2] = state.data.flippedIds;
          const c1 = state.data.cards.find((c: any) => c.id === id1);
          const c2 = state.data.cards.find((c: any) => c.id === id2);

          if (c1.sym === c2.sym) {
            c1.isMatched = true;
            c2.isMatched = true;
            state.scores[userId] += 1;
            state.data.flippedIds = [];
            state.lastMessage = `Match found! +1 point!`;

            // Check if all matched
            if (state.data.cards.every((c: any) => c.isMatched)) {
              state.status = 'completed';
              const uids = state.players.map(p => p.userId);
              state.winnerUserId = state.scores[uids[0]] > state.scores[uids[1]] ? uids[0] : uids[1];
            }
          } else {
            // No match -> switch turn after brief delay
            const nextUserId = state.players.find(p => p.userId !== userId)!.userId;
            state.data.currentTurnUserId = nextUserId;
            state.data.flippedIds = [];
            state.lastMessage = 'No match! Turn passed.';
          }
        }
        return { state };
      }
    }

    // 5. REACTION RACE
    if (state.gameType === 'reaction_race') {
      if (action === 'tap') {
        const now = Date.now();
        if (now < state.data.signalTime) {
          // False start penalty!
          state.data.taps[userId] = -1; // foul
          state.lastMessage = `False start! Tapped too early!`;
        } else {
          const reactionTime = now - state.data.signalTime;
          state.data.taps[userId] = reactionTime;
          state.lastMessage = `${state.players.find(p => p.userId === userId)?.name} reacted in ${reactionTime}ms!`;
        }

        const uids = state.players.map(p => p.userId);
        if (state.data.taps[uids[0]] !== undefined && state.data.taps[uids[1]] !== undefined) {
          const t1 = state.data.taps[uids[0]];
          const t2 = state.data.taps[uids[1]];

          let winner: string | null = null;
          if (t1 > 0 && (t2 <= 0 || t1 < t2)) winner = uids[0];
          else if (t2 > 0 && (t1 <= 0 || t2 < t1)) winner = uids[1];

          state.status = 'completed';
          state.winnerUserId = winner;
        }
        return { state };
      }
    }

    // 6. GUESS THE NUMBER
    if (state.gameType === 'guess_number') {
      if (action === 'guess') {
        if (state.data.currentTurnUserId !== userId) return { state, error: 'Not your turn.' };
        const guess = Number(payload.guess);
        const secret = state.data.secretNumber;

        let hint = 'CORRECT';
        if (guess > secret) hint = 'LOWER';
        else if (guess < secret) hint = 'HIGHER';

        state.data.guesses.push({ userId, guess, hint });

        if (guess === secret) {
          state.status = 'completed';
          state.winnerUserId = userId;
          state.lastMessage = `🎉 Correct! The secret number was ${secret}!`;
        } else {
          state.lastMessage = `Guessed ${guess}: Go ${hint}!`;
          const nextUserId = state.players.find(p => p.userId !== userId)!.userId;
          state.data.currentTurnUserId = nextUserId;
        }
        return { state };
      }
    }

    // 7. FAST TAP BATTLE
    if (state.gameType === 'fast_tap') {
      if (action === 'tap') {
        state.data.taps[userId] = (state.data.taps[userId] || 0) + 1;
        if (Date.now() >= state.data.endTime) {
          state.status = 'completed';
          const uids = state.players.map(p => p.userId);
          const t1 = state.data.taps[uids[0]] || 0;
          const t2 = state.data.taps[uids[1]] || 0;
          state.winnerUserId = t1 > t2 ? uids[0] : (t2 > t1 ? uids[1] : null);
          state.lastMessage = `Time's up! Result: ${t1} vs ${t2} taps!`;
        }
        return { state };
      }
    }

    // 8. HANGMAN
    if (state.gameType === 'hangman') {
      if (action === 'guess_letter') {
        const letter = String(payload.letter).toUpperCase();
        if (state.data.guessedLetters.includes(letter)) {
          return { state, error: 'Letter already guessed.' };
        }
        state.data.guessedLetters.push(letter);
        if (!state.data.word.includes(letter)) {
          state.data.remainingStrikes -= 1;
        }

        // Check word complete
        const allGuessed = state.data.word.split('').every((l: string) => state.data.guessedLetters.includes(l));
        if (allGuessed) {
          state.status = 'completed';
          state.winnerUserId = userId;
          state.lastMessage = `Victory! The romantic word was ${state.data.word}!`;
        } else if (state.data.remainingStrikes <= 0) {
          state.status = 'completed';
          state.winnerUserId = null;
          state.lastMessage = `Out of hearts! The word was ${state.data.word}.`;
        }
        return { state };
      }
    }

    // 9. WORD CHAIN
    if (state.gameType === 'word_chain') {
      if (action === 'submit_word') {
        if (state.data.currentTurnUserId !== userId) return { state, error: 'Not your turn.' };
        const word = String(payload.word).trim().toLowerCase();
        if (word.length < 2) return { state, error: 'Word too short.' };
        if (state.data.words.includes(word)) return { state, error: 'Word already used!' };
        if (word[0] !== state.data.lastLetter) {
          return { state, error: `Word must start with letter "${state.data.lastLetter.toUpperCase()}"!` };
        }

        state.data.words.push(word);
        state.data.lastLetter = word[word.length - 1];
        state.scores[userId] += 1;
        state.lastMessage = `"${word.toUpperCase()}" accepted! Next word begins with "${state.data.lastLetter.toUpperCase()}".`;

        const nextUserId = state.players.find(p => p.userId !== userId)!.userId;
        state.data.currentTurnUserId = nextUserId;
        return { state };
      }
    }

    return { state, error: 'Unknown quick game action.' };
  }

  // Security: In games like RPS, hide opponent choice until both reveal!
  static sanitizeForPlayer(state: QuickGameState, userId: string): QuickGameState {
    if (state.gameType === 'rock_paper_scissors') {
      const uids = state.players.map(p => p.userId);
      const bothDone = state.data.choices[uids[0]] && state.data.choices[uids[1]];
      if (!bothDone) {
        const maskedChoices: Record<string, any> = {};
        for (const [uid, choice] of Object.entries(state.data.choices)) {
          if (uid === userId) maskedChoices[uid] = choice;
          else maskedChoices[uid] = 'HIDDEN';
        }
        return {
          ...state,
          data: {
            ...state.data,
            choices: maskedChoices
          }
        };
      }
    }

    return state;
  }
}
