// ============================================================
// TextileFlow MES — WhatsApp Notification Service
// ============================================================
// Supports two modes:
//   WHATSAPP_MODE=log    — log messages to console (development)
//   WHATSAPP_MODE=twilio — send via Twilio API (production)
// ============================================================

const MODE = process.env.WHATSAPP_MODE || 'log';

// Lazy-import twilio only when in production mode
let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient && MODE === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not configured — falling back to log mode');
      return null;
    }
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Send a WhatsApp message to a party.
 * @param {string} to - Phone number with country code (e.g., +919876543210)
 * @param {string} body - Message text
 * @returns {Promise<{sent: boolean, mode: string, messageId?: string}>}
 */
export async function sendWhatsApp(to, body) {
  if (!to) {
    console.warn('[WhatsApp] No phone number provided — skipping');
    return { sent: false, mode: MODE, reason: 'no_recipient' };
  }

  if (MODE === 'twilio') {
    const client = getTwilioClient();
    if (!client) {
      console.warn('[WhatsApp] Twilio client not available — falling back to log');
      return sendLog(to, body);
    }

    try {
      const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
      const message = await client.messages.create({
        from,
        to: `whatsapp:${to}`,
        body,
      });
      console.log(`[WhatsApp] Sent to ${to}: ${message.sid}`);
      return { sent: true, mode: 'twilio', messageId: message.sid };
    } catch (err) {
      console.error(`[WhatsApp] Failed to send to ${to}:`, err.message);
      return { sent: false, mode: 'twilio', reason: err.message };
    }
  }

  return sendLog(to, body);
}

function sendLog(to, body) {
  console.log('═══════════════════════════════════════════');
  console.log('  [WhatsApp Dev Mode] Message');
  console.log('───────────────────────────────────────────');
  console.log(`  To:   ${to}`);
  console.log(`  Body: ${body}`);
  console.log('═══════════════════════════════════════════');
  return { sent: true, mode: 'log' };
}

/**
 * Compose lot arrival notification message.
 */
export function composeArrivalMessage(partyName, lotNumber, quantity, fabricType) {
  return [
    `Dear ${partyName},`,
    ``,
    `Your lot ${lotNumber} has been received at our textile facility.`,
    ``,
    `Details:`,
    `  • Quantity: ${quantity}`,
    `  • Fabric: ${fabricType || 'N/A'}`,
    ``,
    `We will process it through the production stages and notify you on dispatch.`,
    ``,
    `— TextileFlow MES`,
  ].join('\n');
}

/**
 * Compose lot dispatch notification message.
 */
export function composeDispatchMessage(partyName, lotNumber, quantity) {
  return [
    `Dear ${partyName},`,
    ``,
    `Your lot ${lotNumber} has been dispatched from our facility.`,
    ``,
    `Dispatched Quantity: ${quantity}`,
    ``,
    `Thank you for your business!`,
    ``,
    `— TextileFlow MES`,
  ].join('\n');
}
