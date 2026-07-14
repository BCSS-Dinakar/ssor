import { TIERS, STATUS_PILL } from '../../utils/data/portalData';

export function TierChip({ tier }) {
  const t = TIERS[tier];
  if (!t) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${t.color} text-white text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg`}>
      {t.name}
    </span>
  );
}

export function StatusPill({ status }) {
  const cls = STATUS_PILL[status] || 'bg-slate-200 text-slate-600';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`inline-block text-sm font-semibold px-2.5 py-1 rounded-full border border-slate-200 ${cls}`}>{label}</span>;
}
