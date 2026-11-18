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
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('vercel.app') ||
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for custom/preview domains
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    brand: 'DUVORA',
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
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('⚡ Empty database detected. Auto-seeding Arpit & Shree...');
      await seedDatabase();
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
      💗 DUVORA SERVER ONLINE
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
