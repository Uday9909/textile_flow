// ============================================================
// TextileFlow MES — OCR Route (Gemini Vision)
// ============================================================

import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

function getGenAI() {
  const key = process.env.GEMINI_API_KEY || '';
  if (!key) throw new Error('GEMINI_API_KEY not configured in server/.env');
  return new GoogleGenerativeAI(key);
}

const EXTRACTION_PROMPT = `You are a challan/invoice OCR system for a textile factory.
Extract the following fields from this challan image and return ONLY valid JSON (no markdown, no explanation):
{
  "partyName": "name of the party/customer (e.g., Udaybir Singh)",
  "quantity": "numeric quantity value only (e.g., 500)",
  "lotNumber": "challan or lot number (e.g., LOT-001)",
  "colour": "fabric colour or shade name if mentioned (e.g., White, Red, Blue)"
}

If a field is not found, use an empty string "". Do NOT guess or make up values.`;

router.post('/challan', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Support both base64 data URLs and raw base64
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      { text: EXTRACTION_PROMPT },
      { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
    ]);

    const response = await result.response;
    const text = response.text().trim();

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(422).json({ error: 'Failed to parse OCR result', raw: text });
    }

    const data = JSON.parse(jsonMatch[0]);
    res.json({ ...data, raw: text });
  } catch (err) {
    console.error('[OCR] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
