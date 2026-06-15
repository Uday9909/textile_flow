// ============================================================
// authorize — Role-based access control middleware
// Chains after authenticate; checks req.user.role against allowedRoles
// ============================================================

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
