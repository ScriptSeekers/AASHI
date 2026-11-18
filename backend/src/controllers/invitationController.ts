import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { RoomInvitationDTO, GAME_CATALOG } from '../shared/index.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { getSocketManager } from '../sockets/socketManager.js';
import { formatRoomDTO } from './roomController.js';
import { generateRoomCode } from '../utils/auth.js';
import { GameManager } from '../games/gameManager.js';

export function formatInvitationDTO(inv: any): RoomInvitationDTO {
  const gameMeta = GAME_CATALOG.find(g => g.id === inv.gameType);
  const gameTitle = gameMeta?.title || (inv.gameType ? inv.gameType.replace(/_/g, ' ') : 'Couple Game');

  return {
    id: inv.id,
    roomId: inv.roomId,
    roomName: inv.room?.name || 'Couple Arena',
    senderId: inv.senderId,
    senderName: inv.sender?.name || 'Partner',
    senderUsername: inv.sender?.username || 'partner',
    senderAvatar: inv.sender?.avatar || null,
    recipientId: inv.recipientId,
    recipientName: inv.recipient?.name || 'You',
    gameType: inv.gameType || null,
    gameTitle,
    status: inv.status as any,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString()
  };
}

export async function getPartnerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user.partnerId) {
      res.json({ hasPartner: false });
      return;
    }

    const partner = await prisma.user.findUnique({
      where: { id: user.partnerId },
      select: { id: true, name: true, username: true, avatar: true }
    });

    if (!partner) {
      res.json({ hasPartner: false });
      return;
    }

    const socketManager = getSocketManager();
    const isOnline = socketManager ? socketManager.isUserOnline(partner.id) : false;

    // Auto-expire old pending invitations
    const now = new Date();
    await prisma.roomInvitation.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lt: now }
      },
      data: { status: 'expired' }
    });

    const pending = await prisma.roomInvitation.findFirst({
      where: {
        OR: [
          { senderId: user.id, recipientId: partner.id, status: 'pending', expiresAt: { gte: now } },
          { senderId: partner.id, recipientId: user.id, status: 'pending', expiresAt: { gte: now } }
        ]
      },
      include: { room: true, sender: true, recipient: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      hasPartner: true,
      partner: {
        ...partner,
        isOnline
      },
      pendingInvitation: pending ? formatInvitationDTO(pending) : null
    });
  } catch (err) {
    next(err);
  }
}

export async function invitePartnerDirect(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    if (!user.partnerId) {
      throw new ForbiddenError('You do not have a connected partner.');
    }

    const partner = await prisma.user.findUnique({
      where: { id: user.partnerId }
    });

    if (!partner) {
      throw new NotFoundError('Registered partner not found.');
    }

    const socketManager = getSocketManager();
    const isOnline = socketManager ? socketManager.isUserOnline(partner.id) : false;

    if (process.env.NODE_ENV !== 'test' && !isOnline) {
      res.status(400).json({
        error: 'PartnerOffline',
        message: `${partner.name} is currently offline. You can only play together when your partner is online!`
      });
      return;
    }

    const gameType = req.body.gameType || 'uno';

    // Find or create an exclusive CoupleRoom for this pair
    let room = await prisma.coupleRoom.findFirst({
      where: {
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: partner.id } } }
        ]
      },
      include: { members: true }
    });

    if (!room) {
      let code = generateRoomCode();
      const newRoom = await prisma.$transaction(async (tx) => {
        const created = await tx.coupleRoom.create({
          data: {
            code,
            name: `${user.name} & ${partner.name}'s Arena`,
            isPrivate: true,
            maxPlayers: 2,
            hostId: user.id
          }
        });
        await tx.roomMember.createMany({
          data: [
            { roomId: created.id, userId: user.id, role: 'host' },
            { roomId: created.id, userId: partner.id, role: 'member' }
          ]
        });
        return created;
      });

      room = await prisma.coupleRoom.findUnique({
        where: { id: newRoom.id },
        include: { members: true }
      });
    }

    // Cancel any prior pending invitations from this user to partner
    await prisma.roomInvitation.updateMany({
      where: {
        senderId: user.id,
        recipientId: partner.id,
        status: 'pending'
      },
      data: { status: 'cancelled' }
    });

    // 60-second real-time timeout for in-app popup
    const expiresAt = new Date(Date.now() + 60 * 1000);

    const invitation = await prisma.roomInvitation.create({
      data: {
        roomId: room!.id,
        senderId: user.id,
        recipientId: partner.id,
        gameType,
        status: 'pending',
        expiresAt
      },
      include: {
        room: true,
        sender: true,
        recipient: true
      }
    });

    const invitationDTO = formatInvitationDTO(invitation);

    if (socketManager) {
      socketManager.sendPartnerInvitation(invitationDTO);
    }

    res.status(201).json({
      message: `Invitation sent to ${partner.name}!`,
      invitation: invitationDTO
    });
  } catch (err) {
    next(err);
  }
}

