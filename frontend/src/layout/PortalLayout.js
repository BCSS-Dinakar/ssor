import { useState } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { Button } from '../components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../components/ui/Dialog';

function PortalLayout() {
  const { auth } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!auth?.role) {
    return <Navigate to="/login" replace />;
  }

  const brandBlock = (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-2.5 rounded focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent"
      onClick={() => setMobileOpen(false)}
    >
      <div className="h-9 w-9 shrink-0 overflow-hidden bg-white/10 p-0.5">
        <img src="/images/ssor-logo.png" alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 truncate">
        <div className="font-heading text-base font-bold leading-none text-white">SSOR</div>
        <div className="mt-1 text-xs leading-none text-slate-400">Secure Portal</div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-dvh bg-background lg:pl-56">
      {/* Fixed desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col overflow-hidden bg-primary lg:flex"
        aria-label="Main navigation"
      >
        <div className="flex shrink-0 items-center border-b border-white/10 px-3 py-3">
          {brandBlock}
        </div>
        <Sidebar role={auth.role} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Mobile / tablet drawer */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          showClose={false}
          className="fixed inset-y-0 left-0 top-0 flex h-dvh max-h-dvh w-[min(18rem,88vw)] max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-primary p-0 shadow-elevated data-[state=open]:animate-fadeIn lg:hidden"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Navigation menu</DialogTitle>
          <DialogDescription className="sr-only">Portal section links</DialogDescription>
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-3 pr-12">
            {brandBlock}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="absolute right-2 top-2 z-10 text-slate-300 hover:bg-white/10 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
          <Sidebar role={auth.role} onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="portal-content w-full min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-4 lg:px-5 xl:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PortalLayout;
