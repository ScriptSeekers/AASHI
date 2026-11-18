import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db.js';
import { SESSION_COOKIE_NAME } from '../utils/auth.js';
import { UnauthorizedError } from '../utils/errors.js';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user: User;
  sessionToken: string;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.[SESSION_COOKIE_NAME] || req.cookies?.['duvora_session'];
    
    // Check Authorization header fallback
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      throw new UnauthorizedError('Session cookie or Bearer token is missing');
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      // If expired session exists, clean it up
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      throw new UnauthorizedError('Session has expired. Please log in again.');
    }

    (req as AuthenticatedRequest).user = session.user;
    (req as AuthenticatedRequest).sessionToken = token;
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.cookies?.[SESSION_COOKIE_NAME] || req.cookies?.['duvora_session'];
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (token) {
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });
      if (session && session.expiresAt >= new Date()) {
        (req as AuthenticatedRequest).user = session.user;
        (req as AuthenticatedRequest).sessionToken = token;
      }
    }
    next();
  } catch {
    next();
  }
}
