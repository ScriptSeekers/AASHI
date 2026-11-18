import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/db.js';
import { RegisterSchema, LoginSchema, UserDTO } from '../shared/index.js';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  getSessionExpiration, 
  SESSION_COOKIE_NAME 
} from '../utils/auth.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export function formatUserDTO(user: any, partner?: { name?: string | null; avatar?: string | null } | string | null): UserDTO {
  const partnerName = typeof partner === 'string' ? partner : partner?.name || null;
  const partnerAvatar = typeof partner === 'object' && partner ? partner.avatar || null : null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    soundEnabled: user.soundEnabled,
    themePreference: user.themePreference,
    partnerId: user.partnerId,
    partnerName,
    partnerAvatar,
    createdAt: user.createdAt.toISOString()
  };
}

export async function register(req: Request, res: Response, _next: NextFunction): Promise<void> {
  res.status(403).json({
    error: 'RegistrationClosed',
    message: 'Registration is closed. DUVORA is an exclusive private universe for Arpit and Shree.'
  });
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isValidPassword = await comparePassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Create new session
    const token = generateToken();
    const expiresAt = getSessionExpiration();

    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.ip || null
      }
    });

    // Find partner info if partnerId exists
    let partnerInfo: { name: string; avatar: string | null } | null = null;
    if (user.partnerId) {
      partnerInfo = await prisma.user.findUnique({
        where: { id: user.partnerId },
        select: { name: true, avatar: true }
      });
    }

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      expires: expiresAt
    });

    res.status(200).json({
      message: 'Logged in successfully!',
      token,
      user: formatUserDTO(user, partnerInfo)
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    if (authReq.sessionToken) {
      await prisma.session.delete({
        where: { token: authReq.sessionToken }
      }).catch(() => {});
    }

    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;

    let partnerInfo: { name: string; avatar: string | null } | null = null;
    if (user.partnerId) {
      partnerInfo = await prisma.user.findUnique({
        where: { id: user.partnerId },
        select: { name: true, avatar: true }
      });
    }

    res.status(200).json({
      user: formatUserDTO(user, partnerInfo)
    });
  } catch (err) {
    next(err);
  }
}
