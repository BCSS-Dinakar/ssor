import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const inputClass =
  'input-base';

export function Field({ label, required, children, hint, className = '', htmlFor }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="field-label">
          {label} {required && <span className="text-danger" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {hint && <span className="text-body-sm text-muted">{hint}</span>}
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
