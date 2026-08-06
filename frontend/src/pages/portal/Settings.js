import { Users, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Settings() {
  const { auth: user } = useAuth();
  const isStateAdmin = user?.role?.toUpperCase() === 'STATE_ADMIN';

  if (!isStateAdmin) {
    return (
      <div className="space-y-8 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            No configuration options available for your current role.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Administration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Centralized hub to manage system users and district configurations.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Link to="/portal/admin/users" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 block">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">User Management</h2>
          </div>
          <p className="text-sm text-slate-500">
            Create and manage system users, assign roles, and control access levels across the entire platform.
          </p>
        </Link>

        <Link to="/portal/admin/districts" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 block">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
              <ClipboardList className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">District Setup</h2>
          </div>
          <p className="text-sm text-slate-500">
            Configure district parameters, manage jurisdictions, and set up properties for all regional divisions.
          </p>
        </Link>
      </div>
    </div>
  );
}

export default Settings;
