import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { 
  CreateRoomSchema, 
  JoinRoomSchema, 
  InvitePartnerSchema,
  CoupleRoomDTO,
  RoomMemberDTO
} from '../shared/index.js';
import { generateRoomCode } from '../utils/auth.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { getSocketManager } from '../sockets/socketManager.js';

export function formatRoomDTO(room: any, onlineUserIds: Set<string> = new Set()): CoupleRoomDTO {
  const members: RoomMemberDTO[] = (room.members || []).map((m: any) => ({
    id: m.id,
    userId: m.userId,
    name: m.user?.name || 'Player',
    username: m.user?.username || 'player',
    avatar: m.user?.avatar || null,
    role: m.role as 'host' | 'member',
    isOnline: onlineUserIds.has(m.userId),
    joinedAt: m.joinedAt.toISOString()
  }));

  return {
    id: room.id,
    code: room.code,
    name: room.name,
    isPrivate: room.isPrivate,
    maxPlayers: room.maxPlayers,
    hostId: room.hostId,
    members,
    activeGameType: room.activeGameType,
    activeSessionId: room.activeSessionId,
    createdAt: room.createdAt.toISOString()
  };
}

export async function createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const input = CreateRoomSchema.parse(req.body);

    let code = generateRoomCode();
    // Ensure code uniqueness
    let exists = await prisma.coupleRoom.findUnique({ where: { code } });
    while (exists) {
      code = generateRoomCode();
      exists = await prisma.coupleRoom.findUnique({ where: { code } });
    }

    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.coupleRoom.create({
        data: {
          code,
          name: input.name,
          isPrivate: input.isPrivate,
          maxPlayers: input.maxPlayers,
          hostId: authReq.user.id
        }
      });

      await tx.roomMember.create({
        data: {
          roomId: newRoom.id,
          userId: authReq.user.id,
          role: 'host'
        }
      });

      return newRoom;
    });

    const fullRoom = await prisma.coupleRoom.findUnique({
      where: { id: room.id },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    const socketManager = getSocketManager();
    const onlineUsers = socketManager ? socketManager.getOnlineUserIds() : new Set<string>();

    res.status(201).json({ room: formatRoomDTO(fullRoom, onlineUsers) });
  } catch (err) {
    next(err);
  }
}

export async function joinRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const input = JoinRoomSchema.parse(req.body);

    const room = await prisma.coupleRoom.findUnique({
      where: { code: input.code },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    if (!room) {
      throw new NotFoundError(`Room with code "${input.code}" was not found.`);
    }

    const alreadyMember = room.members.find(m => m.userId === authReq.user.id);
    if (!alreadyMember) {
      if (room.members.length >= room.maxPlayers) {
        throw new ForbiddenError('This room is already at maximum capacity.');
      }

      await prisma.roomMember.create({
        data: {
          roomId: room.id,
          userId: authReq.user.id,
          role: 'member'
        }
      });
    }

    const updatedRoom = await prisma.coupleRoom.findUnique({
      where: { id: room.id },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    const socketManager = getSocketManager();
    const onlineUsers = socketManager ? socketManager.getOnlineUserIds() : new Set<string>();
    const dto = formatRoomDTO(updatedRoom, onlineUsers);

    // Notify room of update
    if (socketManager) {
      socketManager.broadcastToRoom(room.id, 'room:update', dto);
    }

    res.json({ room: dto });
  } catch (err) {
    next(err);
  }
}

export async function getRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roomId = String(req.params.roomId);
    const room = await prisma.coupleRoom.findFirst({
      where: {
        OR: [{ id: roomId }, { code: roomId.toUpperCase() }]
      },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    if (!room) {
      throw new NotFoundError('Room not found.');
    }

    const socketManager = getSocketManager();
    const onlineUsers = socketManager ? socketManager.getOnlineUserIds() : new Set<string>();

    res.json({ room: formatRoomDTO(room, onlineUsers) });
  } catch (err) {
    next(err);
  }
}

export async function leaveRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const roomId = String(req.params.roomId);

    const member = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: authReq.user.id
        }
      }
    });

    if (!member) {
      res.json({ message: 'Not in room' });
      return;
    }

    await prisma.roomMember.delete({
      where: { id: member.id }
    });

    const remainingMembers = await prisma.roomMember.findMany({
      where: { roomId },
      orderBy: { joinedAt: 'asc' }
    });

    if (remainingMembers.length === 0) {
      // Room empty - delete it
      await prisma.coupleRoom.delete({ where: { id: roomId } }).catch(() => {});
    } else if (member.role === 'host') {
      // Promote next member to host
      await prisma.roomMember.update({
        where: { id: remainingMembers[0].id },
        data: { role: 'host' }
      });
      await prisma.coupleRoom.update({
        where: { id: roomId },
        data: { hostId: remainingMembers[0].userId }
      });
    }

    const socketManager = getSocketManager();
    if (socketManager) {
      socketManager.broadcastToRoom(roomId, 'room:player_status', {
        userId: authReq.user.id,
        action: 'left'
      });
    }

    res.json({ message: 'Left room successfully' });
  } catch (err) {
    next(err);
  }
}

