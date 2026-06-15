import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

let db = null;

export function getDb() {
  if (db) return db;

  const dataDir = path.resolve('server/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(path.join(dataDir, 'auth.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operator',
      department TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count.count === 0) {
    seedUsers();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS lots (
      id TEXT PRIMARY KEY,
      lot_number TEXT UNIQUE NOT NULL,
      party_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      fabric_type TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      dispatched_at TEXT
    )
  `);

  const partyCount = db.prepare('SELECT COUNT(*) as count FROM parties').get();
  if (partyCount.count === 0) {
    seedParties();
  }

  return db;
}

function seedUsers() {
  const salt = bcrypt.genSaltSync(10);
  const hash = (pw) => bcrypt.hashSync(pw, salt);

  const users = [
    { id: crypto.randomUUID(), email: 'admin@textileflow.com', name: 'Admin User', password: 'password123', role: 'admin', department: 'admin' },
    { id: crypto.randomUUID(), email: 'supervisor@textileflow.com', name: 'Supervisor User', password: 'password123', role: 'supervisor', department: 'admin' },
    { id: crypto.randomUUID(), email: 'grey@textileflow.com', name: 'Grey Operator', password: 'password123', role: 'operator', department: 'grey' },
    { id: crypto.randomUUID(), email: 'batching@textileflow.com', name: 'Batching Operator', password: 'password123', role: 'operator', department: 'batching' },
    { id: crypto.randomUUID(), email: 'scouring@textileflow.com', name: 'Scouring Operator', password: 'password123', role: 'operator', department: 'scouring' },
    { id: crypto.randomUUID(), email: 'bleaching@textileflow.com', name: 'Bleaching Operator', password: 'password123', role: 'operator', department: 'bleaching' },
    { id: crypto.randomUUID(), email: 'dyeing@textileflow.com', name: 'Dyeing Operator', password: 'password123', role: 'operator', department: 'dyeing' },
    { id: crypto.randomUUID(), email: 'hydro@textileflow.com', name: 'Hydro Operator', password: 'password123', role: 'operator', department: 'hydro' },
    { id: crypto.randomUUID(), email: 'drying@textileflow.com', name: 'Drying Operator', password: 'password123', role: 'operator', department: 'drying' },
    { id: crypto.randomUUID(), email: 'printing@textileflow.com', name: 'Printing Operator', password: 'password123', role: 'operator', department: 'printing' },
    { id: crypto.randomUUID(), email: 'brushing@textileflow.com', name: 'Brushing Operator', password: 'password123', role: 'operator', department: 'brushing' },
    { id: crypto.randomUUID(), email: 'compacting@textileflow.com', name: 'Compacting Operator', password: 'password123', role: 'operator', department: 'compacting' },
    { id: crypto.randomUUID(), email: 'antipilling@textileflow.com', name: 'Anti Pilling Operator', password: 'password123', role: 'operator', department: 'anti_pilling' },
    { id: crypto.randomUUID(), email: 'finishing@textileflow.com', name: 'Finishing Operator', password: 'password123', role: 'operator', department: 'finishing' },
    { id: crypto.randomUUID(), email: 'packing@textileflow.com', name: 'Packing Operator', password: 'password123', role: 'operator', department: 'packing' },
  ];

  const insert = db.prepare(
    'INSERT INTO users (id, email, name, password_hash, role, department) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const insertMany = db.transaction((usrs) => {
    for (const u of usrs) {
      insert.run(u.id, u.email, u.name, hash(u.password), u.role, u.department);
    }
  });

  insertMany(users);
  console.log('Seeded 3 test users');
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

export function getUserByEmail(email) {
  const dbConn = getDb();
  const user = dbConn.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return sanitizeUser(user);
}

export function getUserById(id) {
  const dbConn = getDb();
  const user = dbConn.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return sanitizeUser(user);
}

export function verifyPassword(plaintext, hash) {
  return bcrypt.compareSync(plaintext, hash);
}

export function storeRefreshToken(tokenHash, userId) {
  const dbConn = getDb();
  dbConn.prepare('INSERT INTO refresh_tokens (token_hash, user_id) VALUES (?, ?)').run(tokenHash, userId);
}

export function getRefreshToken(tokenHash) {
  const dbConn = getDb();
  return dbConn.prepare('SELECT * FROM refresh_tokens WHERE token_hash = ?').get(tokenHash);
}

export function deleteRefreshToken(tokenHash) {
  const dbConn = getDb();
  dbConn.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash);
}

// ============================================================
// Password Reset Token helpers
// ============================================================

export function storeResetToken(tokenHash, userId, expiresAt) {
  const dbConn = getDb();
  dbConn.prepare('INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(tokenHash, userId, expiresAt);
}

export function getValidResetToken(tokenHash) {
  const dbConn = getDb();
  return dbConn.prepare("SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')").get(tokenHash);
}

export function markResetTokenUsed(tokenHash) {
  const dbConn = getDb();
  dbConn.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token_hash = ?').run(tokenHash);
}

export function updateUserPassword(userId, newPasswordHash) {
  const dbConn = getDb();
  dbConn.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, userId);
}

export function getUserByEmailWithHash(email) {
  const dbConn = getDb();
  return dbConn.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

// ============================================================
// Party helpers — WhatsApp notification phone lookups
// ============================================================

function seedParties() {
  const parties = [
    { id: crypto.randomUUID(), name: 'Satya International', phone: '+919000000001' },
    { id: crypto.randomUUID(), name: 'Rajan Textiles', phone: '+919000000002' },
    { id: crypto.randomUUID(), name: 'Gupta Fabrics Pvt. Ltd.', phone: '+919000000003' },
    { id: crypto.randomUUID(), name: 'Sharma & Sons Exports', phone: '+919000000004' },
    { id: crypto.randomUUID(), name: 'Krishna Mills', phone: '+919000000005' },
    { id: crypto.randomUUID(), name: 'Naveen Dyeing Works', phone: '+919000000006' },
    { id: crypto.randomUUID(), name: 'Udaybir Singh', phone: '+918427702500' },
  ];

  const insert = db.prepare(
    'INSERT INTO parties (id, name, phone) VALUES (?, ?, ?)'
  );

  const insertMany = db.transaction((prts) => {
    for (const p of prts) {
      insert.run(p.id, p.name, p.phone);
    }
  });

  insertMany(parties);
  console.log('Seeded 6 parties with phone numbers');
}

export function getPartyByName(name) {
  const dbConn = getDb();
  return dbConn.prepare('SELECT * FROM parties WHERE name = ?').get(name);
}

export function getPartyById(id) {
  const dbConn = getDb();
  return dbConn.prepare('SELECT * FROM parties WHERE id = ?').get(id);
}

export function getAllParties() {
  const dbConn = getDb();
  return dbConn.prepare('SELECT * FROM parties ORDER BY name').all();
}

export function upsertParty(name, phone) {
  const dbConn = getDb();
  const id = crypto.randomUUID();
  dbConn.prepare(
    'INSERT INTO parties (id, name, phone) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET phone = excluded.phone'
  ).run(id, name, phone);
}

// ============================================================
// Lot helpers — inbound WhatsApp lot status queries
// ============================================================

export function upsertLot(lotNumber, partyName, quantity, fabricType) {
  const dbConn = getDb();
  const id = crypto.randomUUID();
  dbConn.prepare(
    'INSERT INTO lots (id, lot_number, party_name, quantity, fabric_type) VALUES (?, ?, ?, ?, ?) ON CONFLICT(lot_number) DO UPDATE SET quantity = excluded.quantity, party_name = excluded.party_name, fabric_type = excluded.fabric_type'
  ).run(id, lotNumber, partyName, quantity, fabricType);
}

export function markLotDispatched(lotNumber) {
  const dbConn = getDb();
  dbConn.prepare("UPDATE lots SET status = 'dispatched', dispatched_at = datetime('now') WHERE lot_number = ?").run(lotNumber);
}

export function getPartyByPhone(phone) {
  const dbConn = getDb();
  return dbConn.prepare('SELECT * FROM parties WHERE phone = ?').get(phone);
}

export function getTotalLotQuantityByParty(partyName) {
  const dbConn = getDb();
  const row = dbConn.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM lots WHERE party_name = ? AND status = 'active'").get(partyName);
  return row ? row.total : 0;
}

export function getActiveLotCountByParty(partyName) {
  const dbConn = getDb();
  const row = dbConn.prepare("SELECT COUNT(*) as count FROM lots WHERE party_name = ? AND status = 'active'").get(partyName);
  return row ? row.count : 0;
}
