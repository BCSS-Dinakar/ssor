import { TIERS, STATUS_PILL } from '../../utils/data/portalData';

export function TierChip({ tier }) {
  const t = TIERS[tier];
  if (!t) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${t.color} rounded-lg px-2.5 py-1 text-sm font-bold text-white`}>
      {t.name}
    </span>
  );
}

export function StatusPill({ status }) {
  const cls = STATUS_PILL[status] || 'bg-slate-200 text-slate-600';
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  return (
    <span className={`inline-block rounded-full border border-slate-200 px-2.5 py-1 text-sm font-semibold ${cls}`}>
      {label}
    </span>
  );
}
