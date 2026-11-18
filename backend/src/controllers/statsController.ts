import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UserStatsDTO, GameHistoryItemDTO } from '../shared/index.js';
import { GAME_CATALOG } from '../shared/index.js';

export async function getMyStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user.id;

    let stats = await prisma.userStatistics.findUnique({
      where: { userId }
    });

    if (!stats) {
      stats = await prisma.userStatistics.create({
        data: {
          userId,
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          gamesDrawn: 0,
          currentStreak: 0,
          bestStreak: 0,
          winRate: 0.0
        }
      });
    }

    const history = await prisma.gameHistory.findMany({
      where: { userId },
      include: { opponent: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const recentGames: GameHistoryItemDTO[] = history.map(h => {
      const gameDef = GAME_CATALOG.find(g => g.id === h.gameType);
      return {
        id: h.id,
        gameType: h.gameType,
        gameTitle: gameDef?.title || h.gameType,
        playedAt: h.createdAt.toISOString(),
        durationSeconds: h.durationSeconds,
        result: h.result as 'won' | 'lost' | 'draw',
        opponentName: h.opponent?.name || 'Partner',
        opponentAvatar: h.opponent?.avatar || null,
        score: h.score
      };
    });

    const dto: UserStatsDTO = {
      gamesPlayed: stats.gamesPlayed,
      gamesWon: stats.gamesWon,
      gamesLost: stats.gamesLost,
      gamesDrawn: stats.gamesDrawn,
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
      winRate: stats.winRate,
      favoriteGame: stats.favoriteGame,
      recentGames
    };

    res.json({ statistics: dto });
  } catch (err) {
    next(err);
  }
}

export async function getRoomStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = String(req.params.roomId);

    const room = await prisma.coupleRoom.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              include: { statistics: true }
            }
          }
        }
      }
    });

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const memberStats = room.members.map((m: any) => ({
      userId: m.userId,
      name: m.user?.name || 'Player',
      avatar: m.user?.avatar || null,
      stats: m.user?.statistics || null
    }));

    // If 2 members, compute head-to-head match history
    let headToHead: { user1Wins: number; user2Wins: number; draws: number } | null = null;
    if (room.members.length >= 2) {
      const u1 = room.members[0].userId;
      const u2 = room.members[1].userId;

      const user1History = await prisma.gameHistory.findMany({
        where: {
          userId: u1,
          opponentId: u2
        }
      });

      let u1Wins = 0;
      let u2Wins = 0;
      let draws = 0;
      for (const h of user1History) {
        if (h.result === 'won') u1Wins++;
        else if (h.result === 'lost') u2Wins++;
        else draws++;
      }

      headToHead = {
        user1Wins: u1Wins,
        user2Wins: u2Wins,
        draws
      };
    }

    res.json({
      roomId,
      members: memberStats,
      headToHead
    });
  } catch (err) {
    next(err);
  }
}

export function isUserArpit(user: { email: string; username?: string | null }): boolean {
  return (
    user.email.toLowerCase() === 'arpit@duvora.com' ||
    user.username?.toLowerCase() === 'arpit'
  );
}

export async function clearAllGameHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!isUserArpit(authReq.user)) {
      res.status(403).json({ error: 'Permission denied. Only Arpit has the authority to delete game history.' });
      return;
    }

    // Delete all GameHistory records
    await prisma.gameHistory.deleteMany({});

    // Reset user statistics for both players
    await prisma.userStatistics.updateMany({
      data: {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        gamesDrawn: 0,
        currentStreak: 0,
        bestStreak: 0,
        winRate: 0.0,
        favoriteGame: null
      }
    });

    res.json({ message: 'All game history and statistics have been successfully cleared by Arpit.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteGameHistoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    if (!isUserArpit(authReq.user)) {
      res.status(403).json({ error: 'Permission denied. Only Arpit has the authority to delete game history.' });
      return;
    }

    const historyId = String(req.params.id);
    const existing = await prisma.gameHistory.findUnique({
      where: { id: historyId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Match history record not found.' });
      return;
    }

    await prisma.gameHistory.delete({
      where: { id: historyId }
    });

    // Recalculate statistics for user
    const remainingCount = await prisma.gameHistory.count({ where: { userId: existing.userId } });
    const remainingWins = await prisma.gameHistory.count({ where: { userId: existing.userId, result: 'won' } });
    const remainingLosses = await prisma.gameHistory.count({ where: { userId: existing.userId, result: 'lost' } });
    const remainingDraws = await prisma.gameHistory.count({ where: { userId: existing.userId, result: 'draw' } });
    const winRate = remainingCount > 0 ? Number(((remainingWins / remainingCount) * 100).toFixed(1)) : 0;

    await prisma.userStatistics.update({
      where: { userId: existing.userId },
      data: {
        gamesPlayed: remainingCount,
        gamesWon: remainingWins,
        gamesLost: remainingLosses,
        gamesDrawn: remainingDraws,
        winRate
      }
    }).catch(() => {});

    res.json({ message: 'Match history item deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
