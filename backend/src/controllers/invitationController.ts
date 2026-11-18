import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { RoomInvitationDTO } from '../shared/index.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { getSocketManager } from '../sockets/socketManager.js';
import { formatRoomDTO } from './roomController.js';

export function formatInvitationDTO(inv: any): RoomInvitationDTO {
  return {
    id: inv.id,
    roomId: inv.roomId,
    roomCode: inv.room?.code || '',
    roomName: inv.room?.name || 'Couple Room',
    senderId: inv.senderId,
    senderName: inv.sender?.name || 'Partner',
    senderUsername: inv.sender?.username || 'partner',
    senderAvatar: inv.sender?.avatar || null,
    recipientId: inv.recipientId,
    recipientName: inv.recipient?.name || 'You',
    status: inv.status as any,
    createdAt: inv.createdAt.toISOString(),
    expiresAt: inv.expiresAt.toISOString()
  };
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
    if (room.members.length >= room.maxPlayers) {
      throw new ConflictError('The game room is already full.');
    }

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
    });

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
      // Notify sender in real-time
      socketManager.notifyInvitationAccepted(invitation.senderId, {
        invitationId: invitation.id,
        recipientId: authReq.user.id,
        recipientName: authReq.user.name,
        roomId: room.id,
        roomCode: room.code
      });

      // Broadcast room update to anyone already in room
      socketManager.broadcastToRoom(room.id, 'room:update', roomDTO);
    }

    res.json({
      message: 'Invitation accepted!',
      room: roomDTO
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
