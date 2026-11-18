import { prisma } from '../database/db.js';
import { UnoGameEngine } from './uno/index.js';
import { ChessGameEngine } from './chess/index.js';
import { LudoGameEngine } from './ludo/index.js';
import { TicTacToeEngine, ConnectFourEngine, CheckersEngine } from './board/index.js';
import { CoupleGamesEngine, CoupleQuestionItem } from './couple/index.js';
import { QuickGamesEngine } from './quick/index.js';

export interface ActiveSession {
  sessionId: string;
  roomId: string;
  gameType: string;
  engineType: 'uno' | 'chess' | 'ludo' | 'tictactoe' | 'connectfour' | 'checkers' | 'couple' | 'quick';
  state: any;
  players: { userId: string; name: string }[];
  rematchOfferedBy?: string | null;
  startedAt: Date;
}

const activeSessions = new Map<string, ActiveSession>();

export class GameManager {
  static async startSession(
    roomId: string,
    gameType: string,
    playerIds: string[]
  ): Promise<ActiveSession> {
    const players = await prisma.user.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, name: true }
    });

    const playerList = players.map(p => ({ userId: p.id, name: p.name }));

    let engineType: ActiveSession['engineType'] = 'quick';
    let initialState: any = null;

    if (gameType === 'uno') {
      engineType = 'uno';
      initialState = UnoGameEngine.init(playerList);
    } else if (gameType === 'chess') {
      engineType = 'chess';
      initialState = ChessGameEngine.init(playerList);
    } else if (gameType === 'ludo') {
      engineType = 'ludo';
      initialState = LudoGameEngine.init(playerList);
    } else if (gameType === 'tic_tac_toe') {
      engineType = 'tictactoe';
      initialState = TicTacToeEngine.init(playerList);
    } else if (gameType === 'connect_four') {
      engineType = 'connectfour';
      initialState = ConnectFourEngine.init(playerList);
    } else if (gameType === 'checkers') {
      engineType = 'checkers';
      initialState = CheckersEngine.init(playerList);
    } else if (['never_have_i_ever', 'truth_or_dare', 'would_you_rather', 'who_knows_who_better', 'dare_roulette', 'love_quiz'].includes(gameType)) {
      engineType = 'couple';
      const questions = await prisma.question.findMany({
        where: { category: gameType },
        take: 15
      });
      const promptList: CoupleQuestionItem[] = questions.map(q => ({
        id: q.id,
        category: q.category,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB
      }));
      initialState = CoupleGamesEngine.init(gameType, playerList, promptList);
    } else {
      engineType = 'quick';
      initialState = QuickGamesEngine.init(gameType, playerList);
    }

    // Persist GameSession in SQLite
    const session = await prisma.gameSession.create({
      data: {
        roomId,
        gameType,
        status: 'playing',
        stateJson: JSON.stringify(initialState),
        participants: {
          create: playerList.map(p => ({
            userId: p.userId,
            role: 'player'
          }))
        }
      }
    });

    // Update CoupleRoom active session
    await prisma.coupleRoom.update({
      where: { id: roomId },
      data: {
        activeGameType: gameType,
        activeSessionId: session.id
      }
    });

    const active: ActiveSession = {
      sessionId: session.id,
      roomId,
      gameType,
      engineType,
      state: initialState,
      players: playerList,
      startedAt: new Date()
    };

    activeSessions.set(session.id, active);
    return active;
  }

  static getActiveSession(sessionId: string): ActiveSession | undefined {
    return activeSessions.get(sessionId);
  }

  static async handleAction(
    sessionId: string,
    userId: string,
    action: string,
    payload: any
  ): Promise<{ session: ActiveSession; error?: string }> {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return { session: null as any, error: 'Game session not found.' };
    }

    let result: { state: any; error?: string };

    if (session.engineType === 'uno') {
      result = UnoGameEngine.handleAction(session.state, userId, action, payload);
    } else if (session.engineType === 'chess') {
      result = ChessGameEngine.handleAction(session.state, userId, action, payload);
    } else if (session.engineType === 'ludo') {
      result = LudoGameEngine.handleAction(session.state, userId, action, payload);
    } else if (session.engineType === 'tictactoe') {
      result = TicTacToeEngine.handleAction(session.state, userId, action, payload);
    } else if (session.engineType === 'connectfour') {
      result = ConnectFourEngine.handleAction(session.state, userId, action, payload);
    } else if (session.engineType === 'checkers') {
      result = CheckersEngine.handleAction(session.state, userId, action, payload);
    } else if (session.engineType === 'couple') {
      const questions = await prisma.question.findMany({
        where: { category: session.gameType }
      });
      const promptList: CoupleQuestionItem[] = questions.map(q => ({
        id: q.id,
        category: q.category,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB
      }));
      result = CoupleGamesEngine.handleAction(session.state, userId, action, payload, promptList);
    } else {
      result = QuickGamesEngine.handleAction(session.state, userId, action, payload);
    }

    if (result.error) {
      return { session, error: result.error };
    }

    session.state = result.state;

    // Check if game has finished
    const isCompleted = session.state.status === 'completed';
    const winnerId = session.state.winnerUserId || null;

    if (isCompleted) {
      await this.finalizeGame(session, winnerId);
    } else {
      // Async state update in DB
      prisma.gameSession.update({
        where: { id: sessionId },
        data: { stateJson: JSON.stringify(session.state) }
      }).catch(err => console.error('[GAME_SAVE_ERROR]', err));
    }

    return { session };
  }

  static async finalizeGame(session: ActiveSession, winnerId: string | null): Promise<void> {
    const duration = Math.round((Date.now() - session.startedAt.getTime()) / 1000);

    await prisma.gameSession.update({
      where: { id: session.sessionId },
      data: {
        status: 'completed',
        winnerUserId: winnerId,
        endedAt: new Date(),
        stateJson: JSON.stringify(session.state)
      }
    }).catch(() => {});

    // Update GameHistory & UserStatistics for participants
    const playerIds = session.players.map(p => p.userId);

    for (const p of session.players) {
      const isWinner = winnerId === p.userId;
      const isDraw = winnerId === null;
      const result: 'won' | 'lost' | 'draw' = isWinner ? 'won' : isDraw ? 'draw' : 'lost';
      const opponentId = playerIds.find(id => id !== p.userId) || null;

      // Save History
      await prisma.gameHistory.create({
        data: {
          userId: p.userId,
          opponentId,
          gameType: session.gameType,
          result,
          durationSeconds: duration
        }
      }).catch(() => {});

      // Update Statistics
      const stats = await prisma.userStatistics.findUnique({ where: { userId: p.userId } });
      if (stats) {
        const played = stats.gamesPlayed + 1;
        const won = stats.gamesWon + (isWinner ? 1 : 0);
        const lost = stats.gamesLost + (!isWinner && !isDraw ? 1 : 0);
        const drawn = stats.gamesDrawn + (isDraw ? 1 : 0);
        const streak = isWinner ? stats.currentStreak + 1 : 0;
        const bestStreak = Math.max(stats.bestStreak, streak);
        const winRate = Number(((won / played) * 100).toFixed(1));

        await prisma.userStatistics.update({
          where: { userId: p.userId },
          data: {
            gamesPlayed: played,
            gamesWon: won,
            gamesLost: lost,
            gamesDrawn: drawn,
            currentStreak: streak,
            bestStreak,
            winRate,
            favoriteGame: session.gameType
          }
        }).catch(() => {});
      }
    }
  }

  static sanitizeForPlayer(session: ActiveSession, userId: string): any {
    if (session.engineType === 'uno') {
      return UnoGameEngine.sanitizeForPlayer(session.state, userId);
    }
    if (session.engineType === 'chess') {
      return ChessGameEngine.sanitizeForPlayer(session.state, userId);
    }
    if (session.engineType === 'ludo') {
      return LudoGameEngine.sanitizeForPlayer(session.state, userId);
    }
    if (session.engineType === 'couple') {
      return CoupleGamesEngine.sanitizeForPlayer(session.state, userId);
    }
    if (session.engineType === 'quick') {
      return QuickGamesEngine.sanitizeForPlayer(session.state, userId);
    }
    return session.state;
  }
}
