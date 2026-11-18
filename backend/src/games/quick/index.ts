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

export const EMOJI_PUZZLES = [
  { emojis: '🚢 ❄️ 🌊 💔', answer: 'titanic', title: 'Titanic', clue: 'Legendary romantic movie' },
  { emojis: '🌹 🥀 ⏰ 🏰', answer: 'beauty and the beast', title: 'Beauty and the Beast', clue: 'Disney fairytale romance' },
  { emojis: '🦁 👑 🌅 🐾', answer: 'the lion king', title: 'The Lion King', clue: 'Animated kingdom classic' },
  { emojis: '👰 💍 💒 💐', answer: 'wedding', title: 'Wedding Day', clue: 'A couple milestone' },
  { emojis: '💌 📮 🕊️ ✍️', answer: 'love letter', title: 'Love Letter', clue: 'Handwritten romantic notes' },
  { emojis: '🍝 🐶 🐕 💋', answer: 'lady and the tramp', title: 'Lady and the Tramp', clue: 'Famous spaghetti kiss' },
  { emojis: '🌙 🔭 ✨ 🌌', answer: 'stargazing', title: 'Stargazing Date', clue: 'Romantic nighttime activity' },
  { emojis: '☕ 🥐 🗼 🥖', answer: 'paris', title: 'Paris Trip', clue: 'City of love' }
];

export const QUIZ_QUESTIONS = [
  {
    question: 'Which hormone is known worldwide as the "Love & Bonding Hormone"?',
    options: ['Oxytocin', 'Dopamine', 'Serotonin', 'Melatonin'],
    correctIndex: 0
  },
  {
    question: 'What traditional milestone gift represents the 1st wedding anniversary?',
    options: ['Paper', 'Cotton', 'Wood', 'Silver'],
    correctIndex: 0
  },
  {
    question: 'In Romeo and Juliet, in which Italian city does the legendary romance take place?',
    options: ['Verona', 'Venice', 'Florence', 'Rome'],
    correctIndex: 0
  },
  {
    question: 'What flower is universally celebrated as the symbol of deep love and devotion?',
    options: ['Red Rose', 'White Lily', 'Pink Tulip', 'Sunflower'],
    correctIndex: 0
  },
  {
    question: 'Which civilization was the very first to exchange wedding rings as a circle of eternity?',
    options: ['Ancient Egypt', 'Ancient Greece', 'Roman Empire', 'Mesopotamia'],
    correctIndex: 0
  }
];

export const WHEEL_SECTORS = [
  'Give your partner a relaxing 30s neck massage 💆',
  'Steal a surprise sweet kiss right now 💋',
  'Cook your partner breakfast in bed tomorrow 🍳',
  'Sing a romantic chorus with full passion 🎤',
  'Whisper 3 sweet compliments into their ear 👂',
  'Partner gets to pick tonight\'s date or movie 🎬',
  'Give a warm, tight 1-minute bear hug 🤗',
  'Grant your partner one free romantic wish ✨'
];

