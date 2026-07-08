import { useState } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

function PortalLayout() {
  const { auth } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!auth?.role) {
    return <Navigate to="/login" replace />;
  }

  const sidebarInner = (
    <>
      <div className={`px-4 py-5 border-b border-white/10 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 overflow-hidden rounded-none bg-white/10 p-0.5 shrink-0">
              <img src="/images/ssor-logo.png" alt="SSOR" className="h-full w-full object-cover rounded-none" />
            </div>
            <div className="truncate">
              <div className="text-lg font-bold text-white font-heading leading-none">SSOR</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 leading-none">Secure Portal</div>
            </div>
          </Link>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 rounded-none bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors border border-white/10 shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
        </button>
      </div>
      <Sidebar role={auth.role} collapsed={collapsed} onNavigate={() => setMobileOpen(false)} />
    </>
  );

  return (
    <div className={`min-h-screen bg-slate-50 lg:grid transition-all duration-300 ${
      collapsed ? 'lg:grid-cols-[75px_1fr]' : 'lg:grid-cols-[260px_1fr]'
    }`}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col bg-primary sticky top-0 h-screen overflow-y-auto z-20">
        {sidebarInner}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-primary/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-primary h-full overflow-y-auto">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-300 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {/* On mobile, we always render the expanded/non-collapsed variant of the header */}
            <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-none bg-white/10 p-0.5">
                  <img src="/images/ssor-logo.png" alt="SSOR" className="h-full w-full object-cover rounded-none" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-heading leading-none">SSOR</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Secure Portal</div>
                </div>
              </Link>
            </div>
            <Sidebar role={auth.role} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col min-h-screen min-w-0">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PortalLayout;
