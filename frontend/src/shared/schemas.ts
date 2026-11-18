import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  avatar: z.string().optional()
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2).optional(),
  bio: z.string().max(200).optional(),
  avatar: z.string().optional(),
  soundEnabled: z.boolean().optional(),
  themePreference: z.enum(['light', 'dark', 'romantic']).optional()
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const CreateRoomSchema = z.object({
  name: z.string().trim().min(1).max(50).default('Duvora Secret Haven'),
  isPrivate: z.boolean().default(true),
  maxPlayers: z.number().int().min(2).max(4).default(2)
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

export const JoinRoomSchema = z.object({
  code: z.string().trim().min(4).max(12).toUpperCase()
});

export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;

export const InvitePartnerSchema = z.object({
  recipientIdentifier: z.string().trim().min(2, 'Please enter username or email'),
  roomId: z.string().min(1)
});

export type InvitePartnerInput = z.infer<typeof InvitePartnerSchema>;

export const InvitationActionSchema = z.object({
  invitationId: z.string().min(1)
});

export type InvitationActionInput = z.infer<typeof InvitationActionSchema>;

export const GameActionSchema = z.object({
  gameType: z.string().min(1),
  action: z.string().min(1),
  payload: z.record(z.any()).default({})
});

export type GameActionInput = z.infer<typeof GameActionSchema>;
