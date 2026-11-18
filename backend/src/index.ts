import http from 'http';
import express from 'express';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
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
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true); // Dev permissive
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
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
const webDistPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
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

// Start server
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`
    💗 DUVORA SERVER ONLINE
    ═════════════════════════════════════════════════
    📡 API Running at:    http://localhost:${PORT}/api
    ⚡ Socket.IO Ready:   ws://localhost:${PORT}
    💕 Brand Tagline:     Love hard. Play harder.
    ═════════════════════════════════════════════════
    `);
  });
}

export { app, server, io };