export const GUESS_PROMPTS = [
  'What is my absolute favorite comfort food on a cozy night in?',
  'If we could board a flight to any dream destination right now, where would I choose?',
  'What was my very first impression when I saw you for the first time?',
  'Am I more of an early sunrise bird or a 3 AM midnight owl?',
  'What is one sweet habit of mine that never fails to make you smile?'
];

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
      const words = ['SWEETHEART', 'ROMANCE', 'CANDLELIGHT', 'AFFECTION', 'FOREVER', 'BUTTERFLIES', 'KISSES', 'PASSION'];
      const word = words[Math.floor(Math.random() * words.length)];
      data = {
        word,
        guessedLetters: [],
        remainingStrikes: 6,
        currentTurnUserId: p1.userId
      };
    } else if (gameType === 'higher_lower') {
      data = {
        currentNumber: Math.floor(Math.random() * 90) + 10,
        nextNumber: null,
        streak: 0,
        history: [],
        currentTurnUserId: p1.userId
      };
    } else if (gameType === 'emoji_guess') {
      data = {
        puzzles: EMOJI_PUZZLES,
        puzzleIndex: 0,
        guesses: [],
        currentTurnUserId: p1.userId
      };
    } else if (gameType === 'quick_quiz') {
      data = {
        questions: QUIZ_QUESTIONS,
        questionIndex: 0,
        answers: {}
      };
    } else if (gameType === 'spin_wheel') {
      data = {
        sectors: WHEEL_SECTORS,
        selectedSector: null,
        selectedIndex: null,
        spunBy: null,
        currentTurnUserId: p1.userId,
        spinHistory: []
      };
    } else if (gameType === 'guess_my_answer') {
      data = {
        prompts: GUESS_PROMPTS,
        promptIndex: 0,
        subjectUserId: p1.userId,
        guesserUserId: p2.userId,
        secretAnswer: null,
        guessedAnswer: null,
        isRevealed: false
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
      lastMessage: `Started ${gameType.replace(/_/g, ' ')}!`
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

    const uids = state.players.map(p => p.userId);

    // 1. ROCK PAPER SCISSORS
    if (state.gameType === 'rock_paper_scissors') {
      if (action === 'choose') {
        const choice = payload.choice; // 'rock' | 'paper' | 'scissors'
        if (!['rock', 'paper', 'scissors'].includes(choice)) {
          return { state, error: 'Invalid RPS choice.' };
        }
        state.data.choices[userId] = choice;

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
        if (state.data.rolls[uids[0]] && state.data.rolls[uids[1]]) {
          const r1 = state.data.rolls[uids[0]];
          const r2 = state.data.rolls[uids[1]];
          if (r1 > r2) {
            state.scores[uids[0]] += 1;
            state.lastMessage = `${state.players[0].name} rolled ${r1} vs ${r2}! Round Winner!`;
          } else if (r2 > r1) {
            state.scores[uids[1]] += 1;
            state.lastMessage = `${state.players[1].name} rolled ${r2} vs ${r1}! Round Winner!`;
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
            state.lastMessage = `Match found! ${c1.sym} +1 point!`;

            if (state.data.cards.every((c: any) => c.isMatched)) {
              state.status = 'completed';
              state.winnerUserId = state.scores[uids[0]] > state.scores[uids[1]] ? uids[0] : (state.scores[uids[1]] > state.scores[uids[0]] ? uids[1] : null);
            }
          } else {
            const nextUserId = state.players.find(p => p.userId !== userId)!.userId;
            state.data.currentTurnUserId = nextUserId;
            state.lastMessage = 'No match! Turn passed.';
          }
        }
        return { state };
      }

      if (action === 'reset_flipped') {
        state.data.flippedIds = [];
        return { state };
      }
    }

    // 5. REACTION RACE
    if (state.gameType === 'reaction_race') {
      if (action === 'tap') {
        const now = Date.now();
        if (now < state.data.signalTime) {
          state.data.taps[userId] = -1; // false start
          state.lastMessage = `False start! Tapped too early!`;
        } else {
          const reactionTime = now - state.data.signalTime;
          state.data.taps[userId] = reactionTime;
          state.lastMessage = `${state.players.find(p => p.userId === userId)?.name} reacted in ${reactionTime}ms!`;
        }

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
          state.scores[userId] += 1;
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
        if (state.data.currentTurnUserId && state.data.currentTurnUserId !== userId) {
          return { state, error: 'Not your turn.' };
        }
        const letter = String(payload.letter).toUpperCase();
        if (state.data.guessedLetters.includes(letter)) {
          return { state, error: 'Letter already guessed.' };
        }
        state.data.guessedLetters.push(letter);
        const inWord = state.data.word.includes(letter);
        if (!inWord) {
          state.data.remainingStrikes -= 1;
        } else {
          state.scores[userId] += 1;
        }

        const allGuessed = state.data.word.split('').every((l: string) => state.data.guessedLetters.includes(l));
        if (allGuessed) {
          state.status = 'completed';
          state.winnerUserId = userId;
          state.lastMessage = `Victory! The romantic word was ${state.data.word}!`;
        } else if (state.data.remainingStrikes <= 0) {
          state.status = 'completed';
          state.winnerUserId = null;
          state.lastMessage = `Out of hearts! The word was ${state.data.word}.`;
        } else {
          // Switch turn
          const nextUserId = state.players.find(p => p.userId !== userId)!.userId;
          state.data.currentTurnUserId = nextUserId;
          state.lastMessage = inWord ? `Good guess! "${letter}" is in the word!` : `"${letter}" is not in the word! -1 Heart.`;
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

    // 10. HIGHER OR LOWER
    if (state.gameType === 'higher_lower') {
      if (action === 'predict') {
        if (state.data.currentTurnUserId !== userId) return { state, error: 'Not your turn.' };
        const prediction = payload.prediction; // 'higher' | 'lower'
        if (prediction !== 'higher' && prediction !== 'lower') {
          return { state, error: 'Prediction must be "higher" or "lower".' };
        }

        let nextNumber = Math.floor(Math.random() * 90) + 10;
        if (nextNumber === state.data.currentNumber) {
          nextNumber = nextNumber < 90 ? nextNumber + 1 : nextNumber - 1;
        }

        const isCorrect = (prediction === 'higher' && nextNumber > state.data.currentNumber) ||
                          (prediction === 'lower' && nextNumber < state.data.currentNumber);

        if (isCorrect) {
          state.scores[userId] += 1;
          state.data.streak += 1;
          state.lastMessage = `Correct! ${nextNumber} was ${prediction.toUpperCase()} than ${state.data.currentNumber}! Streak: ${state.data.streak}`;
        } else {
          state.data.streak = 0;
          state.lastMessage = `Wrong! ${nextNumber} was not ${prediction.toUpperCase()} than ${state.data.currentNumber}! Streak reset.`;
        }

        state.data.history.push({
          prev: state.data.currentNumber,
          next: nextNumber,
          prediction,
          isCorrect,
          userId
        });

        state.data.currentNumber = nextNumber;
        state.data.nextNumber = nextNumber;

        // Advance turn and round
        const nextUserId = state.players.find(p => p.userId !== userId)!.userId;
        state.data.currentTurnUserId = nextUserId;
        state.round += 1;

        if (state.round > state.maxRounds || state.scores[userId] >= 3) {
          state.status = 'completed';
          state.winnerUserId = state.scores[uids[0]] > state.scores[uids[1]] ? uids[0] : (state.scores[uids[1]] > state.scores[uids[0]] ? uids[1] : null);
        }

        return { state };
      }
    }

    // 11. EMOJI GUESS (Emoji Riddle Battle)
    if (state.gameType === 'emoji_guess') {
      if (action === 'guess_emoji') {
        if (state.data.currentTurnUserId !== userId) return { state, error: 'Not your turn.' };
        const guess = String(payload.guess || '').trim().toLowerCase();
        const puzzle = state.data.puzzles[state.data.puzzleIndex];
        if (!puzzle) {
          state.status = 'completed';
          return { state };
        }

        const isMatch = guess === puzzle.answer.toLowerCase() ||
                        guess === puzzle.title.toLowerCase() ||
                        puzzle.title.toLowerCase().includes(guess);

        if (isMatch && guess.length >= 3) {
          state.scores[userId] += 1;
          state.lastMessage = `🎉 ${state.players.find(p => p.userId === userId)?.name} solved it! "${puzzle.title}" (+1 pt)`;
          state.data.puzzleIndex += 1;

          if (state.data.puzzleIndex >= Math.min(5, state.data.puzzles.length)) {
            state.status = 'completed';
            state.winnerUserId = state.scores[uids[0]] > state.scores[uids[1]] ? uids[0] : (state.scores[uids[1]] > state.scores[uids[0]] ? uids[1] : null);
          }
        } else {
          state.lastMessage = `"${payload.guess}" was incorrect. Turn passed!`;
          const nextUserId = state.players.find(p => p.userId !== userId)!.userId;
          state.data.currentTurnUserId = nextUserId;
        }

        return { state };
      }
    }

    // 12. QUICK QUIZ BATTLE
    if (state.gameType === 'quick_quiz') {
      if (action === 'answer_quiz') {
        const optionIndex = Number(payload.optionIndex);
        state.data.answers[userId] = optionIndex;

        // If both answered, evaluate
        if (state.data.answers[uids[0]] !== undefined && state.data.answers[uids[1]] !== undefined) {
          const q = state.data.questions[state.data.questionIndex];
          const correctIdx = q.correctIndex;

          for (const uid of uids) {
            if (state.data.answers[uid] === correctIdx) {
              state.scores[uid] += 1;
            }
          }

          state.lastMessage = `Correct answer was "${q.options[correctIdx]}"!`;
          state.data.questionIndex += 1;
          state.data.answers = {};

          if (state.data.questionIndex >= state.data.questions.length) {
            state.status = 'completed';
            state.winnerUserId = state.scores[uids[0]] > state.scores[uids[1]] ? uids[0] : (state.scores[uids[1]] > state.scores[uids[0]] ? uids[1] : null);
          }
        } else {
          state.lastMessage = `${state.players.find(p => p.userId === userId)?.name} locked in an answer! Waiting for partner...`;
        }

        return { state };
      }
    }

    // 13. SPIN THE WHEEL
    if (state.gameType === 'spin_wheel') {
      if (action === 'spin') {
        if (state.data.currentTurnUserId !== userId) return { state, error: 'Not your turn.' };
        const sectorIndex = Math.floor(Math.random() * state.data.sectors.length);
        const sector = state.data.sectors[sectorIndex];

        state.data.selectedIndex = sectorIndex;
        state.data.selectedSector = sector;
        state.data.spunBy = userId;
        state.scores[userId] += 1;
        state.lastMessage = `🎡 The wheel landed on: "${sector}"!`;

        state.data.spinHistory.push({ userId, sector, round: state.round });

        const nextUserId = state.players.find(p => p.userId !== userId)!.userId;
        state.data.currentTurnUserId = nextUserId;
        state.round += 1;

        if (state.round > 4) {
          state.status = 'completed';
          state.winnerUserId = null; // Fun non-zero-sum couple game
        }

        return { state };
      }
    }

    // 14. GUESS MY ANSWER
    if (state.gameType === 'guess_my_answer') {
      if (action === 'set_secret') {
        if (state.data.subjectUserId !== userId) return { state, error: 'Only the prompt subject can write the secret answer.' };
        state.data.secretAnswer = String(payload.answer || '').trim();
        state.lastMessage = `${state.players.find(p => p.userId === userId)?.name} locked in their secret answer! Partner, can you guess it?`;
        return { state };
      }

      if (action === 'guess_answer') {
        if (state.data.guesserUserId !== userId) return { state, error: 'Only the guesser can submit a guess.' };
        if (!state.data.secretAnswer) return { state, error: 'Partner has not set their secret answer yet.' };

        const guess = String(payload.guess || '').trim();
        state.data.guessedAnswer = guess;
        state.data.isRevealed = true;

        const secretNorm = state.data.secretAnswer.toLowerCase();
        const guessNorm = guess.toLowerCase();
        const isMatch = secretNorm === guessNorm || secretNorm.includes(guessNorm) || guessNorm.includes(secretNorm);

        if (isMatch) {
          state.scores[userId] += 1;
          state.scores[state.data.subjectUserId] += 1;
          state.lastMessage = `💖 Perfect synchronization! Both answers matched: "${state.data.secretAnswer}"! (+1 pt each)`;
        } else {
          state.lastMessage = `Revealed! Secret was "${state.data.secretAnswer}" vs Guess "${guess}". Loved the thought!`;
        }

        return { state };
      }

      if (action === 'next_prompt') {
        state.data.promptIndex += 1;
        // Swap roles
        const temp = state.data.subjectUserId;
        state.data.subjectUserId = state.data.guesserUserId;
        state.data.guesserUserId = temp;
        state.data.secretAnswer = null;
        state.data.guessedAnswer = null;
        state.data.isRevealed = false;
        state.round += 1;

        if (state.data.promptIndex >= Math.min(4, state.data.prompts.length)) {
          state.status = 'completed';
          state.winnerUserId = state.scores[uids[0]] > state.scores[uids[1]] ? uids[0] : (state.scores[uids[1]] > state.scores[uids[0]] ? uids[1] : null);
        }

        return { state };
      }
    }

    return { state, error: 'Unknown quick game action.' };
  }

  // Security: In games like RPS and Memory Match and Guess My Answer, sanitize hidden secrets!
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

    if (state.gameType === 'memory_match') {
      const sanitizedCards = state.data.cards.map((c: any) => {
        if (c.isMatched || state.data.flippedIds.includes(c.id)) {
          return c;
        }
        return { ...c, sym: '?' };
      });
      return {
        ...state,
        data: {
          ...state.data,
          cards: sanitizedCards
        }
      };
    }

    if (state.gameType === 'guess_number' && state.status !== 'completed') {
      return {
        ...state,
        data: {
          ...state.data,
          secretNumber: undefined
        }
      };
    }

    if (state.gameType === 'hangman' && state.status !== 'completed') {
      return {
        ...state,
        data: {
          ...state.data,
          word: undefined,
          displayWord: state.data.word.split('').map((l: string) => state.data.guessedLetters.includes(l) ? l : '_').join(' ')
        }
      };
    }

    if (state.gameType === 'guess_my_answer') {
      if (!state.data.isRevealed && state.data.guesserUserId === userId) {
        return {
          ...state,
          data: {
            ...state.data,
            secretAnswer: state.data.secretAnswer ? 'LOCKED_IN' : null
          }
        };
      }
    }

    return state;
  }
}
