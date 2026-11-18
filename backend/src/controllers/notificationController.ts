import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { NotificationDTO } from '../shared/index.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const notifications = await prisma.notification.findMany({
      where: { userId: authReq.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    const dtos: NotificationDTO[] = notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type as any,
      data: n.dataJson ? JSON.parse(n.dataJson) : undefined,
      read: n.read,
      createdAt: n.createdAt.toISOString()
    }));

    res.json({ notifications: dtos });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const id = String(req.params.id);

    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId: authReq.user.id, read: false },
        data: { read: true }
      });
      res.json({ message: 'All notifications marked as read' });
      return;
    }

    await prisma.notification.updateMany({
      where: { id, userId: authReq.user.id },
      data: { read: true }
    });

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    next(err);
  }
}
