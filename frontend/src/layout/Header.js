import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Menu, LogOut, UserCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_META, NAV } from '../utils/data/portalData';
import { Button } from '../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../components/ui/DropdownMenu';

function Header({ onMenu }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const meta = ROLE_META[auth?.role] || {};

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const location = useLocation();
  const navItems = NAV[auth?.role] || [];
  let currentNav = null;
  if (location.pathname === '/portal') {
    currentNav = navItems.find(item => item.path === '/portal');
  } else {
    currentNav = [...navItems]
      .filter(item => item.path && location.pathname.startsWith(item.path))
      .sort((a, b) => b.path.length - a.path.length)[0];
  }

  const roleName = auth?.role === 'police' ? 'Police' : 'Organization';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 shadow-panel sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenu}
          className="lg:hidden -ml-1"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider font-bold leading-none text-muted flex items-center gap-1.5">
            <span>{roleName}</span>
            {currentNav && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-secondary">{currentNav.label}</span>
              </>
            )}
          </div>
          <div className="mt-1.5 truncate font-heading text-sm font-bold leading-none text-primary sm:text-base">
            {currentNav ? currentNav.label : meta.title}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-transparent px-1.5 py-1 hover:border-slate-200 hover:bg-slate-50 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary"
            aria-label="Account menu"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-white"
              aria-hidden="true"
            >
              {(auth?.name || 'U').charAt(0)}
            </div>
            <div className="hidden text-left sm:block">
              <div className="font-heading text-sm font-bold leading-tight text-primary">{auth?.name}</div>
              <div className="mt-0.5 text-xs font-medium text-muted">
                {auth?.clearance || (auth?.role === 'police' ? 'Officer' : 'Organization')}
              </div>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <div className="font-bold text-slate-800">{auth?.name}</div>
            <div className="mt-0.5 font-mono text-body-sm font-normal text-muted">
              {auth?.loginId || auth?.clearance || auth?.role}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/portal/profile" className="w-full">
              <UserCircle className="h-4.5 w-4.5" aria-hidden="true" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleLogout}
            className="text-danger focus:bg-danger-50 focus:text-danger"
          >
            <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default Header;
