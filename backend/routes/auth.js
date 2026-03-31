const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { get, run, all } = require('../database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN      || '8h';
const JWT_REFRESH_EXPIRES  = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
  return { accessToken, refreshToken };
}

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = get(
        `SELECT u.*, r.name as role_name, r.permissions
         FROM users u JOIN roles r ON r.id = u.role_id
         WHERE u.email = ? AND u.is_active = 1`,
        [email]
      );

      if (!user) {
        return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
      }

      const { accessToken, refreshToken } = generateTokens(user.id);

      // Guardar refresh token en DB (7 días)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      run(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?,?,?)`,
        [user.id, refreshToken, expiresAt]
      );

      // Actualizar last_login
      run(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role_name,
            permissions: JSON.parse(user.permissions || '[]'),
          },
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ── POST /api/auth/refresh ─────────────────────────────────────────────────────
router.post('/refresh',
  body('refreshToken').notEmpty(),
  validate,
  (req, res) => {
    try {
      const { refreshToken } = req.body;

      const payload = jwt.verify(refreshToken, JWT_SECRET);
      if (payload.type !== 'refresh') {
        return res.status(403).json({ success: false, error: 'Token inválido' });
      }

      // Verificar que el token existe en DB y no está expirado
      const stored = get(
        `SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP`,
        [refreshToken]
      );
      if (!stored) {
        return res.status(403).json({ success: false, error: 'Token expirado o revocado' });
      }

      const user = get(
        `SELECT u.*, r.name as role_name, r.permissions
         FROM users u JOIN roles r ON r.id = u.role_id
         WHERE u.id = ? AND u.is_active = 1`,
        [payload.userId]
      );
      if (!user) {
        return res.status(403).json({ success: false, error: 'Usuario no encontrado' });
      }

      // Rotar tokens: eliminar el viejo, emitir nuevos
      run(`DELETE FROM refresh_tokens WHERE token = ?`, [refreshToken]);
      const { accessToken, refreshToken: newRefresh } = generateTokens(user.id);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      run(`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?,?,?)`,
        [user.id, newRefresh, expiresAt]);

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefresh,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role_name,
            permissions: JSON.parse(user.permissions || '[]'),
          },
        },
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ success: false, error: 'Refresh token expirado, inicia sesión nuevamente' });
      }
      res.status(403).json({ success: false, error: 'Token inválido' });
    }
  }
);

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  const user = get(
    `SELECT u.id, u.name, u.email, u.last_login, u.created_at,
            r.name as role, r.description as role_description, r.permissions
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.id = ?`,
    [req.user.id]
  );
  res.json({
    success: true,
    data: { ...user, permissions: JSON.parse(user.permissions || '[]') },
  });
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────────
router.post('/logout', authenticate, (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    run(`DELETE FROM refresh_tokens WHERE token = ?`, [refreshToken]);
  } else {
    // Revocar todos los tokens del usuario
    run(`DELETE FROM refresh_tokens WHERE user_id = ?`, [req.user.id]);
  }
  res.json({ success: true, message: 'Sesión cerrada' });
});

// ── POST /api/auth/change-password ────────────────────────────────────────────
router.post('/change-password',
  authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) return res.status(400).json({ success: false, error: 'Contraseña actual incorrecta' });
      const newHash = await bcrypt.hash(newPassword, 10);
      run(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newHash, req.user.id]);
      // Revocar todos los refresh tokens (forzar re-login en otros dispositivos)
      run(`DELETE FROM refresh_tokens WHERE user_id = ?`, [req.user.id]);
      res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

module.exports = router;
