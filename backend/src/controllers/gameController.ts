import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { GAME_CATALOG } from '../shared/index.js';
import { GameManager } from '../games/gameManager.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { getSocketManager } from '../sockets/socketManager.js';
import { SOCKET_EVENTS } from '../shared/index.js';

export async function getGameCatalog(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const games = await prisma.game.findMany({
      orderBy: { key: 'asc' }
    });
    // Merge with metadata
    const catalog = games.map(g => {
      const meta = GAME_CATALOG.find(c => c.id === g.key);
      return {
        ...g,
        icon: meta?.icon || 'Gamepad2',
        popular: meta?.popular || false,
        badge: meta?.badge,
        estimatedMinutes: meta?.estimatedMinutes || 5
      };
    });

    res.json({ games: catalog });
  } catch (err) {
    next(err);
  }
}

export async function getGameById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const gameId = String(req.params.gameId);
    const game = await prisma.game.findFirst({
      where: {
        OR: [{ id: gameId }, { key: gameId }]
      }
    });

    if (!game) {
      throw new NotFoundError(`Game "${gameId}" not found.`);
    }

    const meta = GAME_CATALOG.find(c => c.id === game.key);
    res.json({
      game: {
        ...game,
        icon: meta?.icon || 'Gamepad2',
        badge: meta?.badge,
        estimatedMinutes: meta?.estimatedMinutes || 5
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function startGameSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const gameId = String(req.params.gameId);
    const { roomId } = req.body;

    if (!roomId) {
      res.status(400).json({ error: 'RoomId is required to start a game.' });
      return;
    }

    const room = await prisma.coupleRoom.findUnique({
      where: { id: String(roomId) },
      include: { members: true }
    });

    if (!room) {
      throw new NotFoundError('Room not found.');
    }

    const isMember = room.members.some(m => m.userId === authReq.user.id);
    if (!isMember) {
      throw new ForbiddenError('You must be a member of the room to start a game.');
    }

    const playerIds = room.members.map(m => m.userId);
    const activeSession = await GameManager.startSession(room.id, gameId, playerIds);

    const socketManager = getSocketManager();
    if (socketManager) {
      // Broadcast personalized state to each player
      for (const member of room.members) {
        const playerState = GameManager.sanitizeForPlayer(activeSession, member.userId);
        socketManager.broadcastToRoom(room.id, SOCKET_EVENTS.GAME_STATE, {
          sessionId: activeSession.sessionId,
          gameType: activeSession.gameType,
          state: playerState
        });
      }
    }

    res.status(201).json({
      sessionId: activeSession.sessionId,
      gameType: activeSession.gameType,
      state: GameManager.sanitizeForPlayer(activeSession, authReq.user.id)
    });
  } catch (err) {
    next(err);
  }
}

export async function getGameSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const sessionId = String(req.params.sessionId);

    const active = GameManager.getActiveSession(sessionId);
    if (active) {
      res.json({
        sessionId: active.sessionId,
        gameType: active.gameType,
        state: GameManager.sanitizeForPlayer(active, authReq.user.id)
      });
      return;
    }

    // Fallback: check SQLite if completed
    const dbSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { participants: true }
    });

    if (!dbSession) {
      throw new NotFoundError('Session not found.');
    }

    res.json({
      sessionId: dbSession.id,
      gameType: dbSession.gameType,
      status: dbSession.status,
      winnerUserId: dbSession.winnerUserId,
      state: JSON.parse(dbSession.stateJson || '{}')
    });
  } catch (err) {
    next(err);
  }
}
