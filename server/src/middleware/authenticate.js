import { verifyAccessToken } from '../auth.js';

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      department: decoded.department,
    };
    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Authentication required' });
  }
}
