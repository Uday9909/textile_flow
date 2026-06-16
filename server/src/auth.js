import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

// Dev fallback secrets — generated once at startup, not per-request
const DEV_ACCESS_SECRET = 'dev-access-secret-min-32-chars!!';
const DEV_REFRESH_SECRET = 'dev-refresh-secret-min-32-chars!!';

function getAccessSecret() {
  const val = process.env.JWT_ACCESS_SECRET;
  if (val) return new TextEncoder().encode(val);
  console.warn('WARN: JWT_ACCESS_SECRET not set — using dev fallback. Set it in production.');
  return new TextEncoder().encode(DEV_ACCESS_SECRET);
}

function getRefreshSecret() {
  const val = process.env.JWT_REFRESH_SECRET;
  if (val) return new TextEncoder().encode(val);
  console.warn('WARN: JWT_REFRESH_SECRET not set — using dev fallback. Set it in production.');
  return new TextEncoder().encode(DEV_REFRESH_SECRET);
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
