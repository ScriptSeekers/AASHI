import { Server, Socket } from 'socket.io';
import { prisma } from '../database/db.js';
import { SESSION_COOKIE_NAME } from '../utils/auth.js';
import { GameManager } from '../games/gameManager.js';
import { RoomInvitationDTO, SOCKET_EVENTS } from '../shared/index.js';

let socketManagerInstance: SocketManager | null = null;

export class SocketManager {
  private io: Server;
  private onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(io: Server) {
    this.io = io;
    this.setupMiddleware();
    this.setupHandlers();
  }

  private setupMiddleware(): void {
    this.io.use(async (socket: Socket, next) => {
      try {
        let token = socket.handshake.auth?.token;

        // Fallback: check cookie in handshake headers
        if (!token && socket.handshake.headers.cookie) {
          const cookieHeader = socket.handshake.headers.cookie;
          const cookies = Object.fromEntries(
            cookieHeader.split(';').map(c => {
              const [k, ...v] = c.trim().split('=');
              return [k, decodeURIComponent(v.join('='))];
            })
          );
          token = cookies[SESSION_COOKIE_NAME];
        }

        if (!token) {
          return next(new Error('Authentication required for WebSocket connection.'));
        }

        const session = await prisma.session.findUnique({
          where: { token },
          include: { user: true }
        });

        if (!session || session.expiresAt < new Date()) {
          return next(new Error('Session invalid or expired.'));
        }

        socket.data.user = session.user;
        next();
      } catch (err) {
        next(new Error('Socket authentication failed.'));
      }
    });
  }

  private setupHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      if (!user) {
        socket.disconnect();
        return;
      }

      // Track online presence
      if (!this.onlineUsers.has(user.id)) {
        this.onlineUsers.set(user.id, new Set());
      }
      this.onlineUsers.get(user.id)!.add(socket.id);

      // Join personal user room for private invitations
      socket.join(`user:${user.id}`);

      // Notify caller of successful socket connection
      socket.emit(SOCKET_EVENTS.AUTH_SUCCESS, {
        userId: user.id,
        name: user.name
      });

