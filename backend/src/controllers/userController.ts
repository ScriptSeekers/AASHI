import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { UpdateProfileSchema } from '../shared/index.js';
import { formatUserDTO } from './authController.js';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    let partnerName: string | null = null;
    if (authReq.user.partnerId) {
      const partner = await prisma.user.findUnique({
        where: { id: authReq.user.partnerId },
        select: { name: true }
      });
      partnerName = partner?.name || null;
    }

    res.json({ user: formatUserDTO(authReq.user, partnerName) });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const input = UpdateProfileSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: authReq.user.id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
        ...(input.soundEnabled !== undefined ? { soundEnabled: input.soundEnabled } : {}),
        ...(input.themePreference !== undefined ? { themePreference: input.themePreference } : {})
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: formatUserDTO(updated)
    });
  } catch (err) {
    next(err);
  }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = String(req.query.q || '').trim().toLowerCase();

    if (!query || query.length < 2) {
      res.json({ users: [] });
      return;
    }

    const matches = await prisma.user.findMany({
      where: {
        id: { not: authReq.user.id },
        OR: [
          { username: { contains: query } },
          { email: { contains: query } },
          { name: { contains: query } }
        ]
      },
      take: 10,
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true
      }
    });

    res.json({ users: matches });
  } catch (err) {
    next(err);
  }
}
