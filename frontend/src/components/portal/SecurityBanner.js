import { ShieldCheck } from 'lucide-react';

function SecurityBanner({ children }) {
  return (
    <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-none px-4 py-3 mb-6 text-sm text-amber-800">
      <ShieldCheck className="h-4.5 w-4.5 flex-shrink-0 mt-0.5 text-accent" />
      <p>{children}</p>
    </div>
  );
}

export default SecurityBanner;
