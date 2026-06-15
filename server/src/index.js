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

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

app.listen(PORT, () => {
  console.log(`TextileFlow server running on port ${PORT}`);
  console.log(`WhatsApp mode: ${process.env.WHATSAPP_MODE || 'NOT SET'} (file: .env)`);
  console.log(`Twilio SID set: ${!!process.env.TWILIO_ACCOUNT_SID}`);
});
