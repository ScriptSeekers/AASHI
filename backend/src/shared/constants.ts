export const BRAND = {
  name: 'AASHI',
  tagline: 'Love hard. Play harder.',
  positioning: 'A private universe for two.',
  colors: {
    primaryPink: '#F7C7DF',
    secondaryLavender: '#CDBBFA',
    berryBlush: '#D979AE',
    midnightPlum: '#34253F',
    cloudWhite: '#FFFAFD',
    lilacMist: '#F1EBFC',
    softPeach: '#FFDCCB'
  }
} as const;

export type GameCategory = 'couple' | 'board' | 'card' | 'quick';

export interface GameMetadata {
  id: string;
  title: string;
  description: string;
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  estimatedMinutes: number;
  icon: string;
  badge?: string;
  popular?: boolean;
}

export const GAME_CATALOG: GameMetadata[] = [
  // Card
  {
    id: 'uno',
    title: 'UNO: Aashi Edition',
    description: 'The beloved card-shedding classic! Draw cards, skip, reverse, match colors and numbers, and hit UNO before anyone catches you.',
    category: 'card',
    minPlayers: 2,
    maxPlayers: 4,
    estimatedMinutes: 10,
    icon: 'Layers',
    popular: true,
    badge: 'Multiplayer Hit'
  },
  // Board Games
  {
    id: 'chess',
    title: 'Royal Chess',
    description: 'The timeless strategy duel. Full standard FIDE rules with legal move validation, castling, promotion, checkmate and timer.',
    category: 'board',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 15,
    icon: 'Crown',
    popular: true
  },
  {
    id: 'ludo',
    title: 'Ludo Express',
    description: 'Race your tokens across the board, land on safe spots, capture your opponent, and take all tokens home.',
    category: 'board',
    minPlayers: 2,
    maxPlayers: 4,
    estimatedMinutes: 15,
    icon: 'Dice5',
    popular: true,
    badge: '4 Players'
  },
  {
    id: 'tic_tac_toe',
    title: 'Tic-Tac-Toe',
    description: 'Classic 3x3 grid battle with quick rematch and streak tracker. Simple, fast and fiercely competitive.',
    category: 'board',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 2,
    icon: 'Grid3X3'
  },
  {
    id: 'connect_four',
    title: 'Connect Four',
    description: 'Drop colored tokens into the vertical 7x6 grid. Connect 4 horizontally, vertically or diagonally to win.',
    category: 'board',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 5,
    icon: 'Columns'
  },
  {
    id: 'checkers',
    title: 'Checkers',
    description: 'Classic diagonal draughts with mandatory captures, double jumps, and crowning kings.',
    category: 'board',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 10,
    icon: 'CircleDot'
  },
  // Couple Games
  {
    id: 'never_have_i_ever',
    title: 'Never Have I Ever',
    description: 'Confess your secrets, spicy encounters and funny habits. Answer simultaneously and find out who did what.',
    category: 'couple',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 10,
    icon: 'HeartHandshake',
    popular: true,
    badge: 'Couple Favorite'
  },
  {
    id: 'truth_or_dare',
    title: 'Truth or Dare',
    description: 'Cute, romantic, funny and spicy dares & deep truths. Spin, choose your vibe or let fate decide.',
    category: 'couple',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 15,
    icon: 'Flame',
    popular: true
  },
  {
    id: 'would_you_rather',
    title: 'Would You Rather',
    description: 'Tough, funny and spicy dilemmas. Compare answers at the same time and see your compatibility percentage.',
    category: 'couple',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 8,
    icon: 'Split'
  },
  {
    id: 'who_knows_who_better',
    title: 'Who Knows Who Better?',
    description: 'How well do you really know your partner? Guess their answers to intimate and funny trivia.',
    category: 'couple',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 12,
    icon: 'Sparkles'
  },
  {
    id: 'dare_roulette',
    title: 'Dare Roulette',
    description: 'Spin the romantic roulette wheel to reveal wild, affectionate, or spicy challenges for your partner.',
    category: 'couple',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 10,
    icon: 'Compass'
  },
  {
    id: 'love_quiz',
    title: 'Love Compatibility Quiz',
    description: 'Explore your relationship dynamic, love languages, and couple synergy through curated psychological prompts.',
    category: 'couple',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 10,
    icon: 'Heart'
  },
  // Quick Games
  {
    id: 'rock_paper_scissors',
    title: 'Rock Paper Scissors',
    description: 'Rapid-fire Best of 3 / 5 duel. Hidden simultaneous selection revealed at the exact same instant.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 1,
    icon: 'Hand'
  },
  {
    id: 'coin_flip',
    title: 'Coin Flip Showdown',
    description: 'Heads or tails? Let the server flip decide who picks dinner, movie, or takes the dare.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 1,
    icon: 'Coins'
  },
  {
    id: 'dice_duel',
    title: 'Dice Duel',
    description: 'Roll the high-stakes dice simultaneously. Higher roll takes the round in this tense quick battle.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 2,
    icon: 'Dices'
  },
  {
    id: 'memory_match',
    title: 'Memory Match',
    description: 'Flip cards on a shared board and discover matching romantic pairs. Tests your memory and focus.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 5,
    icon: 'Brain'
  },
  {
    id: 'reaction_race',
    title: 'Reaction Race',
    description: 'Hold your breath and wait for the green signal. Tap in milliseconds! False starts get penalized.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 2,
    icon: 'Zap'
  },
  {
    id: 'guess_number',
    title: 'Guess The Secret Number',
    description: 'A secret number between 1 and 100. Alternate guesses with Hotter/Colder and Higher/Lower server clues.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 3,
    icon: 'Binary'
  },
  {
    id: 'emoji_guess',
    title: 'Emoji Riddle Battle',
    description: 'Decode movies, couple phrases, and secret messages hidden inside cute emoji puzzles before time runs out.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 5,
    icon: 'Smile'
  },
  {
    id: 'word_chain',
    title: 'Word Chain (Shiritori)',
    description: 'Rapid-fire word tennis. Start your word with the last letter of your partner\'s word. No repeats!',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 4,
    icon: 'Repeat'
  },
  {
    id: 'quick_quiz',
    title: 'Quick Quiz Battle',
    description: 'Fast-paced pop culture, trivia and couple quiz. Who answers faster and more accurately?',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 5,
    icon: 'HelpCircle'
  },
  {
    id: 'hangman',
    title: 'Hangman Romance',
    description: 'Guess the hidden romantic word or phrase letter by letter before running out of hearts.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 4,
    icon: 'LifeBuoy'
  },
  {
    id: 'higher_lower',
    title: 'Higher or Lower',
    description: 'Predict whether the next card drawn from the deck will be higher or lower to build an unstoppable streak.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 3,
    icon: 'TrendingUp'
  },
  {
    id: 'spin_wheel',
    title: 'Spin The Wheel',
    description: 'Spin for cute forfeits, kisses, foot rubs, ordering dessert, or playful romantic rewards.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 2,
    icon: 'Disc'
  },
  {
    id: 'fast_tap',
    title: 'Fast Tap Battle',
    description: '10 seconds on the clock. Mash your screen as fast as your fingers can go! The faster tapper triumphs.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 1,
    icon: 'Touchpad'
  },
  {
    id: 'guess_my_answer',
    title: 'Guess My Answer',
    description: 'One partner secretly types their answer to a question, the other tries to mind-read and match it.',
    category: 'quick',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedMinutes: 4,
    icon: 'MessageCircleHeart'
  }
];

