import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLE_META } from '../utils/data/portalData';

function Header({ onMenu }) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const meta = ROLE_META[auth?.role] || {};

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 font-body shadow-sm shadow-slate-100/50">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="lg:hidden text-slate-500 hover:text-primary p-2 -ml-2 rounded-xl hover:bg-slate-50" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">{meta.kicker}</div>
          <div className="text-sm font-black text-primary font-heading mt-1 leading-none">{meta.title}</div>
        </div>
      </div>

      <div className="flex items-center gap-4">


        {/* Profile Dropdown Panel Trigger */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-50 transition-all duration-200 border border-transparent active:border-slate-200"
          >
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-xs font-black font-heading shadow-md shadow-primary/10">
              {(auth?.name || 'U').charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-extrabold text-primary leading-tight font-heading">{auth?.name}</div>
              <div className="text-[9px] text-slate-455 font-bold mt-0.5 uppercase tracking-wider">{auth?.clearance || 'Officer'}</div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white shadow-2xl shadow-primary/10 border border-slate-150 rounded-2xl py-1.5 z-40 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30">
                <div className="text-xs font-bold text-slate-800">{auth?.name}</div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">{auth?.loginId || auth?.clearance}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-650 hover:bg-red-50 font-bold transition-colors"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                Sign out console
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
