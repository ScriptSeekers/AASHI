import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load env
dotenv.config();

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import { errorHandler } from './middleware/errorHandler.js';
import { initSocketManager } from './sockets/socketManager.js';
import { prisma } from './database/db.js';
import { seedDatabase } from './database/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 3001;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

// Middleware
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    brand: 'AASHI',
    tagline: 'Love hard. Play harder.',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/statistics', statsRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use(errorHandler);

// Serve Web Frontend in Production if built
const webDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

// Socket.io Setup
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 15000
});

initSocketManager(io);

async function ensureDbSeeded() {
  try {
    const existingArpit = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'arpit@aashi.com' },
          { email: 'arpit@duvora.com' }
        ]
      }
    });
    if (!existingArpit) {
      console.log('⚡ Empty database detected. Auto-seeding Arpit & Shree for AASHI...');
      await seedDatabase();
    } else if (existingArpit.email === 'arpit@duvora.com') {
      await prisma.user.updateMany({
        where: { email: 'arpit@duvora.com' },
        data: { email: 'arpit@aashi.com' }
      });
      await prisma.user.updateMany({
        where: { email: 'shree@duvora.com' },
        data: { email: 'shree@aashi.com' }
      });
      console.log('⚡ Auto-migrated accounts to arpit@aashi.com & shree@aashi.com');
    }
  } catch (err: any) {
    console.warn('⚡ DB init notice:', err.message);
  }
}

// Start server
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  ensureDbSeeded().finally(() => {
    if (!server.listening) {
      server.listen(PORT, '0.0.0.0', () => {
      console.log(`
      💗 AASHI SERVER ONLINE
      ═════════════════════════════════════════════════
      📡 API Running at:    http://0.0.0.0:${PORT}/api
      ⚡ Socket.IO Ready:   ws://0.0.0.0:${PORT}
      💕 Brand Tagline:     Love hard. Play harder.
      ═════════════════════════════════════════════════
      `);
      });
    }
  });
}

export { app, server, io };
