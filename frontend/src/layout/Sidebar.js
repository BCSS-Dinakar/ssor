import { NavLink } from 'react-router-dom';
import { NAV } from '../utils/data/portalData';

function Sidebar({ role, collapsed, onNavigate }) {
  const counts = {}; // Dynamic counts removed for API migration
  const items = NAV[role] || [];

  return (
    <nav className={`py-4 space-y-1 ${collapsed ? 'px-1' : 'px-3'}`}>
      {items.map((item, i) => {
        if (item.section) {
          return collapsed ? (
            <div key={`sec-${i}`} className="border-t border-white/10 my-4 mx-2" />
          ) : (
            <div key={`sec-${i}`} className="text-sm font-bold uppercase tracking-widest text-slate-500 px-3 pt-5 pb-2">
              {item.section}
            </div>
          );
        }
        const Icon = item.icon;
        const badge = item.badge ? counts[item.badge] : 0;
        
        if (item.upcoming) {
          return (
            <div
              key={item.id}
              className={`flex ${collapsed ? 'justify-center py-3' : 'items-start gap-3 px-3 py-2.5'} rounded-xl text-base font-medium transition-all duration-200 opacity-40 cursor-not-allowed`}
              title={collapsed ? `${item.label} (Upcoming)` : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon className="h-4.5 w-4.5 flex-shrink-0 opacity-90 text-slate-455" />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold leading-tight text-slate-455">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium leading-none truncate">
                    {item.desc}
                  </div>
                </div>
              )}

              {!collapsed && (
                <span className="bg-slate-700 text-slate-300 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ml-1">
                  Upcoming
                </span>
              )}
            </div>
          );
        }

        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/portal'}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex ${collapsed ? 'justify-center py-3' : 'items-start gap-3 px-3 py-2.5'} rounded-xl text-base font-medium transition-all duration-200 relative ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-3 bottom-3 w-1 bg-accent rounded-r-full" />}
                
                <div className="relative flex items-center justify-center">
                  <Icon className="h-4.5 w-4.5 flex-shrink-0 opacity-90" />
                  {collapsed && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent w-2.5 h-2.5 rounded-full border border-primary flex items-center justify-center text-[7px] font-bold text-primary font-mono scale-90" />
                  )}
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold leading-tight">{item.label}</div>
                    {item.desc && (
                      <div className="text-xs text-slate-400 mt-0.5 font-medium leading-none truncate">
                        {item.desc}
                      </div>
                    )}
                  </div>
                )}

                {!collapsed && badge > 0 && (
                  <span className="bg-accent text-primary text-sm font-black px-2 py-0.5 rounded-full font-mono shrink-0 ml-1 shadow-sm shadow-accent/25">
                    {badge}
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
