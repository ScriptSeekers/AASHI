# AASHI Security Audit & Threat Modeling

## Overview
AASHI is built with a zero-trust, server-authoritative multiplayer security architecture. Clients are considered untrusted presentation layers. No game rule, dice roll, card deal, or scoring calculation is ever determined or accepted from the frontend.

---

## 1. Authentication & Session Security
- **Password Storage**: Passwords are never stored in plaintext. Passwords are salted and hashed using bcrypt with 10 rounds of salt generation.
- **Session Tokens**: Cryptographically secure 256-bit entropy random tokens generated via Node.js `crypto.randomBytes(32).toString('hex')`.
- **Cookie Security**:
  - `HttpOnly`: Enforced on `aashi_session` cookie to prevent client-side JavaScript access (mitigating XSS session theft).
  - `SameSite=Lax`: Prevents Cross-Site Request Forgery (CSRF).
  - `Secure`: Enabled in production over HTTPS.
- **Session Expiry**: Sessions are time-bounded to 30 days and actively checked in database queries. Expired sessions are purged.
- **Session Invalidation**: Complete server-side database deletion upon logout, preventing replay or reuse.

---

## 2. Authorization & Insecure Direct Object References (IDOR)
- **Protected Routes**: Middleware `authenticate` verifies session existence and expiry before granting access to user, room, and game data.
- **Room Membership Verification**:
  - Room invite endpoint verifies inviter is an active member of the room.
  - Invitation acceptance verifies that `invitation.recipientId === authenticatedUserId`. An unauthorized third party cannot accept someone else's invitation.
  - Game moves require the authenticated user to be an active participant in that specific game session and that it is legally their turn.

---

## 3. Game State Privacy & Anti-Cheating Architecture

### A. UNO Deck & Hand Privacy
- **Threat**: Client inspecting network requests or WebSocket frames to see opponents' hands or cards remaining in draw pile.
- **Mitigation**: The `UnoGameEngine.sanitizeForPlayer(state, userId)` method filters state per connected client.
  - Opponents receive only public counts: `cardCount` and `calledUno`.
  - An opponent's cards are never serialized into JSON sent to other players.
  - The draw pile deck order is strictly kept in server memory / server database.

### B. Chess Legality & Engine Enforcement
- **Threat**: Client sends falsified board state or moves a piece into an illegal square or through check.
- **Mitigation**: Moves are strictly parsed through `chess.js` server engine. Moves outside of legal FIDE rules (`chess.move({ from, to, promotion })`) are rejected with 400 Bad Request.

### C. Ludo Server-Authoritative Dice
- **Threat**: Client sends fabricated dice roll (e.g. always rolling 6).
- **Mitigation**: The client sends only `{ action: 'roll_dice' }` with no client parameters. The server generates `Math.floor(Math.random() * 6) + 1` and calculates movable tokens.

### D. Rock-Paper-Scissors & Secret Games Simultaneous Reveal
- **Threat**: Player waiting to see partner's choice before making their own.
- **Mitigation**: `QuickGamesEngine.sanitizeForPlayer` masks opponent's choice as `'HIDDEN'` until both players have submitted their choices. Only then does the server broadcast the revealed choices simultaneously.

---

## 4. Injection & Input Validation
- **SQL Injection**: Handled via Prisma ORM parameterized queries with SQLite relational constraints and foreign key cascade rules. No string concatenation SQL is used.
- **XSS**: Strict Zod schemas sanitize and validate string inputs (`RegisterSchema`, `LoginSchema`, `CreateRoomSchema`, etc.). React natively escapes all interpolated text nodes in JSX.
- **Rate Limiting & Duplicate Request Prevention**: Duplicate clicks are blocked on both UI state (`isSubmitting`) and server database unique constraints.

---

## 5. SQLite Foreign Keys & Data Integrity
- Foreign keys are enforced on all relations (`User`, `Session`, `CoupleRoom`, `RoomMember`, `RoomInvitation`, `GameSession`, `GameParticipant`, `GameMove`).
- Cascade rules ensure orphaned sessions or memberships are automatically cleaned up when parent records are deleted.

---

## 6. Backup & Recovery
- SQLite databases can be safely backed up using the SQLite online backup API or by taking a snapshot of `dev.db` when WAL mode checkpoint is executed.
