import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { UnoGameEngine } from '../src/games/uno/index.js';
import { ChessGameEngine } from '../src/games/chess/index.js';
import { LudoGameEngine } from '../src/games/ludo/index.js';
import { QuickGamesEngine } from '../src/games/quick/index.js';
import { TicTacToeEngine, ConnectFourEngine, CheckersEngine } from '../src/games/board/index.js';

describe('DUVORA Full-Stack Test Suite (Exclusive Arpit & Shree Realm)', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let createdRoomId: string;
  let createdRoomCode: string;
  let testInvitationId: string;

  const arpitCredentials = {
    email: 'Arpit@duvora.com',
    password: 'Love2927'
  };

  const shreeCredentials = {
    email: 'Shree@duvora.com',
    password: 'Love2927'
  };

  describe('1. Authentication & Security (No Signup - Only Arpit & Shree)', () => {
    it('should reject new registrations since signup is strictly closed', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'stranger@duvora.com',
          password: 'Password123',
          name: 'Stranger',
          username: 'stranger'
        })
        .expect(403);

      expect(res.body.message).toContain('Registration is closed');
    });

    it('should login successfully as Arpit with password Love2927 and set session cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(arpitCredentials)
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('arpit@duvora.com');
      expect(res.body.user.name).toBe('Arpit');
      user1Token = res.body.token;
      user1Id = res.body.user.id;

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('duvora_session=');
    });

    it('should login successfully as Shree with password Love2927', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send(shreeCredentials)
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('shree@duvora.com');
      expect(res.body.user.name).toBe('Shree');
      user2Token = res.body.token;
      user2Id = res.body.user.id;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'Arpit@duvora.com',
          password: 'WrongPassword999'
        })
        .expect(401);

      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown_404@duvora.com',
          password: 'Love2927'
        })
        .expect(401);

      expect(res.body.message).toContain('Invalid email or password');
    });

    it('should fetch authenticated profile for Arpit showing partner Shree', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.user.id).toBe(user1Id);
      expect(res.body.user.partnerName).toBe('Shree');
    });

    it('should block unauthenticated access to protected routes', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('2. Couple Rooms & Real-Time Partner Invitations', () => {
    it('should allow Arpit to create a private couple room', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Arpit & Shree Secret Suite', isPrivate: true, maxPlayers: 2 })
        .expect(201);

      expect(res.body.room).toBeDefined();
      expect(res.body.room.code).toBeDefined();
      expect(res.body.room.members.length).toBe(1);
      createdRoomId = res.body.room.id;
      createdRoomCode = res.body.room.code;
    });

    it('should invite Shree to the room in real time', async () => {
      const res = await request(app)
        .post('/api/rooms/invite')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          roomId: createdRoomId,
          recipientIdentifier: 'shree@duvora.com'
        })
        .expect(201);

      expect(res.body.invitationId).toBeDefined();
      testInvitationId = res.body.invitationId;
    });

    it('should fetch pending invitations for Shree', async () => {
      const res = await request(app)
        .get('/api/invitations/pending')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.invitations).toBeDefined();
      expect(res.body.invitations.length).toBeGreaterThanOrEqual(1);
      const found = res.body.invitations.find((inv: any) => inv.id === testInvitationId);
      expect(found).toBeDefined();
      expect(found.senderName).toBe('Arpit');
    });

    it('should accept partner invitation and add Shree to the room', async () => {
      const res = await request(app)
        .post(`/api/invitations/${testInvitationId}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.room).toBeDefined();
      expect(res.body.room.members.length).toBe(2);
      expect(res.body.room.members.some((m: any) => m.userId === user2Id)).toBe(true);
    });

    it('should prevent accepting an already accepted invitation', async () => {
      await request(app)
        .post(`/api/invitations/${testInvitationId}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(409);
    });
  });

  describe('3. UNO Engine Server-Authoritative Logic & Privacy', () => {
    it('should initialize UNO deck with 108 cards and deal 7 cards per player', () => {
      const unoState = UnoGameEngine.init([
        { userId: 'u1', name: 'Arpit' },
        { userId: 'u2', name: 'Shree' }
      ]);

      expect(unoState.players[0].hand.length).toBe(7);
      expect(unoState.players[1].hand.length).toBe(7);
      expect(unoState.topCard).toBeDefined();
      expect(unoState.drawPile.length).toBe(108 - 14 - 1);
    });

    it('should sanitize UNO state so Shree never sees Arpit private cards', () => {
      const unoState = UnoGameEngine.init([
        { userId: 'u1', name: 'Arpit' },
        { userId: 'u2', name: 'Shree' }
      ]);

      const sanitizedForArpit = UnoGameEngine.sanitizeForPlayer(unoState, 'u1');
      expect(sanitizedForArpit.myHand).toBeDefined();
      expect(sanitizedForArpit.myHand!.length).toBe(7);

      const shreeInfo = sanitizedForArpit.players.find(p => p.userId === 'u2')!;
      expect(shreeInfo.cardCount).toBe(7);
      expect((shreeInfo as any).hand).toBeUndefined();
      expect((sanitizedForArpit as any).drawPile).toBeUndefined();
    });
  });

  describe('4. Chess Engine FIDE Rules & Move Validation', () => {
    it('should validate legal chess opening e2 to e4', () => {
      const chessState = ChessGameEngine.init([
        { userId: 'white_1', name: 'Arpit' },
        { userId: 'black_1', name: 'Shree' }
      ]);

      const result = ChessGameEngine.handleAction(chessState, 'white_1', 'move', { from: 'e2', to: 'e4' });
      expect(result.error).toBeUndefined();
      expect(result.state.history[0]).toBe('e4');
    });

    it('should reject illegal chess moves', () => {
      const chessState = ChessGameEngine.init([
        { userId: 'white_1', name: 'Arpit' },
        { userId: 'black_1', name: 'Shree' }
      ]);

      const result = ChessGameEngine.handleAction(chessState, 'white_1', 'move', { from: 'e2', to: 'e5' });
      expect(result.error).toBeDefined();
    });
  });

  describe('5. Ludo Engine Authoritative Dice & Tokens', () => {
    it('should initialize 4 tokens in base for each player', () => {
      const ludoState = LudoGameEngine.init([
        { userId: 'u1', name: 'Arpit' },
        { userId: 'u2', name: 'Shree' }
      ]);

      expect(ludoState.players[0].tokens.length).toBe(4);
      expect(ludoState.players[0].tokens[0].isAtBase).toBe(true);
      expect(ludoState.players[0].tokens[0].step).toBe(-1);
    });

    it('should roll dice server-side between 1 and 6', () => {
      const ludoState = LudoGameEngine.init([
        { userId: 'u1', name: 'Arpit' },
        { userId: 'u2', name: 'Shree' }
      ]);

      const result = LudoGameEngine.handleAction(ludoState, 'u1', 'roll_dice', {});
      expect(result.state.diceValue).toBeGreaterThanOrEqual(1);
      expect(result.state.diceValue).toBeLessThanOrEqual(6);
    });
  });

  describe('6. Tic-Tac-Toe & Quick Games', () => {
    it('should enforce turn validation and win detection in Tic-Tac-Toe', () => {
      const ttt = TicTacToeEngine.init([
        { userId: 'p1', name: 'Arpit' },
        { userId: 'p2', name: 'Shree' }
      ]);

      TicTacToeEngine.handleAction(ttt, 'p1', 'move', { index: 0 });
      TicTacToeEngine.handleAction(ttt, 'p2', 'move', { index: 3 });
      TicTacToeEngine.handleAction(ttt, 'p1', 'move', { index: 1 });
      TicTacToeEngine.handleAction(ttt, 'p2', 'move', { index: 4 });
      TicTacToeEngine.handleAction(ttt, 'p1', 'move', { index: 2 });

      expect(ttt.status).toBe('completed');
      expect(ttt.winnerUserId).toBe('p1');
    });

    it('should hide simultaneous choices in Rock Paper Scissors until both submit', () => {
      const rps = QuickGamesEngine.init('rock_paper_scissors', [
        { userId: 'p1', name: 'Arpit' },
        { userId: 'p2', name: 'Shree' }
      ]);

      QuickGamesEngine.handleAction(rps, 'p1', 'choose', { choice: 'rock' });

      const sanitizedForP2 = QuickGamesEngine.sanitizeForPlayer(rps, 'p2');
      expect(sanitizedForP2.data.choices['p1']).toBe('HIDDEN');

      QuickGamesEngine.handleAction(rps, 'p2', 'choose', { choice: 'scissors' });
      expect(rps.scores['p1']).toBe(1);
    });
  });

  describe('7. Direct Partner Gaming Flow (Zero Party Codes)', () => {
    let directInviteId: string;

    it('should fetch partner status for Arpit showing Shree as registered partner', async () => {
      const res = await request(app)
        .get('/api/invitations/partner-status')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.hasPartner).toBe(true);
      expect(res.body.partner).toBeDefined();
      expect(res.body.partner.name).toBe('Shree');
    });

    it('should allow Arpit to directly invite Shree without party codes', async () => {
      const res = await request(app)
        .post('/api/invitations/invite-partner')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gameType: 'ludo' })
        .expect(201);

      expect(res.body.invitation).toBeDefined();
      expect(res.body.invitation.recipientName).toBe('Shree');
      expect(res.body.invitation.gameType).toBe('ludo');
      directInviteId = res.body.invitation.id;
    });

    it('should show pending invitation in Shree partner-status', async () => {
      const res = await request(app)
        .get('/api/invitations/partner-status')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.pendingInvitation).toBeDefined();
      expect(res.body.pendingInvitation.senderName).toBe('Arpit');
      expect(res.body.pendingInvitation.gameType).toBe('ludo');
    });

    it('should allow Arpit to cancel the direct invitation', async () => {
      await request(app)
        .post(`/api/invitations/${directInviteId}/cancel`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify no pending invitation now
      const res = await request(app)
        .get('/api/invitations/partner-status')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.pendingInvitation).toBeNull();
    });

    it('should invite and accept direct game invitation to create a live session', async () => {
      const inviteRes = await request(app)
        .post('/api/invitations/invite-partner')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gameType: 'chess' })
        .expect(201);

      const invId = inviteRes.body.invitation.id;

      const acceptRes = await request(app)
        .post(`/api/invitations/${invId}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(acceptRes.body.room).toBeDefined();
      expect(acceptRes.body.sessionId).toBeDefined();
    });
  });

  describe('8. Checkers & Connect-4 Board Engines', () => {
    it('should initialize Checkers with 12 pieces per player and alternating dark squares', () => {
      const checkers = CheckersEngine.init([
        { userId: 'p1', name: 'Arpit' },
        { userId: 'p2', name: 'Shree' }
      ]);

      const p0Pieces = checkers.pieces.filter(p => p.playerIndex === 0);
      const p1Pieces = checkers.pieces.filter(p => p.playerIndex === 1);
      expect(p0Pieces.length).toBe(12);
      expect(p1Pieces.length).toBe(12);
      expect(checkers.status).toBe('playing');
    });

    it('should initialize Connect 4 with empty 6x7 grid', () => {
      const c4 = ConnectFourEngine.init([
        { userId: 'p1', name: 'Arpit' },
        { userId: 'p2', name: 'Shree' }
      ]);

      expect(c4.grid.length).toBe(6);
      expect(c4.grid[0].length).toBe(7);
      expect(c4.status).toBe('playing');

      const actionRes = ConnectFourEngine.handleAction(c4, 'p1', 'drop', { col: 3 });
      expect(actionRes.error).toBeUndefined();
      expect(actionRes.state.grid[5][3]).toBe('pink');
      expect(actionRes.state.currentTurnUserId).toBe('p2');
    });
  });

  describe('9. Complete Quick Games Suite Validation', () => {
    it('should sanitize Memory Match cards until flipped', () => {
      const mem = QuickGamesEngine.init('memory_match', [
        { userId: 'p1', name: 'Arpit' },
        { userId: 'p2', name: 'Shree' }
      ]);

      const sanitized = QuickGamesEngine.sanitizeForPlayer(mem, 'p1');
      expect(sanitized.data.cards[0].sym).toBe('?');

      const firstCardId = mem.data.cards[0].id;
      QuickGamesEngine.handleAction(mem, 'p1', 'flip_card', { cardId: firstCardId });
      expect(mem.data.flippedIds).toContain(firstCardId);
    });

    it('should provide higher/lower feedback in Guess Number', () => {
      const gn = QuickGamesEngine.init('guess_number', [
        { userId: 'p1', name: 'Arpit' },
        { userId: 'p2', name: 'Shree' }
      ]);

      const secret = gn.data.secretNumber;
      const guess = secret > 50 ? secret - 5 : secret + 5;
      QuickGamesEngine.handleAction(gn, 'p1', 'guess', { guess });
      expect(gn.data.guesses.length).toBe(1);
      expect(gn.data.guesses[0].hint).toBe(guess < secret ? 'HIGHER' : 'LOWER');
    });

    it('should handle Word Chain with first/last letter rules', () => {
      const wc = QuickGamesEngine.init('word_chain', [
        { userId: 'p1', name: 'Arpit' },
        { userId: 'p2', name: 'Shree' }
      ]);

      const res1 = QuickGamesEngine.handleAction(wc, 'p1', 'submit_word', { word: 'elephant' });
      expect(res1.error).toBeUndefined();
      expect(wc.data.words).toContain('elephant');
      expect(wc.data.lastLetter).toBe('t');

      const res2 = QuickGamesEngine.handleAction(wc, 'p2', 'submit_word', { word: 'tiger' });
      expect(res2.error).toBeUndefined();
      expect(wc.data.words).toContain('tiger');
      expect(wc.data.lastLetter).toBe('r');
    });

    it('should mask Hangman word and reveal guessed letters', () => {
      const hm = QuickGamesEngine.init('hangman', [
        { userId: 'p1', name: 'Arpit' },
        { userId: 'p2', name: 'Shree' }
      ]);

      const secretWord = hm.data.word;
      const sanitized = QuickGamesEngine.sanitizeForPlayer(hm, 'p1');
      expect(sanitized.data.word).toBeUndefined();

      const letter = secretWord[0].toLowerCase();
      QuickGamesEngine.handleAction(hm, 'p1', 'guess_letter', { letter });
      expect(hm.data.guessedLetters).toContain(letter.toUpperCase());
    });
  });
});
