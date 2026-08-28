import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, X, AlertCircle, Shield, AlertTriangle, UserX, Network, FileText, Info, Clock, Scale,
} from 'lucide-react';
import PageHeader from '../../components/portal/PageHeader';
import { riskTierApi } from '../../api/riskTier.api';
import { useAuth } from '../../context/AuthContext';

const EDIT_ROLES = ['STATE_ADMIN', 'police', 'DISTRICT_USER'];

const TIER_ICONS = {
  RED: AlertTriangle,
  ORANGE: UserX,
  BLUE: Network,
  BLACK: Shield,
  PINK: FileText,
  GREEN: Info,
};

const TAILWIND_TO_HEX = {
  'bg-red-600': '#dc2626',
  'bg-orange-500': '#f97316',
  'bg-neutral-800': '#262626',
  'bg-sky-600': '#0284c7',
  'bg-pink-500': '#ec4899',
  'bg-green-600': '#16a34a',
  'bg-purple-600': '#9333ea',
  'bg-amber-600': '#d97706',
  'bg-slate-600': '#475569',
};

function colorClassToHex(colorClass) {
  if (!colorClass) return '#475569';
  if (colorClass.startsWith('#')) return colorClass.length === 7 ? colorClass : '#475569';
  return TAILWIND_TO_HEX[colorClass] || '#475569';
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(71, 85, 105, ${alpha})`;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveTierColor(colorClass) {
  const hex = colorClassToHex(colorClass);
  const isHex = colorClass?.startsWith('#');
  return {
    hex,
    isHex,
    iconStyle: isHex ? { backgroundColor: hex } : undefined,
    iconClass: isHex ? '' : colorClass,
    badgeStyle: isHex
      ? { backgroundColor: hexToRgba(hex, 0.12), color: hex, borderColor: hexToRgba(hex, 0.35) }
      : undefined,
    badgeClass: isHex ? '' : `${colorClass.replace('bg-', 'bg-opacity-10 text-')} bg-opacity-10 border border-current`,
  };
}

const emptySectionForm = () => ({
  act_name: '',
  section_code: '',
  tier: 'RED',
  severity_rank: '100',
  description: '',
});

const emptyTierForm = () => ({
  code: '',
  name: '',
  category: '',
  description: '',
  nature: '',
  retention: '',
  colorClass: '#475569',
  defaultRank: '50',
  sortOrder: '0',
});

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100';

function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', maxHeight = 'max-h-[90vh]' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`flex w-full ${maxWidth} ${maxHeight} flex-col rounded-2xl bg-white shadow-2xl`}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

function SectionForm({ form, setForm, tiers, onSubmit, saving, error, submitLabel, tierLocked = false }) {
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorBox message={error} />
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Act</label>
        <input required className={inputCls} value={form.act_name} onChange={(e) => set('act_name', e.target.value)} placeholder="e.g. BNS" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Section</label>
        <input required className={inputCls} value={form.section_code} onChange={(e) => set('section_code', e.target.value)} placeholder="e.g. 63" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tier</label>
          <select required disabled={tierLocked} className={inputCls} value={form.tier} onChange={(e) => set('tier', e.target.value)}>
            {tiers.map((t) => (
              <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Severity rank</label>
          <input required type="number" min={0} max={100} className={inputCls} value={form.severity_rank} onChange={(e) => set('severity_rank', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
        <textarea rows={3} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief description of the offence section" />
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function TierColorPreview({ form }) {
  const hex = colorClassToHex(form.colorClass);
  const Icon = TIER_ICONS[form.code] || Shield;
  const colors = resolveTierColor(form.colorClass);

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 bg-slate-50 border-b border-slate-100">
        Preview
      </p>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <div
            className={`p-2 rounded-lg text-white shadow-sm shrink-0 ${colors.iconClass}`}
            style={colors.iconStyle}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-extrabold text-slate-800">{form.name || 'Tier name'} Tier</p>
            <p className="text-sm font-bold text-slate-500">{form.category || 'Category'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold ${colors.badgeClass}`}
            style={colors.badgeStyle}
          >
            {form.code || 'CODE'}
          </span>
          <span
            className={`inline-block px-2.5 py-1 rounded-md text-sm font-bold ${colors.badgeClass}`}
            style={colors.badgeStyle}
          >
            {form.retention || 'Retention period'}
          </span>
        </div>
        <p className="text-xs text-slate-400 font-mono">{hex}</p>
      </div>
    </div>
  );
}

