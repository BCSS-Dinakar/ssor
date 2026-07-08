import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronDown, CheckCircle, AlertTriangle, Info, BellRing } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ROLE_META } from '../utils/data/portalData';

function Header({ onMenu }) {
  const { auth, logout } = useAuth();
  const { counts } = useData();
  const navigate = useNavigate();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const meta = ROLE_META[auth?.role] || {};

  // Build notifications list based on role
  let notificationsList = [];
  if (auth?.role === 'police') {
    if (counts.clearPending > 0) {
      notificationsList.push({
        id: 'p1',
        type: 'warning',
        text: `${counts.clearPending} Clearance requests pending DSP action.`,
        time: 'Just now'
      });
    }
    if (counts.discPending > 0) {
      notificationsList.push({
        id: 'p2',
        type: 'info',
        text: `${counts.discPending} Child threat disclosure inquiries awaiting review.`,
        time: '10 mins ago'
      });
    }
    if (counts.reportsNew > 0) {
      notificationsList.push({
        id: 'p3',
        type: 'error',
        text: `${counts.reportsNew} New anonymous crisis offence reports received.`,
        time: '1 hour ago'
      });
    }
  } else {
    // Organization notifications
    notificationsList = [
      { id: 'o1', type: 'success', text: 'Verification check for Applicant A is COMPLETED.', time: '2 hours ago' },
      { id: 'o2', type: 'info', text: 'New Safe Hiring and POCSO guidelines issued by DGP Office.', time: '1 day ago' },
      { id: 'o3', type: 'warning', text: 'Clearance request CLR-2026-00468 requires additional consent document.', time: '2 days ago' },
    ];
  }

  const notifCount = notificationsList.length;

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
        {/* Notifications Panel Trigger */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative text-slate-500 hover:text-primary p-2 rounded-xl hover:bg-slate-50 transition-all duration-200 border border-transparent active:border-slate-200"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 bg-accent text-primary text-[9px] font-extrabold rounded-full flex items-center justify-center font-mono animate-bounce shadow-sm shadow-accent/50">
                {notifCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white shadow-2xl shadow-primary/10 border border-slate-150 rounded-2xl z-45 overflow-hidden transform origin-top-right transition-all">
              <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BellRing className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-bold text-slate-800">Recent Safe Updates</span>
                </div>
                <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wider">{notifCount} alert{notifCount > 1 ? 's' : ''}</span>
              </div>
              
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {notificationsList.map((item) => {
                  let NotifIcon = Info;
                  let iconColor = 'bg-blue-50 text-blue-600 border-blue-100';
                  if (item.type === 'success') {
                    NotifIcon = CheckCircle;
                    iconColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                  } else if (item.type === 'warning' || item.type === 'error') {
                    NotifIcon = AlertTriangle;
                    iconColor = 'bg-red-50 text-red-500 border-red-100';
                  }

                  return (
                    <div key={item.id} className="p-3.5 hover:bg-slate-50 transition-colors flex gap-3 text-xs leading-relaxed text-slate-700 font-semibold">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${iconColor}`}>
                        <NotifIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-2 text-[11px]">{item.text}</p>
                        <span className="text-[9px] text-slate-400 font-medium block mt-1 font-mono">{item.time}</span>
                      </div>
                    </div>
                  );
                })}
                {notifCount === 0 && (
                  <div className="p-8 text-center text-slate-400 font-medium text-xs">
                    No active notifications to report.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
