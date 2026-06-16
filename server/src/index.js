import 'express-async-errors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { getDb } from './db.js';

dotenv.config({ path: '.env' });

import authRouter from './routes/auth.js';
import notificationsRouter from './routes/notifications.js';
import { handleWhatsAppWebhook } from './routes/whatsapp-webhook.js';
import ocrRouter from './routes/ocr.js';
import lotsRouter from './routes/lots.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(helmet());
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (server-to-server, curl)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // Allow Vercel preview deployments
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Rate Limiting — only on auth-sensitive routes, not all API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

const ocrLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 OCR requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many document scans. Please try again in an hour.' },
});

// Apply rate limiting
app.use('/api/ocr', ocrLimiter);

app.get('/api/health', (_req, res) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/auth', authRouter);

// Public webhook — no auth required (must come before authenticated notification routes)
app.post('/api/whatsapp/webhook', handleWhatsAppWebhook);

app.use('/api/notifications', notificationsRouter);
app.use('/api/whatsapp', notificationsRouter);
app.use('/api/ocr', ocrRouter);
app.use('/api/lots', lotsRouter);

app.listen(PORT, () => {
  console.log(`TextileFlow server running on port ${PORT}`);
  console.log(`WhatsApp mode: ${process.env.WHATSAPP_MODE || 'NOT SET'} (file: .env)`);
  console.log(`Twilio SID set: ${!!process.env.TWILIO_ACCOUNT_SID}`);
});
