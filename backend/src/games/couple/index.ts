export interface CoupleQuestionItem {
  id: string;
  category: string;
  text: string;
  optionA?: string | null;
  optionB?: string | null;
}

export interface CoupleGameCommonState {
  gameType: string;
  players: { userId: string; name: string; avatar?: string }[];
  currentRound: number;
  totalRounds: number;
  currentPrompt: CoupleQuestionItem;
  answers: Record<string, any>; // userId -> answer
  scores: Record<string, number>; // userId -> points
  isRevealed: boolean;
  status: 'playing' | 'completed';
  winnerUserId: string | null;
  logs: string[];
}

export class CoupleGamesEngine {
  static init(
    gameType: string,
    players: { userId: string; name: string; avatar?: string }[],
    promptList: CoupleQuestionItem[]
  ): CoupleGameCommonState {
    const prompts = promptList.length > 0 ? promptList : [
      { id: 'default_1', category: gameType, text: 'What is your favorite memory of us together?' },
      { id: 'default_2', category: gameType, text: 'If we could teleport right now, where would we go?' }
    ];

    const scores: Record<string, number> = {};
    for (const p of players) {
      scores[p.userId] = 0;
    }

    return {
      gameType,
      players,
      currentRound: 1,
      totalRounds: Math.min(10, prompts.length),
      currentPrompt: prompts[0],
      answers: {},
      scores,
      isRevealed: false,
      status: 'playing',
      winnerUserId: null,
      logs: [`Started ${gameType} round 1!`]
    };
  }

  static handleAction(
    state: CoupleGameCommonState,
    userId: string,
    action: string,
    payload: any,
    promptList: CoupleQuestionItem[]
  ): { state: CoupleGameCommonState; error?: string } {
    if (state.status === 'completed') {
      return { state, error: 'Game is completed.' };
    }

    // SUBMIT ANSWER
    if (action === 'submit_answer') {
      state.answers[userId] = payload.answer;
      const player = state.players.find(p => p.userId === userId);
      state.logs.push(`${player?.name || 'Player'} locked in their answer!`);

      // Check if all players answered
      const allAnswered = state.players.every(p => state.answers[p.userId] !== undefined);
      if (allAnswered) {
        state.isRevealed = true;

        // Scoring logic for specific games
        if (state.gameType === 'would_you_rather') {
          // Both chose same option -> both get a compatibility point!
          const userIds = state.players.map(p => p.userId);
          if (userIds.length >= 2 && state.answers[userIds[0]] === state.answers[userIds[1]]) {
            for (const uid of userIds) state.scores[uid] += 1;
            state.logs.push('💖 Perfect Match! You both chose the same answer!');
          } else {
            state.logs.push('Opposites attract! You picked different choices.');
          }
        } else if (state.gameType === 'never_have_i_ever') {
          // If answer is "have", award playful strike or point
          for (const p of state.players) {
            if (state.answers[p.userId] === 'have') {
              state.scores[p.userId] += 1;
            }
          }
        }
      }
      return { state };
    }

    // NEXT ROUND
    if (action === 'next_round' || action === 'skip') {
      if (state.currentRound >= state.totalRounds || state.currentRound >= promptList.length) {
        state.status = 'completed';
        // Highest score wins
        let maxScore = -1;
        let topUser: string | null = null;
        for (const [uid, score] of Object.entries(state.scores)) {
          if (score > maxScore) {
            maxScore = score;
            topUser = uid;
          }
        }
        state.winnerUserId = topUser;
        state.logs.push('🎉 Game finished! Beautiful memories shared.');
        return { state };
      }

      state.currentRound += 1;
      state.currentPrompt = promptList[state.currentRound - 1] || promptList[0];
      state.answers = {};
      state.isRevealed = false;
      state.logs.push(`Round ${state.currentRound}: New question!`);
      return { state };
    }

    // SPIN (for Dare Roulette)
    if (action === 'spin_wheel') {
      const selectedIndex = Math.floor(Math.random() * promptList.length);
      state.currentPrompt = promptList[selectedIndex];
      state.isRevealed = true;
      state.logs.push(`🎡 The roulette landed on: "${state.currentPrompt.text}"`);
      return { state };
    }

    return { state, error: 'Unknown couple action.' };
  }

  // Security: If not revealed, hide opponents' answers!
  static sanitizeForPlayer(state: CoupleGameCommonState, userId: string): CoupleGameCommonState {
    if (state.isRevealed) {
      return state;
    }

    const sanitizedAnswers: Record<string, any> = {};
    for (const [uid, ans] of Object.entries(state.answers)) {
      if (uid === userId) {
        sanitizedAnswers[uid] = ans;
      } else {
        sanitizedAnswers[uid] = 'LOCKED_IN'; // opponent answered, but choice hidden!
      }
    }

    return {
      ...state,
      answers: sanitizedAnswers
    };
  }
}
