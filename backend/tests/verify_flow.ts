process.env.NODE_ENV = 'test';

import { io as Client } from 'socket.io-client';
import request from 'supertest';
import { app, server } from '../src/index.js';
import { SOCKET_EVENTS } from '../src/shared/constants.js';

async function run() {
  console.log('[1] Starting HTTP server...');
  await new Promise<void>((resolve) => {
    server.listen(3999, '127.0.0.1', () => {
      console.log('[1] Server listening on http://127.0.0.1:3999');
      resolve();
    });
  });

  console.log('[2] Logging in Arpit...');
  const resArpit = await request(app)
    .post('/api/auth/login')
    .send({ email: 'Arpit@duvora.com', password: 'Love2927' });
  const arpitToken = resArpit.body.token;
  console.log('[2] Arpit token:', !!arpitToken);

  console.log('[3] Logging in Shree...');
  const resShree = await request(app)
    .post('/api/auth/login')
    .send({ email: 'Shree@duvora.com', password: 'Love2927' });
  const shreeToken = resShree.body.token;
  console.log('[3] Shree token:', !!shreeToken);

  console.log('[4] Connecting Arpit socket...');
  const arpitSocket = Client('http://127.0.0.1:3999', {
    auth: { token: arpitToken },
    transports: ['polling']
  });

  await new Promise<void>((resolve, reject) => {
    arpitSocket.on('connect', () => {
      console.log('[4] Arpit socket connected! ID:', arpitSocket.id);
      resolve();
    });
    arpitSocket.on('connect_error', (err) => {
      console.error('[4] Arpit socket error:', err);
      reject(err);
    });
  });

  console.log('[5] Connecting Shree socket...');
  const partnerStatusPromise = new Promise<any>((resolve) => {
    arpitSocket.on(SOCKET_EVENTS.PARTNER_STATUS, (data) => {
      console.log('[PARTNER_STATUS on Arpit]:', data);
      if (data.isOnline) resolve(data);
    });
  });

  const shreeSocket = Client('http://127.0.0.1:3999', {
    auth: { token: shreeToken },
    transports: ['polling']
  });

  await new Promise<void>((resolve, reject) => {
    shreeSocket.on('connect', () => {
      console.log('[5] Shree socket connected! ID:', shreeSocket.id);
      resolve();
    });
    shreeSocket.on('connect_error', (err) => {
      console.error('[5] Shree socket error:', err);
      reject(err);
    });
  });

  await partnerStatusPromise;
  console.log('[6] Partner status verified: Shree is online!');

  console.log('[7] Arpit invites Shree to play UNO directly (no party code)...');
  const invitePromise = new Promise<any>((resolve) => {
    shreeSocket.once(SOCKET_EVENTS.PARTNER_INVITATION_RECEIVED, (inv) => {
      console.log('[PARTNER_INVITATION_RECEIVED on Shree]:', inv.senderName, 'game:', inv.gameType);
      resolve(inv);
    });
  });

  const inviteRes = await request(app)
    .post('/api/invitations/invite-partner')
    .set('Authorization', `Bearer ${arpitToken}`)
    .send({ gameType: 'uno' });

  console.log('[7] Invite API response status:', inviteRes.status);
  const receivedInvite = await invitePromise;
  console.log('[8] Shree received in-app popup invite:', receivedInvite.id);

  console.log('[9] Shree accepts invitation...');
  const acceptedPromise = new Promise<any>((resolve) => {
    arpitSocket.once(SOCKET_EVENTS.PARTNER_ACCEPTED, (data) => {
      console.log('[PARTNER_ACCEPTED on Arpit]: session:', data.sessionId, 'game:', data.gameType);
      resolve(data);
    });
  });

  const acceptRes = await request(app)
    .post(`/api/invitations/${receivedInvite.id}/accept`)
    .set('Authorization', `Bearer ${shreeToken}`);

  console.log('[9] Accept API response status:', acceptRes.status, 'Session ID:', acceptRes.body.sessionId);
  await acceptedPromise;
  console.log('[10] Full direct partner multiplayer session established successfully!');

  // [11] Test Cancellation
  console.log('[11] Testing Arpit cancelling direct invitation...');
  const inv2Res = await request(app)
    .post('/api/invitations/invite-partner')
    .set('Authorization', `Bearer ${arpitToken}`)
    .send({ gameType: 'ludo' });

  const cancelPromise = new Promise<any>((resolve) => {
    shreeSocket.once(SOCKET_EVENTS.PARTNER_INVITATION_CANCELLED, (data) => {
      console.log('[PARTNER_INVITATION_CANCELLED on Shree]:', data);
      resolve(data);
    });
  });

  await request(app)
    .post(`/api/invitations/${inv2Res.body.invitation.id}/cancel`)
    .set('Authorization', `Bearer ${arpitToken}`)
    .expect(200);

  await cancelPromise;
  console.log('[12] Cancellation verified in real-time!');

  // [13] Test Decline
  console.log('[13] Testing Shree declining direct invitation...');
  const inv3Res = await request(app)
    .post('/api/invitations/invite-partner')
    .set('Authorization', `Bearer ${arpitToken}`)
    .send({ gameType: 'chess' });

  const declinePromise = new Promise<any>((resolve) => {
    arpitSocket.once(SOCKET_EVENTS.PARTNER_DECLINED, (data) => {
      console.log('[PARTNER_DECLINED on Arpit]:', data);
      resolve(data);
    });
  });

  await request(app)
    .post(`/api/invitations/${inv3Res.body.invitation.id}/decline`)
    .set('Authorization', `Bearer ${shreeToken}`)
    .expect(200);

  await declinePromise;
  console.log('[14] Decline verified in real-time!');

  // [15] Test Partner Disconnect & Offline Protection
  console.log('[15] Testing partner disconnect & offline protection...');
  const offlinePromise = new Promise<any>((resolve) => {
    arpitSocket.on(SOCKET_EVENTS.PARTNER_STATUS, (data) => {
      if (!data.isOnline) {
        console.log('[PARTNER_STATUS on Arpit - Offline Detected]:', data);
        resolve(data);
      }
    });
  });

  shreeSocket.disconnect();
  await offlinePromise;
  console.log('[16] Shree offline detection confirmed!');

  // Cleanup
  arpitSocket.disconnect();
  (server as any).closeAllConnections?.();
  server.close(() => {
    console.log('[17] Server closed cleanly. ALL 17 CHECKS PASSED!');
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 1000);
}

run().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
