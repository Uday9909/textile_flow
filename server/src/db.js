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

  const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count.count === 0) {
    seedUsers();
  }

  return db;
}

function seedUsers() {
  const salt = bcrypt.genSaltSync(10);
  const hash = (pw) => bcrypt.hashSync(pw, salt);

  const users = [
    { id: crypto.randomUUID(), email: 'admin@textileflow.com', name: 'Admin User', password: 'password123', role: 'admin', department: 'admin' },
    { id: crypto.randomUUID(), email: 'supervisor@textileflow.com', name: 'Supervisor User', password: 'password123', role: 'supervisor', department: 'admin' },
    { id: crypto.randomUUID(), email: 'operator@textileflow.com', name: 'Operator User', password: 'password123', role: 'operator', department: 'dyeing' },
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
