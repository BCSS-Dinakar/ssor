import { NavLink } from 'react-router-dom';
import { NAV } from '../utils/data/portalData';
import { cn } from '../lib/utils';

function Sidebar({ role, onNavigate, counts = {} }) {
  const items = NAV[role] || [];

  return (
    <nav
      className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-2.5"
      aria-label="Portal navigation"
    >
      {items.map((item, i) => {
        if (item.section) {
          return (
            <div
              key={`sec-${i}`}
              className="px-2.5 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              {item.section}
            </div>
          );
        }

        const Icon = item.icon;
        const badge = item.badge ? counts[item.badge] : 0;
        const title = item.desc ? `${item.label} — ${item.desc}` : item.label;

        if (item.upcoming) {
          return (
            <div
              key={item.id}
              className="flex min-h-9 items-center gap-2 rounded-md px-2.5 py-1.5 opacity-45"
              title={`${item.label} (Coming soon)`}
              aria-disabled="true"
            >
              <Icon className="h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-400">
                {item.label}
              </span>
            </div>
          );
        }

        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/portal'}
            onClick={onNavigate}
            title={title}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-9 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent',
                isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-r-full bg-accent" aria-hidden="true" />
                )}
                <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate leading-snug">{item.label}</span>
                {badge > 0 && (
                  <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 font-mono text-xs font-bold text-primary">
                    {badge > 99 ? '99+' : badge}
                    <span className="sr-only"> pending</span>
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default Sidebar;
