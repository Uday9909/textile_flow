// ============================================================
// TextileFlow MES — Lots CRUD API
// ============================================================

import { Router } from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { getDb } from '../db.js';

const router = Router();
router.use(authenticate);

// GET /api/lots — list lots with optional filters
router.get('/', (req, res) => {
  const { party, department, status, limit = 200 } = req.query;
  const db = getDb();

  let sql = 'SELECT * FROM lots WHERE 1=1';
  const params = [];

  if (party) { sql += ' AND party_name = ?'; params.push(party); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (department) {
    sql += " AND (stage_history LIKE ? OR department = ?)";
    params.push(`%${department}%`, department);
  }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit) || 200);

  const lots = db.prepare(sql).all(...params);
  res.json({ lots, total: lots.length });
});

// GET /api/lots/:id — get single lot
router.get('/:id', (req, res) => {
  const db = getDb();
  const lot = db.prepare('SELECT * FROM lots WHERE id = ? OR lot_number = ?').get(req.params.id, req.params.id);
  if (!lot) return res.status(404).json({ error: 'Lot not found' });
  res.json(lot);
});

// POST /api/lots — create a new lot
router.post('/', (req, res) => {
  const { lotNumber, partyName, quantity, fabricType, colour, stages, priority } = req.body;
  if (!lotNumber || !partyName) {
    return res.status(400).json({ error: 'lotNumber and partyName are required' });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const stageHistory = stages ? stages.map((s, i) => ({
    stageId: s, status: i === 0 ? 'waiting' : 'pending', startTime: null, endTime: null,
  })) : [];

  db.prepare(`INSERT INTO lots (id, lot_number, party_name, quantity, fabric_type, colour, stages, current_stage_index, status, stage_history, priority, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    id, lotNumber, partyName, quantity || 0, fabricType || '', colour || '',
    JSON.stringify(stages || []), 0, 'waiting', JSON.stringify(stageHistory), priority || 'normal'
  );

  const lot = db.prepare('SELECT * FROM lots WHERE id = ?').get(id);
  res.status(201).json(lot);
});

// PATCH /api/lots/:id — update lot (stage progression, status, etc.)
router.patch('/:id', (req, res) => {
  const db = getDb();
  const lot = db.prepare('SELECT * FROM lots WHERE id = ? OR lot_number = ?').get(req.params.id, req.params.id);
  if (!lot) return res.status(404).json({ error: 'Lot not found' });

  const { currentStageIndex, status, stageHistory } = req.body;
  const updates = [];
  const params = [];

  if (currentStageIndex !== undefined) { updates.push('current_stage_index = ?'); params.push(currentStageIndex); }
  if (status) { updates.push('status = ?'); params.push(status); }
  if (stageHistory) { updates.push('stage_history = ?'); params.push(JSON.stringify(stageHistory)); }

  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

  params.push(lot.id);
  db.prepare(`UPDATE lots SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM lots WHERE id = ?').get(lot.id);
  res.json(updated);
});

export default router;
