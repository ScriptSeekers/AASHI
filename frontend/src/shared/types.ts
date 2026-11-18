export interface UserDTO {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string | null;
  bio?: string | null;
  soundEnabled: boolean;
  themePreference: string;
  partnerId?: string | null;
  partnerName?: string | null;
  partnerAvatar?: string | null;
  createdAt: string;
}

export interface RoomMemberDTO {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar?: string | null;
  role: 'host' | 'member';
  isOnline: boolean;
  joinedAt: string;
}

export interface CoupleRoomDTO {
  id: string;
  code: string;
  name: string;
  isPrivate: boolean;
  maxPlayers: number;
  hostId: string;
  members: RoomMemberDTO[];
  activeGameType?: string | null;
  activeSessionId?: string | null;
  createdAt: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export interface RoomInvitationDTO {
  id: string;
  roomId: string;
  roomName: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar?: string | null;
  recipientId: string;
  recipientName: string;
  gameType?: string | null;
  gameTitle?: string | null;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface UserStatsDTO {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  currentStreak: number;
  bestStreak: number;
  winRate: number;
  favoriteGame?: string | null;
  recentGames: GameHistoryItemDTO[];
}

export interface GameHistoryItemDTO {
  id: string;
  gameType: string;
  gameTitle: string;
  playedAt: string;
  durationSeconds: number;
  result: 'won' | 'lost' | 'draw';
  opponentName: string;
  opponentAvatar?: string | null;
  score?: string | null;
}

export interface AchievementDTO {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string | null;
  progress?: number;
  maxProgress?: number;
}

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'invitation' | 'game' | 'system' | 'achievement';
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// UNO Types
export type UnoColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type UnoValue = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild4';

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoValue;
}

export interface UnoPublicPlayer {
  userId: string;
  name: string;
  cardCount: number;
  calledUno: boolean;
}

export interface UnoGameState {
  players: UnoPublicPlayer[];
  myHand?: UnoCard[]; // Only sent to the authorized player!
  topCard: UnoCard;
  currentColor: 'red' | 'blue' | 'green' | 'yellow';
  currentTurnIndex: number;
  direction: 1 | -1;
  drawCountPenalty: number;
  winnerUserId: string | null;
  status: 'playing' | 'completed';
  lastActionDescription?: string;
}

// Ludo Types
export type LudoColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LudoToken {
  id: number; // 0, 1, 2, 3
  color: LudoColor;
  step: number; // -1 for home yard, 0..50 main path, 51..56 home stretch/home
  isHome: boolean;
  isAtBase: boolean;
}

export interface LudoPlayer {
  userId: string;
  name: string;
  color: LudoColor;
  tokens: LudoToken[];
  hasWon: boolean;
}

export interface LudoGameState {
  players: LudoPlayer[];
  currentTurnColor: LudoColor;
  diceValue: number | null;
  hasRolled: boolean;
  canMoveTokens: number[]; // ids of tokens that can move
  winnerUserId: string | null;
  status: 'playing' | 'completed';
  lastLog?: string;
}

// Chess Game State
export interface ChessGameState {
  fen: string;
  turn: 'w' | 'b';
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  winnerUserId: string | null;
  whiteUserId: string;
  blackUserId: string;
  history: string[]; // algebraic notation moves
  capturedPieces: {
    w: string[];
    b: string[];
  };
  timeRemaining?: {
    w: number;
    b: number;
  };
  status: 'playing' | 'completed';
}

// Generic Multiplayer Game Wrapper
export interface BaseGameState<T = any> {
  gameType: string;
  sessionId: string;
  status: 'waiting' | 'playing' | 'completed';
  turnUserId: string | null;
  winnerUserId: string | null;
  isDraw?: boolean;
  data: T;
  rematchOfferedBy?: string | null;
}