      // 1. JOIN ROOM
      socket.on(SOCKET_EVENTS.ROOM_JOIN, async ({ roomId }) => {
        try {
          if (!roomId) return;
          const room = await prisma.coupleRoom.findUnique({
            where: { id: roomId },
            include: { members: { include: { user: true } } }
          });

          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          socket.join(`room:${roomId}`);
          socket.data.roomId = roomId;

          // Notify room members
          this.io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_PLAYER_STATUS, {
            userId: user.id,
            name: user.name,
            status: 'online'
          });

          // If there is an active game session, send state to this reconnected/joined player
          if (room.activeSessionId) {
            const activeSession = GameManager.getActiveSession(room.activeSessionId);
            if (activeSession) {
              const playerState = GameManager.sanitizeForPlayer(activeSession, user.id);
              socket.emit(SOCKET_EVENTS.GAME_STATE, {
                sessionId: activeSession.sessionId,
                gameType: activeSession.gameType,
                state: playerState
              });
            }
          }
        } catch (err: any) {
          socket.emit('error', { message: err.message });
        }
      });

      // 2. LEAVE ROOM
      socket.on(SOCKET_EVENTS.ROOM_LEAVE, ({ roomId }) => {
        if (roomId) {
          socket.leave(`room:${roomId}`);
          this.io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_PLAYER_STATUS, {
            userId: user.id,
            name: user.name,
            status: 'offline'
          });
        }
      });

      // 3. ROOM CHAT & REACTIONS
      socket.on(SOCKET_EVENTS.ROOM_CHAT, ({ roomId, message }) => {
        if (!roomId || !message) return;
        this.io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_CHAT, {
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          message,
          timestamp: new Date().toISOString()
        });
      });

      socket.on(SOCKET_EVENTS.ROOM_REACTION, ({ roomId, emoji }) => {
        if (!roomId || !emoji) return;
        this.io.to(`room:${roomId}`).emit(SOCKET_EVENTS.ROOM_REACTION, {
          userId: user.id,
          userName: user.name,
          emoji,
          timestamp: new Date().toISOString()
        });
      });

      // 4. GAME START
      socket.on(SOCKET_EVENTS.GAME_START, async ({ roomId, gameType }) => {
        try {
          const room = await prisma.coupleRoom.findUnique({
            where: { id: roomId },
            include: { members: true }
          });

          if (!room) return;
          const memberUserIds = room.members.map(m => m.userId);

          const activeSession = await GameManager.startSession(roomId, gameType, memberUserIds);

          // Broadcast personalized game state to each participant
          for (const member of room.members) {
            const playerState = GameManager.sanitizeForPlayer(activeSession, member.userId);
            this.io.to(`user:${member.userId}`).emit(SOCKET_EVENTS.GAME_STATE, {
              sessionId: activeSession.sessionId,
              gameType: activeSession.gameType,
              state: playerState
            });
          }
        } catch (err: any) {
          socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: err.message });
        }
      });

      // 5. GAME ACTION
      socket.on(SOCKET_EVENTS.GAME_ACTION, async ({ sessionId, action, payload }) => {
        try {
          const activeSession = GameManager.getActiveSession(sessionId);
          if (!activeSession) {
            socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: 'Game session expired or not found.' });
            return;
          }

          const { session, error } = await GameManager.handleAction(sessionId, user.id, action, payload);
          if (error) {
            socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: error });
            return;
          }

          // Broadcast updated personalized state to each player
          for (const player of session.players) {
            const playerState = GameManager.sanitizeForPlayer(session, player.userId);
            this.io.to(`user:${player.userId}`).emit(SOCKET_EVENTS.GAME_STATE, {
              sessionId: session.sessionId,
              gameType: session.gameType,
              state: playerState
            });
          }

          if (session.state.status === 'completed') {
            this.io.to(`room:${session.roomId}`).emit(SOCKET_EVENTS.GAME_OVER, {
              sessionId: session.sessionId,
              winnerUserId: session.state.winnerUserId,
              isDraw: session.state.isDraw || false
            });
          }
        } catch (err: any) {
          socket.emit(SOCKET_EVENTS.GAME_ERROR, { message: err.message });
        }
      });

      // 6. REMATCH
      socket.on(SOCKET_EVENTS.GAME_REMATCH_OFFER, ({ sessionId }) => {
        const session = GameManager.getActiveSession(sessionId);
        if (session) {
          session.rematchOfferedBy = user.id;
          socket.to(`room:${session.roomId}`).emit(SOCKET_EVENTS.GAME_REMATCH_OFFER, {
            offeredByUserId: user.id,
            offeredByName: user.name
          });
        }
      });

      socket.on(SOCKET_EVENTS.GAME_REMATCH_ACCEPTED, async ({ sessionId }) => {
        const session = GameManager.getActiveSession(sessionId);
        if (session) {
          const newSession = await GameManager.startSession(
            session.roomId,
            session.gameType,
            session.players.map(p => p.userId)
          );

          for (const player of newSession.players) {
            const playerState = GameManager.sanitizeForPlayer(newSession, player.userId);
            this.io.to(`user:${player.userId}`).emit(SOCKET_EVENTS.GAME_STATE, {
              sessionId: newSession.sessionId,
              gameType: newSession.gameType,
              state: playerState
            });
          }
        }
      });

      // DISCONNECT
      socket.on('disconnect', () => {
        const userSockets = this.onlineUsers.get(user.id);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.onlineUsers.delete(user.id);
          }
        }

        if (socket.data.roomId) {
          this.io.to(`room:${socket.data.roomId}`).emit(SOCKET_EVENTS.ROOM_PLAYER_STATUS, {
            userId: user.id,
            name: user.name,
            status: 'offline'
          });
        }
      });
    });
  }

  public getOnlineUserIds(): Set<string> {
    return new Set(this.onlineUsers.keys());
  }

  public sendPartnerInvitation(invitation: RoomInvitationDTO): void {
    // Send directly to recipient's private user room!
    this.io.to(`user:${invitation.recipientId}`).emit(SOCKET_EVENTS.PARTNER_INVITATION_RECEIVED, invitation);
  }

  public notifyInvitationAccepted(senderId: string, data: { invitationId: string; recipientId: string; recipientName: string; roomId: string; roomCode: string }): void {
    this.io.to(`user:${senderId}`).emit(SOCKET_EVENTS.PARTNER_ACCEPTED, data);
  }

  public notifyInvitationDeclined(senderId: string, data: { invitationId: string; recipientId: string; recipientName: string }): void {
    this.io.to(`user:${senderId}`).emit(SOCKET_EVENTS.PARTNER_DECLINED, data);
  }

  public broadcastToRoom(roomId: string, event: string, data: any): void {
    this.io.to(`room:${roomId}`).emit(event, data);
  }
}

export function initSocketManager(io: Server): SocketManager {
  socketManagerInstance = new SocketManager(io);
  return socketManagerInstance;
}

export function getSocketManager(): SocketManager | null {
  return socketManagerInstance;
}
