// ============================================================
// TextileFlow MES — WhatsApp Inbound Webhook Handler
// ============================================================
// Receives incoming WhatsApp messages from Twilio at POST /api/whatsapp/webhook
// Looks up the sender's party by phone number and replies with lot status.
// In dev/log mode, returns JSON for curl testing instead of TwiML.
// ============================================================

import {
  getPartyByPhone,
  getTotalLotQuantityByParty,
  getActiveLotCountByParty,
} from '../db.js';

export async function handleWhatsAppWebhook(req, res) {
  const { From, Body } = req.body;

  if (!From) {
    return res.status(400).send('Missing From parameter');
  }

  // Strip "whatsapp:" prefix from the From field (e.g., "whatsapp:+919000000001")
  const phone = From.replace('whatsapp:', '');

  // Log incoming message in all modes
  console.log(`[WhatsApp Webhook] Incoming from ${phone}: "${Body}"`);

  // Look up party by phone number
  const party = getPartyByPhone(phone);

  if (!party) {
    console.log(`[WhatsApp Webhook] No party found for phone ${phone}`);
    const replyText = 'Thank you for contacting TextileFlow. Your WhatsApp number is not registered in our system. Please contact the factory to register your number for lot updates.';

    if (process.env.WHATSAPP_MODE === 'twilio') {
      const twilio = (await import('twilio')).default;
      const MessagingResponse = twilio.twiml.MessagingResponse;
      const twiml = new MessagingResponse();
      twiml.message(replyText);
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Dev mode: log the intended reply
    console.log('[WhatsApp Webhook Dev] Reply:', replyText);
    return res.json({ received: true, mode: 'log', reply: replyText });
  }

  // Party found — query their lot data
  const totalQuantity = getTotalLotQuantityByParty(party.name);
  const activeLotCount = getActiveLotCountByParty(party.name);

  const replyText = [
    `Dear ${party.name},`,
    '',
    `Your current lot status at TextileFlow:`,
    `  • Active lots: ${activeLotCount}`,
    `  • Total quantity in factory: ${totalQuantity} kg`,
    '',
    `Thank you.`,
    `— TextileFlow MES`,
  ].join('\n');

  console.log(`[WhatsApp Webhook] Party: ${party.name}, Active lots: ${activeLotCount}, Total: ${totalQuantity}kg`);

  if (process.env.WHATSAPP_MODE === 'twilio') {
    const twilio = (await import('twilio')).default;
    const MessagingResponse = twilio.twiml.MessagingResponse;
    const twiml = new MessagingResponse();
    twiml.message(replyText);
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  // Dev mode: log the intended reply
  console.log('[WhatsApp Webhook Dev] Reply:', replyText);
  console.log('[WhatsApp Webhook Dev] ---');
  res.json({ received: true, mode: 'log', reply: replyText });
}
