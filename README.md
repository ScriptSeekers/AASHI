# AASHI
### Love hard. Play harder.
> *A private universe for two.*

AASHI is a modern, responsive, real-time multiplayer gaming platform designed exclusively for couples. It pairs competitive strategy, playful games, intimate question prompts, and party card games into a romantic experience.

---

## Key Highlights & Features

1. **Rock-Solid Authentication & Session Persistence**:
   - Salted `bcrypt` password hashing with zero plaintext leakage.
   - Secure `HttpOnly`, `SameSite=Lax` cookies backed by persistent SQLite `Session` records.
   - Full persistence across browser refreshes, tabs, and network reconnections.
   - Clean session revocation on logout.

2. **Real-Time Partner Invitation Popup**:
   - Instant socket-driven popup notification on recipient screens without refreshing.
   - Direct Accept & Decline controls with real-time feedback to sender.
   - Offline invitation persistence in SQLite; automatically surfaced upon next sign-in.
   - Automatic 15-minute expiration and duplicate acceptance prevention.

3. **Complete Playable Games Library (26 Games)**:
   - **UNO (Full Multiplayer Card Game)**: Standard 108 cards, discard/draw piles, reverse, skip, draw 2, wild & wild draw 4, wild color picker, UNO call button, catch UNO penalty, strictly hidden private hands.
   - **Royal Chess (FIDE Rules)**: Authoritative move validation powered by `chess.js`, check/checkmate/stalemate detection, en passant, castling, pawn promotion modal, move history, captured pieces display, resignation, draw offers.
   - **Ludo Express**: 2-4 player board, server-authoritative dice rolling (1-6), 6-to-exit-base rule, safe squares, token capturing with bonus turn, home stretch finish.
   - **Classic Board Games**: Tic-Tac-Toe, Connect Four, Checkers (diagonal captures and king promotions).
   - **Couple Games**: Never Have I Ever, Truth or Dare, Would You Rather, Who Knows Who Better?, Dare Roulette (animated wheel), Love Compatibility Quiz.
   - **Quick Battles**: Rock Paper Scissors (simultaneous hidden reveal), Coin Flip Showdown, Dice Duel, Memory Match, Reaction Race (premature tap penalty), Guess The Number, Emoji Riddles, Word Chain (Shiritori), Fast Tap Battle, Hangman Romance, Higher or Lower.

4. **Private Gaming Rooms**:
   - Short 6-character room codes.
   - Real-time player presence tracking.
   - In-room chat & floating emoji reactions (`💗`, `🔥`, `👑`, `✨`, `🥺`, `🥂`).
   - Seamless rematch flow without recreating rooms.

5. **Statistics & Couple Achievements**:
   - Head-to-head match records, win rates, streaks, and match duration tracking.
   - Milestone achievements unlocked through real gameplay (Love Birds, Flirty Victor, On Fire, UNO Champion, etc.).

6. **Responsive Design System**:
   - Pastel glassmorphism palette: Primary Pink (`#F7C7DF`), Secondary Lavender (`#CDBBFA`), Berry Blush (`#D979AE`), Midnight Plum (`#34253F`), Cloud White (`#FFFAFD`).
   - Headings in *Fredoka*, Body typography in *DM Sans*.
   - Mobile bottom navigation bar + desktop top navigation.
   - Built-in Web Audio API synthesizer for sound effects (pop, bell chime, victory fanfare) with 0 external audio dependencies.

---

## Tech Stack

- **Architecture**: Clean standalone `backend/` and `frontend/` folders
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router, Lucide React, TanStack Query, React Hook Form, Zod, Canvas Confetti
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Zod, Chess.js, Bcryptjs, Cookie-Parser, CORS
- **Database**: SQLite with Prisma ORM
- **Testing**: Vitest, Supertest

---

## Project Structure

```
AASHI/
├── backend/                  # Standalone Express + Socket.IO + SQLite (Prisma)
│   ├── prisma/               # schema.prisma & dev.db
│   ├── src/                  # Controllers, 26 game engines, auth, sockets
│   ├── tests/                # 20/20 passing Vitest tests
│   ├── package.json          # Independent dependencies
│   ├── tsconfig.json
│   └── .env
│
├── frontend/                 # Standalone React 18 + Vite + Tailwind CSS
│   ├── public/               # Audio chime, brand icons, illustrations
│   ├── src/                  # 14 pages, 26 game UIs, SocketContext, AuthContext
│   ├── package.json          # Independent dependencies
│   ├── vite.config.ts        # Built-in proxy for /api & /socket.io -> :3001
│   ├── tsconfig.json
│   └── tailwind.config.js
│
└── run.txt                   # Quick setup, credentials, and run instructions
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### Option A: Run Separately (Recommended)

1. **Backend**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run dev
   ```
   > API: `http://localhost:3001/api` | WebSockets: `ws://localhost:3001`

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   > Web App: `http://localhost:5173`

---

### Option B: Run from Root
```bash
npm run dev
```

---

### Exclusive Couple Credentials
AASHI is configured exclusively for **Arpit & Shree**:
- **Arpit**: `Arpit@aashi.com` / `Love2927`
- **Shree**: `Shree@aashi.com` / `Love2927`

Public signup is disabled. Both accounts are already linked as partners.

---

## Database Management & Backup

### Backup Database
Because SQLite uses a single file, backup is simple and safe:
```bash
# Windows PowerShell
Copy-Item backend/prisma/dev.db backend/prisma/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').db

# Linux / macOS
cp backend/prisma/dev.db backend/prisma/backup-$(date +%Y%m%d-%H%M%S).db
```

### Inspecting Database
Prisma Studio provides a graphical interface to view all tables and records:
```bash
npm --prefix backend run db:studio
```

---

## Running Tests
Run the comprehensive test suite (covers Auth, Invitations, Rooms, UNO, Chess, Ludo, RPS, and Tic-Tac-Toe):
```bash
npm --prefix backend test
```

---

## License
MIT © 2026 AASHI. Love hard. Play harder.
