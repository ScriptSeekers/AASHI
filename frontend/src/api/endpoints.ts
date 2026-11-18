import { apiRequest } from './client.js';
import { 
  UserDTO, 
  CoupleRoomDTO, 
  RoomInvitationDTO, 
  UserStatsDTO,
  NotificationDTO,
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  CreateRoomInput,
  JoinRoomInput,
  InvitePartnerInput
} from '@aashi/shared';

// Auth
export const authApi = {
  register: (data: RegisterInput) => 
    apiRequest<{ message: string; token: string; user: UserDTO }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  login: (data: LoginInput) =>
    apiRequest<{ message: string; token: string; user: UserDTO }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  logout: () =>
    apiRequest<{ message: string }>('/auth/logout', { method: 'POST' }),
  getMe: () =>
    apiRequest<{ user: UserDTO }>('/auth/me')
};

// Users
export const userApi = {
  getProfile: () => apiRequest<{ user: UserDTO }>('/users/me'),
  updateProfile: (data: UpdateProfileInput) =>
    apiRequest<{ message: string; user: UserDTO }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  search: (query: string) =>
    apiRequest<{ users: { id: string; name: string; username: string; avatar?: string }[] }>(`/users/search?q=${encodeURIComponent(query)}`)
};

// Rooms
export const roomApi = {
  create: (data: CreateRoomInput) =>
    apiRequest<{ room: CoupleRoomDTO }>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  join: (data: JoinRoomInput) =>
    apiRequest<{ room: CoupleRoomDTO }>('/rooms/join', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  get: (roomId: string) =>
    apiRequest<{ room: CoupleRoomDTO }>(`/rooms/${roomId}`),
  leave: (roomId: string) =>
    apiRequest<{ message: string }>(`/rooms/${roomId}/leave`, { method: 'POST' }),
  invite: (data: InvitePartnerInput) =>
    apiRequest<{ message: string; invitationId: string }>('/rooms/invite', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

// Invitations
export const invitationApi = {
  getPending: () =>
    apiRequest<{ invitations: RoomInvitationDTO[] }>('/invitations/pending'),
  getPartnerStatus: () =>
    apiRequest<{
      hasPartner: boolean;
      partner?: { id: string; name: string; username: string; avatar?: string | null; isOnline: boolean };
      pendingInvitation?: RoomInvitationDTO | null;
    }>('/invitations/partner-status'),
  invitePartnerDirect: (gameType?: string) =>
    apiRequest<{ message: string; invitation: RoomInvitationDTO }>('/invitations/invite-partner', {
      method: 'POST',
      body: JSON.stringify({ gameType })
    }),
  accept: (id: string) =>
    apiRequest<{ message: string; room: CoupleRoomDTO; gameType?: string; sessionId?: string }>(`/invitations/${id}/accept`, {
      method: 'POST'
    }),
  decline: (id: string) =>
    apiRequest<{ message: string }>(`/invitations/${id}/decline`, {
      method: 'POST'
    }),
  cancel: (id: string) =>
    apiRequest<{ message: string }>(`/invitations/${id}/cancel`, {
      method: 'POST'
    })
};

// Games
export const gameApi = {
  getCatalog: () =>
    apiRequest<{ games: any[] }>('/games'),
  getById: (gameId: string) =>
    apiRequest<{ game: any }>(`/games/${gameId}`),
  start: (gameId: string, roomId: string) =>
    apiRequest<{ sessionId: string; gameType: string; state: any }>(`/games/${gameId}/start`, {
      method: 'POST',
      body: JSON.stringify({ roomId })
    }),
  getSession: (sessionId: string) =>
    apiRequest<{ sessionId: string; gameType: string; state: any }>(`/games/sessions/${sessionId}`)
};

// Statistics
export const statsApi = {
  getMyStats: () =>
    apiRequest<{ statistics: UserStatsDTO }>('/statistics/me'),
  getRoomStats: (roomId: string) =>
    apiRequest<{ roomId: string; members: any[]; headToHead: any }>(`/statistics/room/${roomId}`),
  clearAllHistory: () =>
    apiRequest<{ message: string }>('/statistics/history', { method: 'DELETE' }),
  deleteHistoryItem: (id: string) =>
    apiRequest<{ message: string }>(`/statistics/history/${id}`, { method: 'DELETE' })
};

// Notifications
export const notificationApi = {
  get: () =>
    apiRequest<{ notifications: NotificationDTO[] }>('/notifications'),
  markRead: (id: string) =>
    apiRequest<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' })
};
