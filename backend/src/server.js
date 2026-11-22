// server.js
import './config/env.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import calorieRoutes from './routes/calorieRoutes.js';

/** NEW AI ROUTES */
import aiSearchRoute from './routes/aiSearch.js';
import chatbotRoute from './routes/chatbot.js';
import scannerRoute from './routes/scanner.js';
import usdaRoute from './routes/usda.js';
import aiScannerRoute from './routes/aiScanner.js';

import { errorHandler } from './middleware/errorHandler.js';
import { initCronJobs } from './utils/cronJobs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.disable('x-powered-by');

/** startup diagnostics */
console.log('[BOOT] FRONTEND_URL:', process.env.FRONTEND_URL || '(not set)');
console.log('[BOOT] NODE_ENV:', process.env.NODE_ENV || 'dev');

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

/** request logger (light) */
app.use((req, res, next) => {
  console.log('[REQUEST]', req.method, req.originalUrl.replace(/[\r\n]/g, ''));
  next();
});

/** CORS */
// Configure allowed origins via ALLOWED_ORIGINS or FRONTEND_URL (supports comma-separated list).
const envOrigins = [
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(u => u.trim()) : []),
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : []),
].filter(Boolean);

const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

const isProduction = process.env.NODE_ENV === 'production';
// In production, enforce explicit origins from environment variables.
// Fallback to dev origins only if no origins are configured or in dev.
const allowedOrigins = Array.from(new Set([
  ...envOrigins,
  ...(!isProduction || envOrigins.length === 0 ? devOrigins : [])
]));

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server, health checks)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true
  })
);

app.use(morgan('dev'));

/** static files */
const publicDir = process.env.PUBLIC_DIR || path.resolve(__dirname, '../public');
const uploadsDir = process.env.UPLOADS_DIR || path.join(publicDir, 'uploads');
app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));

/** health checks */
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', env: process.env.NODE_ENV || 'dev', timestamp: new Date().toISOString() }));

/** main routes */
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/users', settingsRoutes);
app.use('/api/calories', calorieRoutes);

/** AI routes: mounted under /api/items so router.post('/ai-search') -> /api/items/ai-search */
app.use('/api/items', aiSearchRoute);

/** chatbot */
app.use('/api/chat', chatbotRoute);

/** usda food search */
app.use('/api/usda', usdaRoute);
app.use('/api/ai', aiScannerRoute);

/** 404 */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

/** error handler */
app.use(errorHandler);

/** start */
const port = Number(process.env.PORT) || 5000;
connectDB()
  .then(() => {
    initCronJobs();
    app.listen(port, '0.0.0.0', () => {
      console.log(`SmartShelf API running on port ${port} (env: ${process.env.NODE_ENV || 'dev'})`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err?.message || err);
    process.exit(1);
  });

export default app;