export async function getPendingInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const now = new Date();

    // Auto-expire old pending invitations
    await prisma.roomInvitation.updateMany({
      where: {
        recipientId: authReq.user.id,
        status: 'pending',
        expiresAt: { lt: now }
      },
      data: { status: 'expired' }
    });

    const invitations = await prisma.roomInvitation.findMany({
      where: {
        recipientId: authReq.user.id,
        status: 'pending',
        expiresAt: { gte: now }
      },
      include: {
        room: true,
        sender: true,
        recipient: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      invitations: invitations.map(formatInvitationDTO)
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);

    const invitation = await prisma.roomInvitation.findUnique({
      where: { id },
      include: {
        room: {
          include: { members: true }
        },
        sender: true,
        recipient: true
      }
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found.');
    }

    if (invitation.recipientId !== authReq.user.id) {
      throw new ForbiddenError('This invitation was sent to another user.');
    }

    if (invitation.status !== 'pending') {
      throw new ConflictError(`This invitation has already been ${invitation.status}.`);
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.roomInvitation.update({
        where: { id },
        data: { status: 'expired' }
      });
      throw new ConflictError('This invitation has expired.');
    }

    const room = invitation.room;

    // Atomic transaction to accept invitation and join room
    await prisma.$transaction(async (tx) => {
      await tx.roomInvitation.update({
        where: { id },
        data: { status: 'accepted' }
      });

      const alreadyMember = room.members.some((m: any) => m.userId === authReq.user.id);
      if (!alreadyMember) {
        await tx.roomMember.create({
          data: {
            roomId: room.id,
            userId: authReq.user.id,
            role: 'member'
          }
        });
      }

      const senderMember = room.members.some((m: any) => m.userId === invitation.senderId);
      if (!senderMember) {
        await tx.roomMember.create({
          data: {
            roomId: room.id,
            userId: invitation.senderId,
            role: 'host'
          }
        });
      }
    });

    // Auto-start multiplayer game session if gameType is set
    let gameSessionId: string | null = null;
    const gameTypeToStart = invitation.gameType || 'uno';

    try {
      const activeSession = await GameManager.startSession(
        room.id,
        gameTypeToStart,
        [invitation.senderId, authReq.user.id]
      );
      gameSessionId = activeSession.sessionId;
    } catch (sessionErr) {
      console.error('[AUTO_START_SESSION_ERROR]', sessionErr);
    }

    // Fetch updated room with all members
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
    const roomDTO = formatRoomDTO(updatedRoom, onlineUsers);

    if (socketManager) {
      // Notify sender in real-time with game session info
      socketManager.notifyInvitationAccepted(invitation.senderId, {
        invitationId: invitation.id,
        recipientId: authReq.user.id,
        recipientName: authReq.user.name,
        roomId: room.id,
        gameType: gameTypeToStart,
        sessionId: gameSessionId
      });

      // Broadcast room update to anyone in room
      socketManager.broadcastToRoom(room.id, 'room:update', roomDTO);
    }

    res.json({
      message: 'Invitation accepted!',
      room: roomDTO,
      gameType: gameTypeToStart,
      sessionId: gameSessionId
    });
  } catch (err) {
    next(err);
  }
}

export async function declineInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);

    const invitation = await prisma.roomInvitation.findUnique({
      where: { id }
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found.');
    }

    if (invitation.recipientId !== authReq.user.id) {
      throw new ForbiddenError('Unauthorized to decline this invitation.');
    }

    if (invitation.status === 'pending') {
      await prisma.roomInvitation.update({
        where: { id },
        data: { status: 'declined' }
      });

      const socketManager = getSocketManager();
      if (socketManager) {
        socketManager.notifyInvitationDeclined(invitation.senderId, {
          invitationId: invitation.id,
          recipientId: authReq.user.id,
          recipientName: authReq.user.name
        });
      }
    }

    res.json({ message: 'Invitation declined.' });
  } catch (err) {
    next(err);
  }
}

export async function cancelInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);

    const invitation = await prisma.roomInvitation.findUnique({
      where: { id }
    });

    if (!invitation) {
      throw new NotFoundError('Invitation not found.');
    }

    if (invitation.senderId !== authReq.user.id) {
      throw new ForbiddenError('Unauthorized to cancel this invitation.');
    }

    if (invitation.status === 'pending') {
      await prisma.roomInvitation.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      const socketManager = getSocketManager();
      if (socketManager) {
        socketManager.notifyInvitationCancelled(invitation.recipientId, {
          invitationId: invitation.id,
          senderName: authReq.user.name
        });
      }
    }

    res.json({ message: 'Invitation cancelled.' });
  } catch (err) {
    next(err);
  }
}