export async function invitePartner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const roomId = req.params.roomId || req.body.roomId;
    const input = InvitePartnerSchema.parse({
      ...req.body,
      roomId
    });

    const room = await prisma.coupleRoom.findUnique({
      where: { id: input.roomId },
      include: { members: true }
    });

    if (!room) {
      throw new NotFoundError('Room not found.');
    }

    // Verify inviter is in room
    const isMember = room.members.some(m => m.userId === authReq.user.id);
    if (!isMember) {
      throw new ForbiddenError('You must be in the room to invite a partner.');
    }

    // Find recipient by identifier or default to registered partner
    let recipient: any = null;
    if (input.recipientIdentifier) {
      recipient = await prisma.user.findFirst({
        where: {
          OR: [
            { email: input.recipientIdentifier.toLowerCase() },
            { username: input.recipientIdentifier.toLowerCase() }
          ]
        }
      });
    } else if (authReq.user.partnerId) {
      recipient = await prisma.user.findUnique({
        where: { id: authReq.user.partnerId }
      });
    }

    if (!recipient) {
      throw new NotFoundError(input.recipientIdentifier ? `Could not find a user with username or email "${input.recipientIdentifier}".` : 'No registered partner found.');
    }

    if (recipient.id === authReq.user.id) {
      throw new ConflictError('You cannot invite yourself!');
    }

    // Check if recipient is already in the room
    if (room.members.some(m => m.userId === recipient.id)) {
      throw new ConflictError(`${recipient.name} is already in this room.`);
    }

    const socketManager = getSocketManager();
    if (process.env.NODE_ENV !== 'test' && socketManager && !socketManager.isUserOnline(recipient.id)) {
      res.status(400).json({
        error: 'PartnerOffline',
        message: `${recipient.name} is currently offline. You can only play together when your partner is online!`
      });
      return;
    }

    // Expiry: 60 seconds real-time
    const expiresAt = new Date(Date.now() + 60 * 1000);

    const invitation = await prisma.roomInvitation.create({
      data: {
        roomId: room.id,
        senderId: authReq.user.id,
        recipientId: recipient.id,
        gameType: input.gameType || room.activeGameType || null,
        status: 'pending',
        expiresAt
      },
      include: {
        room: true,
        sender: true,
        recipient: true
      }
    });

    // Create a notification for the recipient
    await prisma.notification.create({
      data: {
        userId: recipient.id,
        title: 'Game Invitation',
        message: `${authReq.user.name} invited you to play in ${room.name}!`,
        type: 'invitation',
        dataJson: JSON.stringify({
          invitationId: invitation.id,
          roomId: room.id,
          roomName: room.name,
          senderName: authReq.user.name
        })
      }
    });

    if (socketManager) {
      socketManager.sendPartnerInvitation({
        id: invitation.id,
        roomId: room.id,
        roomName: room.name,
        senderId: authReq.user.id,
        senderName: authReq.user.name,
        senderUsername: authReq.user.username,
        senderAvatar: authReq.user.avatar,
        recipientId: recipient.id,
        recipientName: recipient.name,
        gameType: invitation.gameType,
        gameTitle: invitation.gameType?.replace(/_/g, ' ') || 'Couple Game',
        status: 'pending',
        createdAt: invitation.createdAt.toISOString(),
        expiresAt: invitation.expiresAt.toISOString()
      });
    }

    res.status(201).json({
      message: `Invitation sent to ${recipient.name}!`,
      invitationId: invitation.id
    });
  } catch (err) {
    next(err);
  }
}
