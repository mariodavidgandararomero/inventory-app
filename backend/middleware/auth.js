const jwt = require('jsonwebtoken');
const { get } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_prod';

// ── Verificar token ────────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de acceso requerido' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Verificar que el usuario sigue activo en la DB
    const user = get(
      `SELECT u.id, u.name, u.email, u.is_active, r.name as role, r.permissions
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ?`,
      [payload.userId]
    );

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, error: 'Usuario inactivo o no encontrado' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: JSON.parse(user.permissions || '[]'),
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ success: false, error: 'Token inválido' });
  }
}

// ── Verificar permiso específico ───────────────────────────────────────────────
function authorize(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    const hasAll = requiredPermissions.every(perm =>
      req.user.permissions.includes(perm)
    );

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Necesitas: ${requiredPermissions.join(', ')}`,
        required: requiredPermissions,
        role: req.user.role,
      });
    }
    next();
  };
}

// ── Solo admin ─────────────────────────────────────────────────────────────────
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Solo administradores pueden realizar esta acción' });
  }
  next();
}

module.exports = { authenticate, authorize, adminOnly, JWT_SECRET };
