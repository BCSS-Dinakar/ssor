import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base text-slate-800 outline-none transition-all duration-300 focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/10 placeholder-slate-400';

export function Field({ label, required, children, hint, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-base font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {hint && <span className="text-sm text-slate-500">{hint}</span>}
    </div>
  );
}

export function FeedbackBanner({ type, message }) {
  if (!message) return null;
  const map = {
    success: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', Icon: CheckCircle2 },
    error: { cls: 'bg-red-50 border-red-200 text-red-800', Icon: AlertTriangle },
    info: { cls: 'bg-blue-50 border-blue-200 text-blue-800', Icon: Info },
  };
  const { cls, Icon } = map[type] || map.info;
  return (
    <div className={`flex items-start gap-2.5 border rounded-xl px-4 py-3 text-base mb-4 ${cls}`}>
      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
