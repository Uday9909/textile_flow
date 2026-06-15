// ============================================================
// TextileFlow MES — Notification API Routes
// ============================================================

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import {
  sendWhatsApp,
  composeArrivalMessage,
  composeDispatchMessage,
} from '../services/whatsapp.js';
import {
  getPartyByName,
} from '../db.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * POST /api/notifications/lot-arrival
 * Send arrival notification to party when lot enters factory
 * Body: { partyName, lotNumber, quantity, fabricType }
 */
router.post('/lot-arrival', async (req, res) => {
  const { partyName, lotNumber, quantity, fabricType } = req.body;

  if (!partyName || !lotNumber) {
    return res.status(400).json({ error: 'partyName and lotNumber are required' });
  }

  const party = getPartyByName(partyName);
  if (!party || !party.phone) {
    return res.status(200).json({
      sent: false,
      reason: 'Party not found or no phone number configured',
      partyName,
    });
  }

  const message = composeArrivalMessage(party.name, lotNumber, quantity, fabricType);
  const result = await sendWhatsApp(party.phone, message);

  res.status(result.sent ? 200 : 500).json({
    ...result,
    partyName: party.name,
    lotNumber,
  });
});

/**
 * POST /api/notifications/lot-dispatch
 * Send dispatch notification to party when lot ships
 * Body: { partyName, lotNumber, quantity }
 */
router.post('/lot-dispatch', async (req, res) => {
  const { partyName, lotNumber, quantity } = req.body;

  if (!partyName || !lotNumber) {
    return res.status(400).json({ error: 'partyName and lotNumber are required' });
  }

  const party = getPartyByName(partyName);
  if (!party || !party.phone) {
    return res.status(200).json({
      sent: false,
      reason: 'Party not found or no phone number configured',
      partyName,
    });
  }

  const message = composeDispatchMessage(party.name, lotNumber, quantity);
  const result = await sendWhatsApp(party.phone, message);

  res.status(result.sent ? 200 : 500).json({
    ...result,
    partyName: party.name,
    lotNumber,
  });
});

/**
 * GET /api/whatsapp/status
 * Check WhatsApp service configuration status
 */
router.get('/status', authorize('admin', 'supervisor'), (_req, res) => {
  const mode = process.env.WHATSAPP_MODE || 'log';
  const hasCredentials = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  res.json({
    mode,
    configured: mode === 'twilio' ? hasCredentials : true,
    twilioConfigured: hasCredentials,
    message: mode === 'twilio'
      ? (hasCredentials ? 'Twilio configured' : 'Twilio mode but credentials missing — check .env')
      : 'Development mode — messages logged to console',
  });
});

export default router;
