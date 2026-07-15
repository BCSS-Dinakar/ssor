import { ShieldCheck } from 'lucide-react';

function SecurityBanner({ children }) {
  return (
    <div
      role="note"
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-base text-amber-900"
    >
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

export default SecurityBanner;
