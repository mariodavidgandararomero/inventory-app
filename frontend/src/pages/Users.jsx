import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, API } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const ROLE_STYLES = {
  admin:   'bg-ink-900 text-white',
  manager: 'bg-sage-100 text-sage-700',
  viewer:  'bg-amber-100 text-amber-700',
};

const ROLE_ICONS = { admin: '🛡️', manager: '⚙️', viewer: '👁' };

function UserModal({ user, roles, onClose, onSaved, currentUser }) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role_id: user?.role_id || roles[0]?.id || '',
    is_active: user?.is_active ?? 1,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, role_id: parseInt(form.role_id) };
      if (!payload.password) delete payload.password;
      if (isEdit) {
        await API.put(`/users/${user.id}`, payload);
        toast.success('Usuario actualizado');
      } else {
        await API.post('/users', payload);
        toast.success('Usuario creado');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-lg animate-slide-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
          <h2 className="font-display font-700 text-lg text-ink-900">
            {isEdit ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          <button onClick={onClose} className="btn-ghost">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Nombre completo *</label>
            <input className="input-field" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del usuario" required />
          </div>

          <div>
            <label className="label">Email *</label>
            <input type="email" className="input-field" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="usuario@email.com" required />
          </div>

          <div>
            <label className="label">{isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña *'}</label>
            <input type="password" className="input-field" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
              minLength={isEdit ? 0 : 6}
              required={!isEdit} />
          </div>

          <div>
            <label className="label">Rol *</label>
            <select className="input-field" value={form.role_id}
              onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))} required>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{ROLE_ICONS[r.name]} {r.name} — {r.description}</option>
              ))}
            </select>
          </div>

          {isEdit && user.id !== currentUser.id && (
            <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-xl">
              <input type="checkbox" id="is_active" checked={form.is_active === 1}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked ? 1 : 0 }))}
                className="w-4 h-4 accent-sage-600" />
              <label htmlFor="is_active" className="text-sm text-ink-700 font-medium">Usuario activo</label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
                : isEdit ? '✓ Actualizar' : '+ Crear usuario'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
      toast.success('Contraseña actualizada. Vuelve a iniciar sesión en otros dispositivos.');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-sm animate-slide-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
          <h2 className="font-display font-700 text-lg text-ink-900">Cambiar contraseña</h2>
          <button onClick={onClose} className="btn-ghost">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {[
            { key: 'currentPassword', label: 'Contraseña actual', placeholder: '••••••••' },
            { key: 'newPassword', label: 'Nueva contraseña', placeholder: 'Mínimo 6 caracteres' },
            { key: 'confirm', label: 'Confirmar nueva contraseña', placeholder: '••••••••' },
          ].map(field => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <input type="password" className="input-field" value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder} required minLength={field.key !== 'currentPassword' ? 6 : 1} />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando...' : '🔑 Actualizar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const { user: currentUser, can } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([API.get('/users'), API.get('/users/roles')]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try {
      await API.delete(`/users/${id}`);
      toast.success('Usuario eliminado');
      load();
    } catch (err) {
      toast.error(err.message);
    }
    setDeleteConfirm(null);
  };

  const handleToggleActive = async (u) => {
    try {
      await API.put(`/users/${u.id}`, { is_active: u.is_active ? 0 : 1 });
      toast.success(u.is_active ? 'Usuario desactivado' : 'Usuario activado');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="text-ink-400 text-sm mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPasswordModal(true)} className="btn-secondary text-sm">
            🔑 Mi contraseña
          </button>
          {can('users.create') && (
            <button onClick={() => { setSelected(null); setShowModal(true); }} className="btn-primary">
              + Nuevo usuario
            </button>
          )}
        </div>
      </div>

      {/* Roles info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map(r => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{ROLE_ICONS[r.name]}</span>
              <div>
                <p className="font-semibold text-ink-800 capitalize">{r.name}</p>
                <p className="text-xs text-ink-400">{r.description}</p>
              </div>
              <span className="ml-auto text-sm font-mono text-ink-400">
                {users.filter(u => u.role === r.name).length} usuarios
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {r.permissions.slice(0, 4).map(p => (
                <span key={p} className="text-xs px-2 py-0.5 bg-ink-50 text-ink-500 rounded-md font-mono">{p}</span>
              ))}
              {r.permissions.length > 4 && (
                <span className="text-xs px-2 py-0.5 bg-ink-50 text-ink-400 rounded-md">+{r.permissions.length - 4} más</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-3 text-ink-400">
            <div className="w-5 h-5 border-2 border-ink-200 border-t-ink-500 rounded-full animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : (
          <div className="divide-y divide-ink-50">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-ink-50/50 text-xs font-semibold text-ink-400 uppercase tracking-wider">
              <div className="col-span-4">Usuario</div>
              <div className="col-span-2">Rol</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2">Último acceso</div>
              <div className="col-span-2 text-right">Acciones</div>
            </div>

            {users.map(u => (
              <div key={u.id}>
                <div className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-ink-50/50 transition-colors">
                  <div className="col-span-7 md:col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-ink-900 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-white font-display font-700 text-sm">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate flex items-center gap-1.5">
                        {u.name}
                        {u.id === currentUser.id && (
                          <span className="text-xs text-sage-600 font-normal">(tú)</span>
                        )}
                      </p>
                      <p className="text-xs text-ink-400 truncate font-mono">{u.email}</p>
                    </div>
                  </div>

                  <div className="hidden md:flex col-span-2">
                    <span className={`badge ${ROLE_STYLES[u.role] || 'bg-ink-100 text-ink-600'}`}>
                      {ROLE_ICONS[u.role]} {u.role}
                    </span>
                  </div>

                  <div className="hidden md:flex col-span-2">
                    <span className={`badge ${u.is_active ? 'bg-sage-100 text-sage-700' : 'bg-ink-100 text-ink-400'}`}>
                      {u.is_active ? '● Activo' : '○ Inactivo'}
                    </span>
                  </div>

                  <div className="hidden md:block col-span-2">
                    <p className="text-xs text-ink-400">
                      {u.last_login ? formatDate(u.last_login) : 'Nunca'}
                    </p>
                  </div>

                  <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-1">
                    {can('users.edit') && (
                      <>
                        <button
                          onClick={() => { setSelected(u); setShowModal(true); }}
                          className="btn-ghost text-xs py-1 px-2" title="Editar"
                        >✎</button>
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`btn-ghost text-xs py-1 px-2 ${u.is_active ? 'hover:text-amber-500' : 'hover:text-sage-500'}`}
                            title={u.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {u.is_active ? '⏸' : '▶'}
                          </button>
                        )}
                      </>
                    )}
                    {can('users.delete') && u.id !== currentUser.id && (
                      <button
                        onClick={() => setDeleteConfirm(u.id)}
                        className="btn-ghost text-xs py-1 px-2 hover:text-coral-500" title="Eliminar"
                      >✕</button>
                    )}
                  </div>
                </div>

                {deleteConfirm === u.id && (
                  <div className="px-5 py-3 bg-coral-50 border-t border-coral-100 flex items-center justify-between">
                    <p className="text-sm text-coral-700 font-medium">¿Eliminar a {u.name}?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-xs">Cancelar</button>
                      <button onClick={() => handleDelete(u.id)} className="btn-danger text-xs">Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          user={selected}
          roles={roles}
          currentUser={currentUser}
          onClose={() => setShowModal(false)}
          onSaved={load}
        />
      )}
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
}