export const SOCKET_EVENTS = {
  // Auth
  AUTH_SUCCESS: 'auth:success',
  AUTH_ERROR: 'auth:error',
  
  // Invitations
  PARTNER_INVITE: 'partner:invite',
  PARTNER_INVITATION_RECEIVED: 'partner:invitation_received',
  PARTNER_ACCEPT: 'partner:accept',
  PARTNER_ACCEPTED: 'partner:accepted',
  PARTNER_DECLINE: 'partner:decline',
  PARTNER_DECLINED: 'partner:declined',
  PARTNER_INVITATION_EXPIRED: 'partner:invitation_expired',
  PARTNER_INVITATION_CANCELLED: 'partner:invitation_cancelled',
  PARTNER_STATUS: 'partner:status',

  // Room
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',
  ROOM_LEAVE: 'room:leave',
  ROOM_LEFT: 'room:left',
  ROOM_UPDATE: 'room:update',
  ROOM_PLAYER_STATUS: 'room:player_status',
  ROOM_CHAT: 'room:chat',
  ROOM_REACTION: 'room:reaction',

  // Game Lifecycle
  GAME_SELECT: 'game:select',
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  GAME_ACTION: 'game:action',
  GAME_OVER: 'game:over',
  GAME_REMATCH_OFFER: 'game:rematch_offer',
  GAME_REMATCH_ACCEPTED: 'game:rematch_accepted',
  GAME_ERROR: 'game:error'
} as const;
