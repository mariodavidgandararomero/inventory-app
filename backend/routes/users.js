const express = require('express');
const bcrypt = require('bcryptjs');
const { body, param, validationResult } = require('express-validator');
const { all, get, run } = require('../database');
const { authenticate, authorize, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Todos los endpoints de usuarios requieren autenticación
router.use(authenticate);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// ── GET /api/users ─────────────────────────────────────────────────────────────
router.get('/', authorize('users.view'), (req, res) => {
  try {
    const users = all(`
      SELECT u.id, u.name, u.email, u.is_active, u.last_login, u.created_at,
             r.id as role_id, r.name as role, r.description as role_description
      FROM users u JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── GET /api/users/roles ───────────────────────────────────────────────────────
router.get('/roles', authorize('users.view'), (req, res) => {
  try {
    const roles = all('SELECT id, name, description, permissions FROM roles ORDER BY id');
    res.json({
      success: true,
      data: roles.map(r => ({ ...r, permissions: JSON.parse(r.permissions || '[]') })),
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── POST /api/users ────────────────────────────────────────────────────────────
router.post('/',
  authorize('users.create'),
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  body('role_id').isInt().withMessage('Rol requerido'),
  validate,
  async (req, res) => {
    try {
      const { name, email, password, role_id } = req.body;

      // No permitir crear otro admin si no eres admin
      const targetRole = get('SELECT name FROM roles WHERE id = ?', [role_id]);
      if (!targetRole) return res.status(400).json({ success: false, error: 'Rol no existe' });
      if (targetRole.name === 'admin' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Solo un admin puede crear otros admins' });
      }

      const hash = await bcrypt.hash(password, 10);
      const { lastInsertRowid } = run(
        `INSERT INTO users (name, email, password_hash, role_id) VALUES (?,?,?,?)`,
        [name, email, hash, parseInt(role_id)]
      );

      const created = get(
        `SELECT u.id, u.name, u.email, u.is_active, u.created_at, r.name as role
         FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
        [lastInsertRowid]
      );
      res.status(201).json({ success: true, data: created });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ success: false, error: 'El email ya está registrado' });
      }
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ── PUT /api/users/:id ─────────────────────────────────────────────────────────
router.put('/:id',
  param('id').isInt(),
  authorize('users.edit'),
  validate,
  async (req, res) => {
    try {
      const { name, email, role_id, is_active, password } = req.body;
      const targetUser = get('SELECT * FROM users WHERE id = ?', [req.params.id]);
      if (!targetUser) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

      // No puede desactivarse a sí mismo
      if (parseInt(req.params.id) === req.user.id && is_active === 0) {
        return res.status(400).json({ success: false, error: 'No puedes desactivar tu propia cuenta' });
      }

      let passwordHash = targetUser.password_hash;
      if (password) {
        if (password.length < 6) return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' });
        passwordHash = await bcrypt.hash(password, 10);
      }

      run(`UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        role_id = COALESCE(?, role_id),
        is_active = COALESCE(?, is_active),
        password_hash = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [name, email, role_id ? parseInt(role_id) : null,
         is_active !== undefined ? is_active : null,
         passwordHash, req.params.id]
      );

      if (is_active === 0) {
        // Revocar todos los tokens del usuario desactivado
        run('DELETE FROM refresh_tokens WHERE user_id = ?', [req.params.id]);
      }

      const updated = get(
        `SELECT u.id, u.name, u.email, u.is_active, u.last_login, r.name as role
         FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?`,
        [req.params.id]
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      if (err.message.includes('UNIQUE')) return res.status(409).json({ success: false, error: 'El email ya está en uso' });
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ── DELETE /api/users/:id ──────────────────────────────────────────────────────
router.delete('/:id', param('id').isInt(), authorize('users.delete'), adminOnly, validate, (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, error: 'No puedes eliminar tu propia cuenta' });
    }
    const user = get('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });

    run('DELETE FROM refresh_tokens WHERE user_id = ?', [req.params.id]);
    run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
