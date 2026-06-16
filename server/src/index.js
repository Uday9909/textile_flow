import 'express-async-errors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