function TierForm({ form, setForm, onSubmit, saving, error, submitLabel, codeLocked = false }) {
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const hex = colorClassToHex(form.colorClass);

  const handleHexInput = (value) => {
    const cleaned = value.startsWith('#') ? value : `#${value}`;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(cleaned)) {
      set('colorClass', cleaned.length === 7 ? cleaned : cleaned);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ErrorBox message={error} />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Code</label>
          <input required disabled={codeLocked} className={inputCls} value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="e.g. RED" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Display name</label>
          <input required className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Red" />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
        <input required className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Dangerous / gang" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Defining criteria</label>
        <textarea required rows={2} className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nature of offence</label>
        <textarea required rows={2} className={inputCls} value={form.nature} onChange={(e) => set('nature', e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Retention</label>
        <input required className={inputCls} value={form.retention} onChange={(e) => set('retention', e.target.value)} placeholder="e.g. Lifetime" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Colour</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={hex}
            onChange={(e) => set('colorClass', e.target.value)}
            className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
            aria-label="Pick tier colour"
          />
          <input
            type="text"
            value={form.colorClass.startsWith('#') ? form.colorClass : hex}
            onChange={(e) => handleHexInput(e.target.value)}
            className={inputCls}
            placeholder="#dc2626"
            maxLength={7}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Default rank</label>
          <input required type="number" min={0} max={100} className={inputCls} value={form.defaultRank} onChange={(e) => set('defaultRank', e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Sort order</label>
          <input required type="number" className={inputCls} value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
        </div>
      </div>
      <TierColorPreview form={form} />
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function SectionDescription({ text }) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > 48;

  if (!text) return null;

  return (
    <div className="mt-1">
      <p className={`text-[11px] text-slate-500 leading-snug ${expanded ? '' : 'line-clamp-2'}`}>
        {text}
      </p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
}

function RiskTier() {
  const { auth } = useAuth();
  const canEdit = EDIT_ROLES.includes(auth?.role);

  const [definitions, setDefinitions] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [createTierOpen, setCreateTierOpen] = useState(false);
  const [editTier, setEditTier] = useState(null);
  const [deleteTier, setDeleteTier] = useState(null);
  const [tierForm, setTierForm] = useState(emptyTierForm());

  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [deleteSection, setDeleteSection] = useState(null);
  const [sectionForm, setSectionForm] = useState(emptySectionForm());

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [defRes, secRes] = await Promise.all([
        riskTierApi.listDefinitions(),
        riskTierApi.listSections(),
      ]);
      if (defRes.success) setDefinitions(defRes.data);
      if (secRes.success) setSections(secRes.data);
    } catch {
      setError('Failed to load risk tiers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const sectionsByTier = useMemo(() => {
    const map = {};
    definitions.forEach((d) => { map[d.code] = []; });
    sections.forEach((row) => {
      if (!map[row.tier]) map[row.tier] = [];
      map[row.tier].push(row);
    });
    Object.keys(map).forEach((code) => {
      map[code].sort((a, b) => b.severity_rank - a.severity_rank || a.act_name.localeCompare(b.act_name));
    });
    return map;
  }, [definitions, sections]);

  const openCreateTier = () => {
    setTierForm(emptyTierForm());
    setError('');
    setCreateTierOpen(true);
  };

  const openEditTier = (tier) => {
    setTierForm({
      code: tier.code,
      name: tier.name,
      category: tier.category,
      description: tier.description,
      nature: tier.nature,
      retention: tier.retention,
      colorClass: colorClassToHex(tier.colorClass),
      defaultRank: String(tier.defaultRank),
      sortOrder: String(tier.sortOrder),
    });
    setError('');
    setEditTier(tier);
  };

  const openCreateSection = (tier) => {
    setSectionForm({
      ...emptySectionForm(),
      tier: tier.code,
      severity_rank: String(tier.defaultRank),
    });
    setError('');
    setCreateSectionOpen(true);
  };

  const openEditSection = (row) => {
    setSectionForm({
      act_name: row.act_name,
      section_code: row.section_code,
      tier: row.tier,
      severity_rank: String(row.severity_rank),
      description: row.description || '',
    });
    setError('');
    setEditSection(row);
  };

  const normalizeColorForSave = (colorClass) => (
    /^#[0-9A-Fa-f]{6}$/.test(colorClass) ? colorClass : colorClassToHex(colorClass)
  );

  const handleCreateTier = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await riskTierApi.createDefinition({ ...tierForm, colorClass: normalizeColorForSave(tierForm.colorClass) });
      if (res.success) {
        setDefinitions((prev) => [...prev, res.data].sort((a, b) => a.sortOrder - b.sortOrder));
        setCreateTierOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tier.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTier = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await riskTierApi.updateDefinition(editTier.id, { ...tierForm, colorClass: normalizeColorForSave(tierForm.colorClass) });
      if (res.success) {
        setDefinitions((prev) => prev.map((t) => (t.id === editTier.id ? res.data : t)).sort((a, b) => a.sortOrder - b.sortOrder));
        if (res.data.code !== editTier.code) {
          setSections((prev) => prev.map((s) => (s.tier === editTier.code ? { ...s, tier: res.data.code } : s)));
        }
        setEditTier(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tier.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await riskTierApi.removeDefinition(deleteTier.id);
      if (res.success) {
        setDefinitions((prev) => prev.filter((t) => t.id !== deleteTier.id));
        setDeleteTier(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tier.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await riskTierApi.createSection(sectionForm);
      if (res.success) {
        setSections((prev) => [...prev, res.data]);
        setCreateSectionOpen(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create section.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSection = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await riskTierApi.updateSection(editSection.id, sectionForm);
      if (res.success) {
        setSections((prev) => prev.map((row) => (row.id === editSection.id ? res.data : row)));
        setEditSection(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update section.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await riskTierApi.removeSection(deleteSection.id);
      if (res.success) {
        setSections((prev) => prev.filter((row) => row.id !== deleteSection.id));
        setDeleteSection(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete section.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12 w-full">
      <PageHeader
        crumb="Register / Risk Tier"
        title="Risk Tier"
        subtitle="Colour-coded classification system for offenders based on the State Sexual Offender Registry framework."
        actions={canEdit ? (
          <button type="button" onClick={openCreateTier} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            New tier
          </button>
        ) : null}
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-base text-slate-700 shadow-sm">
        <p className="mb-2">
          <strong>Overview:</strong> The registry uses a colour-coded scheme allowing officers to grade offenders by the seriousness of their conduct and the risk they carry.
        </p>
        <p className="text-slate-500">
          <strong>Note:</strong> Juveniles (Silver Tier) are dealt with under the Juvenile Justice Act, 2015, and are placed in a non-disclosable list. Statutory provisions are loaded from the risk tier section registry used in clearance searches.
        </p>
        {!canEdit && (
          <p className="mt-2 text-sm text-amber-700">You have read-only access. Contact a registry administrator to add or change tiers.</p>
        )}
      </div>

      {error && !createTierOpen && !editTier && !createSectionOpen && !editSection && (
        <ErrorBox message={error} />
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading risk tiers…</div>
      ) : definitions.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          No risk tiers defined yet.
          {canEdit && ' Click "New tier" to create the first one.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {definitions.map((tier) => {
            const Icon = TIER_ICONS[tier.code] || Shield;
            const tierSections = sectionsByTier[tier.code] || [];
            const colors = resolveTierColor(tier.colorClass);

            return (
              <div key={tier.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg text-white shrink-0 shadow-sm ${colors.iconClass}`}
                        style={colors.iconStyle}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-800 text-base">{tier.name} Tier</h3>
                        <p className="text-sm font-bold text-slate-500 tracking-wide">{tier.category}</p>
                      </div>
                    </div>
                    {canEdit && (
                      <div className="flex shrink-0 flex-wrap gap-1.5">
                        <button type="button" onClick={() => openEditTier(tier)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button type="button" onClick={() => { setError(''); setDeleteTier(tier); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:border-red-300 hover:text-red-600">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col space-y-5">
                  <div>
                    <h4 className="text-sm tracking-wide font-bold text-slate-400 mb-1">Defining Criteria</h4>
                    <p className="text-base text-slate-700 font-medium leading-relaxed">{tier.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm tracking-wide font-bold text-slate-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Nature of Offence
                    </h4>
                    <p className="text-base text-slate-700 font-medium leading-relaxed">{tier.nature}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm tracking-wide font-bold text-slate-400 flex items-center gap-1">
                        <Scale className="h-3 w-3" /> Risk Tier Sections
                        <span className="ml-1 font-normal normal-case text-slate-400">({tierSections.length})</span>
                      </h4>
                      {canEdit && (
                        <button type="button" onClick={() => openCreateSection(tier)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                          <Plus className="h-3 w-3" /> Add section
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-0.5">
                      {tierSections.length === 0 ? (
                        <span className="col-span-2 text-sm text-slate-400">No sections mapped yet.</span>
                      ) : (
                        tierSections.map((row) => (
                          <div key={row.id} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-xs font-bold text-slate-700 leading-tight">{row.act_name} {row.section_code}</p>
                              {canEdit && (
                                <div className="flex shrink-0 gap-0.5">
                                  <button type="button" onClick={() => openEditSection(row)} className="rounded p-1 text-slate-500 hover:bg-white hover:text-blue-600" title="Edit section">
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button type="button" onClick={() => { setError(''); setDeleteSection(row); }} className="rounded p-1 text-slate-500 hover:bg-white hover:text-red-600" title="Delete section">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <SectionDescription text={row.description} />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm tracking-wide font-bold text-slate-400 mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Retention Limit
                    </h4>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-md text-sm font-bold ${colors.badgeClass}`}
                      style={colors.badgeStyle}
                    >
                      {tier.retention}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={createTierOpen}
        onClose={() => setCreateTierOpen(false)}
        title="New risk tier"
        maxWidth="max-w-2xl w-[90vw] md:w-[70vw]"
        maxHeight="h-[85vh]"
      >
        <TierForm form={tierForm} setForm={setTierForm} onSubmit={handleCreateTier} saving={saving} error={error} submitLabel="Create tier" />
      </Modal>

      <Modal
        open={!!editTier}
        onClose={() => setEditTier(null)}
        title="Edit risk tier"
        maxWidth="max-w-2xl w-[90vw] md:w-[70vw]"
        maxHeight="h-[85vh]"
      >
        <TierForm form={tierForm} setForm={setTierForm} onSubmit={handleUpdateTier} saving={saving} error={error} submitLabel="Save tier" codeLocked />
      </Modal>

      <Modal open={!!deleteTier} onClose={() => setDeleteTier(null)} title="Delete risk tier">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Delete <strong>{deleteTier?.name}</strong> ({deleteTier?.code})? All risk tier sections under this tier must be removed first.
          </p>
          <ErrorBox message={error} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteTier(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={handleDeleteTier} disabled={saving} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {saving ? 'Deleting…' : 'Delete tier'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={createSectionOpen} onClose={() => setCreateSectionOpen(false)} title="Add risk tier section">
        <SectionForm form={sectionForm} setForm={setSectionForm} tiers={definitions} onSubmit={handleCreateSection} saving={saving} error={error} submitLabel="Add section" tierLocked />
      </Modal>

      <Modal open={!!editSection} onClose={() => setEditSection(null)} title="Edit risk tier section">
        <SectionForm form={sectionForm} setForm={setSectionForm} tiers={definitions} onSubmit={handleUpdateSection} saving={saving} error={error} submitLabel="Save section" />
      </Modal>

      <Modal open={!!deleteSection} onClose={() => setDeleteSection(null)} title="Delete risk tier section">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Delete <strong>{deleteSection?.act_name} §{deleteSection?.section_code}</strong>?
          </p>
          <ErrorBox message={error} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteSection(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={handleDeleteSection} disabled={saving} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {saving ? 'Deleting…' : 'Delete section'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default RiskTier;
