import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Eye, Pencil, KeyRound, X, ChevronUp, ChevronDown, UserCheck, MapPin, Calendar, AlertCircle, CheckCircle, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../../../utils/axios';
import WhatsAppIcon from '../../../components/icons/WhatsAppIcon';

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }) {
  const map = {
    approved: { cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', label: 'Active' },
    suspended: { cls: 'bg-red-100 text-red-700 border border-red-200', label: 'Suspended' },
    pending:   { cls: 'bg-amber-100 text-amber-700 border border-amber-200', label: 'Pending' },
  };
  const { cls, label } = map[status] || { cls: 'bg-slate-100 text-slate-600', label: status };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Modal base
───────────────────────────────────────────────────────────────────────────── */
function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full ${maxWidth} rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Create District Admin modal
───────────────────────────────────────────────────────────────────────────── */
function CreateModal({ open, onClose, unassignedDistricts, allDistrictsAssigned, onCreated }) {
  const [form, setForm] = useState({ loginId: '', password: '', name: '', distCode: '', whatsapp: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.distCode) { setError('Please select a district.'); return; }
    setError('');
    setSaving(true);
    try {
      const { whatsapp, ...userForm } = form;
      const res = await axios.post('/api/admin/district-admins', userForm);
      if (res.data.success) {
        // WhatsApp alert number is optional at creation time and can be added/edited later
        // from Settings — don't let a failure here block the (already successful) admin creation.
        if (whatsapp.trim()) {
          try {
            await axios.put('/api/notifications/settings', {
              distCode: form.distCode,
              primaryWhatsApp: whatsapp.trim(),
              alertsEnabled: true,
            });
          } catch (err) {
            console.error('Failed to save WhatsApp alert number:', err);
          }
        }
        onCreated(res.data.user);
        setForm({ loginId: '', password: '', name: '', distCode: '', whatsapp: '' });
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create District Admin">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <FormField label="Login ID" required>
          <input required className={inputCls} value={form.loginId} onChange={e => set('loginId', e.target.value)} placeholder="e.g. admin@hyderabad" />
        </FormField>
        <FormField label="Password" required>
          <input required type="password" className={inputCls} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 8 characters" minLength={8} />
        </FormField>
        <FormField label="Full Name" required>
          <input required className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Officer full name" />
        </FormField>
        <FormField label="District" required>
          {unassignedDistricts.length > 0
            ? (
              <select required className={inputCls} value={form.distCode} onChange={e => set('distCode', e.target.value)}>
                <option value="">Select District</option>
                {unassignedDistricts.map(d => (
                  <option key={d.distCode} value={d.distCode}>{d.distName}</option>
                ))}
              </select>
            )
            : allDistrictsAssigned
              ? <p className="text-sm text-amber-600 font-medium">All districts already have an assigned admin.</p>
              : (
                <select className={inputCls} disabled>
                  <option>Loading districts…</option>
                </select>
              )
          }
        </FormField>
        <FormField label="WhatsApp Alert Number">
          <div className="relative">
            <WhatsAppIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
            <input
              type="tel"
              className={`${inputCls} pl-9`}
              value={form.whatsapp}
              onChange={e => set('whatsapp', e.target.value)}
              placeholder="91XXXXXXXXXX"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Optional — not required to create the account. Can be added or changed anytime from Settings.</p>
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={saving || allDistrictsAssigned}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Creating…' : 'Create District Admin'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   View / Details modal
───────────────────────────────────────────────────────────────────────────── */
function ViewModal({ open, onClose, user, onEdit, onResetPassword }) {
  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title="District Admin Details">
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">{user.policeProfile?.name || '—'}</p>
            <p className="text-sm text-slate-500">{user.loginId}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <DetailItem label="Assigned District" value={user.district?.distName || user.distCode || '—'} icon={<MapPin className="h-3.5 w-3.5" />} />
          <DetailItem label="Role" value="District Admin" icon={<Shield className="h-3.5 w-3.5" />} />
          <DetailItem label="Status" value={<StatusBadge status={user.status} />} />
          <DetailItem label="Created" value={formatDate(user.createdAt)} icon={<Calendar className="h-3.5 w-3.5" />} />
        </dl>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button onClick={() => { onClose(); onEdit(user); }} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit Account
          </button>
          <button onClick={() => { onClose(); onResetPassword(user); }} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            <KeyRound className="h-3.5 w-3.5" /> Reset Password
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Edit modal
───────────────────────────────────────────────────────────────────────────── */
function EditModal({ open, onClose, user, unassignedDistricts, onUpdated }) {
  const [form, setForm] = useState({ name: '', loginId: '', distCode: '', status: '', whatsapp: '' });
  // Preserves fields upsertSettings requires but this form doesn't expose, so saving
  // primaryWhatsApp here can't silently wipe an existing secondary number / alerts flag.
  const [notifMeta, setNotifMeta] = useState({ secondaryWhatsApp: '', alertsEnabled: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name:    user.policeProfile?.name || '',
        loginId: user.loginId || '',
        distCode: user.distCode || '',
        status:  user.status || 'approved',
        whatsapp: '',
      });
      setError('');
    }
  }, [user]);

  // Load the assigned district's current WhatsApp alert settings whenever the modal opens
  // or the selected district changes (same source Settings.js reads/writes).
  useEffect(() => {
    if (!open || !form.distCode) return;
    let cancelled = false;
    axios.get('/api/notifications/settings', { params: { distCode: form.distCode } })
      .then(res => {
        if (cancelled) return;
        const s = res.data?.data;
        setForm(f => ({ ...f, whatsapp: s?.primaryWhatsApp || '' }));
        setNotifMeta({ secondaryWhatsApp: s?.secondaryWhatsApp || '', alertsEnabled: s?.alertsEnabled !== false });
      })
      .catch(err => console.error('Failed to load notification settings:', err));
    return () => { cancelled = true; };
  }, [open, form.distCode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Districts available for edit = unassigned + currently assigned (can keep own)
  const availableDistricts = useMemo(() => {
    if (!user) return unassignedDistricts;
    const own = user.district ? [user.district] : [];
    const merged = [...own, ...unassignedDistricts.filter(d => d.distCode !== user.distCode)];
    return merged.sort((a, b) => a.distName.localeCompare(b.distName));
  }, [user, unassignedDistricts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { whatsapp, ...userForm } = form;
      const res = await axios.put(`/api/admin/district-admins/${user.id}`, userForm);
      if (res.data.success) {
        // Same non-blocking treatment as Create: the account update already succeeded.
        try {
          await axios.put('/api/notifications/settings', {
            distCode: form.distCode,
            primaryWhatsApp: whatsapp,
            secondaryWhatsApp: notifMeta.secondaryWhatsApp,
            alertsEnabled: notifMeta.alertsEnabled,
          });
        } catch (err) {
          console.error('Failed to save WhatsApp alert number:', err);
        }
        onUpdated(res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title="Edit District Admin">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <FormField label="Full Name" required>
          <input required className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
        </FormField>
        <FormField label="Login ID" required>
          <input required className={inputCls} value={form.loginId} onChange={e => set('loginId', e.target.value)} />
        </FormField>
        <FormField label="District" required>
          <select required className={inputCls} value={form.distCode} onChange={e => set('distCode', e.target.value)}>
            <option value="">Select District</option>
            {availableDistricts.map(d => (
              <option key={d.distCode} value={d.distCode}>{d.distName}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Status">
          <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="approved">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </FormField>
        <FormField label="WhatsApp Alert Number">
          <div className="relative">
            <WhatsAppIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
            <input
              type="tel"
              className={`${inputCls} pl-9`}
              value={form.whatsapp}
              onChange={e => set('whatsapp', e.target.value)}
              placeholder="91XXXXXXXXXX"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Optional. Also editable anytime from Settings.</p>
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Reset Password modal
───────────────────────────────────────────────────────────────────────────── */
function ResetPasswordModal({ open, onClose, user }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) { setNewPassword(''); setConfirm(''); setError(''); setSuccess(false); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError(''); setSaving(true);
    try {
      await axios.post(`/api/admin/district-admins/${user.id}/reset-password`, { newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Reset Password — ${user.policeProfile?.name || user.loginId}`}>
      {success ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">Password has been reset successfully.</p>
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Close</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <FormField label="New Password" required>
            <input required type="password" className={inputCls} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} />
          </FormField>
          <FormField label="Confirm Password" required>
            <input required type="password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Shared form atoms
───────────────────────────────────────────────────────────────────────────── */
const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100';

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function DetailItem({ label, value, icon }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
        {icon}{label}
      </dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Sort header
───────────────────────────────────────────────────────────────────────────── */
function SortHeader({ col, label, sortCol, sortDir, onSort }) {
  const active = sortCol === col;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 cursor-pointer select-none hover:text-slate-700 transition-colors"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronDown className="h-3 w-3 opacity-30" />}
      </span>
    </th>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────────── */
function UserManagement() {
  const [admins, setAdmins] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const [createOpen, setCreateOpen] = useState(false);
  const [viewUser,   setViewUser]   = useState(null);
  const [editUser,   setEditUser]   = useState(null);
  const [resetUser,  setResetUser]  = useState(null);

  // Load data on mount
  useEffect(() => {
    Promise.all([fetchAdmins(), fetchDistricts()]).finally(() => setLoading(false));
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await axios.get('/api/admin/district-admins');
      if (res.data.success) setAdmins(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchDistricts = async () => {
    try {
      const res = await axios.get('/api/districts');
      if (res.data.success) setDistricts(res.data.data);
    } catch (err) { console.error(err); }
  };

  // Districts not yet assigned to any admin
  const assignedCodes = useMemo(() => new Set(admins.map(a => a.distCode).filter(Boolean)), [admins]);
  const unassignedDistricts = useMemo(() => districts.filter(d => !assignedCodes.has(d.distCode)), [districts, assignedCodes]);

  // After create, push into admins list
  const handleCreated = (user) => setAdmins(prev => [user, ...prev]);

  // After edit, update in place
  const handleUpdated = (user) => setAdmins(prev => prev.map(a => a.id === user.id ? user : a));

  // Sort handler
  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return admins
      .filter(a =>
        !q ||
        (a.policeProfile?.name || '').toLowerCase().includes(q) ||
        (a.loginId || '').toLowerCase().includes(q) ||
        (a.district?.distName || a.distCode || '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        // Pin Super Admins to the top
        if (a.role === 'STATE_ADMIN' && b.role !== 'STATE_ADMIN') return -1;
        if (b.role === 'STATE_ADMIN' && a.role !== 'STATE_ADMIN') return 1;

        let av, bv;
        if (sortCol === 'createdAt') { av = a.createdAt; bv = b.createdAt; }
        else if (sortCol === 'district') { av = a.district?.distName || ''; bv = b.district?.distName || ''; }
        else if (sortCol === 'name') { av = a.policeProfile?.name || ''; bv = b.policeProfile?.name || ''; }
        else { av = a[sortCol] || ''; bv = b[sortCol] || ''; }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [admins, search, sortCol, sortDir]);

  if (loading) {
    return <div className="py-12 text-center text-sm font-medium text-slate-500">Loading admins…</div>;
  }

  const allAssigned = districts.length > 0 && unassignedDistricts.length === 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/portal/settings" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors w-max">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">District Admin Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage District Admin accounts. Each district can have exactly one admin.&nbsp;
            <span className="font-medium text-slate-600">{admins.length}/{districts.length} districts assigned.</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {allAssigned && (
            <span className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" /> All districts assigned
            </span>
          )}
          <button
            onClick={() => setCreateOpen(true)}
            disabled={allAssigned}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create District Admin
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Districts', value: districts.length, color: 'text-slate-700' },
          { label: 'Assigned',        value: assignedCodes.size, color: 'text-emerald-600' },
          { label: 'Unassigned',      value: unassignedDistricts.length, color: 'text-amber-600' },
          { label: 'Active Admins',   value: admins.filter(a => a.status === 'approved').length, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          placeholder="Search by name, login ID or district…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <SortHeader col="name"      label="Name"             sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Login ID</th>
                <SortHeader col="district"  label="Assigned District" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
                <SortHeader col="createdAt" label="Created"          sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(u => (
                <tr key={u.id} className="group hover:bg-blue-50/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs">
                        {(u.policeProfile?.name || u.loginId || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{u.policeProfile?.name || '—'}</span>
                        {u.role === 'STATE_ADMIN' && (
                          <span className="mt-0.5 inline-flex w-fit items-center rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                            Super Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">{u.loginId}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      <MapPin className="h-3 w-3 text-blue-500" />
                      {u.district?.distName || u.distCode || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <ActionBtn icon={<Eye className="h-3.5 w-3.5" />} label="View" onClick={() => setViewUser(u)} />
                      <ActionBtn icon={<Pencil className="h-3.5 w-3.5" />} label="Edit" onClick={() => setEditUser(u)} />
                      <ActionBtn icon={<KeyRound className="h-3.5 w-3.5" />} label="Reset" onClick={() => setResetUser(u)} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <UserCheck className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                    <p className="text-sm font-medium text-slate-400">
                      {admins.length === 0 ? 'No District Admins created yet.' : 'No results match your search.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
            Showing {filtered.length} of {admins.length} district admin{admins.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        unassignedDistricts={unassignedDistricts}
        allDistrictsAssigned={allAssigned}
        onCreated={handleCreated}
      />
      <ViewModal
        open={!!viewUser}
        onClose={() => setViewUser(null)}
        user={viewUser}
        onEdit={(u) => setEditUser(u)}
        onResetPassword={(u) => setResetUser(u)}
      />
      <EditModal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        unassignedDistricts={unassignedDistricts}
        onUpdated={handleUpdated}
      />
      <ResetPasswordModal
        open={!!resetUser}
        onClose={() => setResetUser(null)}
        user={resetUser}
      />
    </div>
  );
}

function ActionBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
    >
      {icon} {label}
    </button>
  );
}

export default UserManagement;
