import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} from '../auth.js';
import {
  getUserByEmail,
  getUserById,
  verifyPassword,
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  storeResetToken,
  getValidResetToken,
  markResetTokenUsed,
  updateUserPassword,
  getUserByEmailWithHash,
} from '../db.js';
import { authenticate } from '../middleware/authenticate.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Try again later.' },
});

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Need password_hash for verification but getUserByEmail strips it,
  // so we query directly in this handler.
  const { getDb } = await import('../db.js');
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user.id);
  const tokenHash = hashToken(refreshToken);
  storeRefreshToken(tokenHash, user.id);

  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    },
    accessToken,
    accessTokenExpiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900', 10),
  });
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = getUserByEmailWithHash(email);

  if (!user) {
    return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  }

  const token = crypto.randomUUID();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  storeResetToken(tokenHash, user.id, expiresAt);

  console.log(`\n[Password Reset] Link for ${user.email}: http://localhost:5173/reset-password/${token}\n`);

  res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password || typeof token !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetToken = getValidResetToken(tokenHash);

  if (!resetToken) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  updateUserPassword(resetToken.user_id, passwordHash);
  markResetTokenUsed(tokenHash);

  res.json({ message: 'Password has been reset successfully' });
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Session expired' });
  }

  let decoded;
  try {
    decoded = await verifyRefreshToken(refreshToken);
  } catch (_err) {
    return res.status(401).json({ error: 'Session expired' });
  }

  const tokenHash = hashToken(refreshToken);
  const stored = getRefreshToken(tokenHash);

  if (!stored) {
    return res.status(401).json({ error: 'Session expired' });
  }

  // Rotate: delete old token
  deleteRefreshToken(tokenHash);

  const user = getUserById(decoded.sub);
  if (!user) {
    return res.status(401).json({ error: 'Session expired' });
  }

  const newAccessToken = await createAccessToken(user);
  const newRefreshToken = await createRefreshToken(user.id);
  const newTokenHash = hashToken(newRefreshToken);
  storeRefreshToken(newTokenHash, user.id);

  res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

  res.json({
    accessToken: newAccessToken,
    accessTokenExpiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900', 10),
  });
});

router.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    try {
      const decoded = await verifyRefreshToken(refreshToken);
      const tokenHash = hashToken(refreshToken);
      deleteRefreshToken(tokenHash);
    } catch (_err) {
      // Token invalid or expired — still clear the cookie
    }
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  });

  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
