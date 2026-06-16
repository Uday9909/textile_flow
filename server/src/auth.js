import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

function requireEnv(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}. Set it in server/.env or Render dashboard.`);
  return val;
}

function getAccessSecret() {
  return new TextEncoder().encode(requireEnv('JWT_ACCESS_SECRET'));
}

function getRefreshSecret() {
  return new TextEncoder().encode(requireEnv('JWT_REFRESH_SECRET'));
}

export async function createAccessToken(user) {
  const expiresIn = parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '900', 10);

  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${expiresIn}s`)
    .sign(getAccessSecret());
}

export async function verifyAccessToken(token) {
  const { payload } = await jwtVerify(token, getAccessSecret(), {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function createRefreshToken(userId) {
  const expiresIn = parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800', 10);

  return new SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${expiresIn}s`)
    .sign(getRefreshSecret());
}

export async function verifyRefreshToken(token) {
  const { payload } = await jwtVerify(token, getRefreshSecret(), {
    algorithms: ['HS256'],
  });
  return payload;
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
