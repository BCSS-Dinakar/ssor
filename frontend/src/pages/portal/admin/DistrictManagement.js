import { useState, useEffect } from 'react';
import { MapPin, UserCheck, UserX, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from '../../../utils/axios';

function DistrictManagement() {
  const [districts, setDistricts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    Promise.all([fetchDistricts(), fetchAdmins()]).finally(() => setLoading(false));
  }, []);

  const fetchDistricts = async () => {
    try {
      const res = await axios.get('/api/districts');
      if (res.data.success) setDistricts(res.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchAdmins = async () => {
    try {
      const res = await axios.get('/api/admin/district-admins');
      if (res.data.success) setAdmins(res.data.data);
    } catch (err) { console.error(err); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post('/api/districts/sync');
      await fetchDistricts();
    } catch (err) {
      console.error('Failed to sync districts.');
    } finally {
      setSyncing(false);
    }
  };

  // Build a map of distCode -> admin
  const adminByDist = admins.reduce((acc, a) => {
    if (a.distCode) acc[a.distCode] = a;
    return acc;
  }, {});

  const assigned = districts.filter(d => adminByDist[d.distCode]);
  const unassigned = districts.filter(d => !adminByDist[d.distCode]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/portal/settings" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors w-max">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">District Overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reference view of all districts and their assigned admins. Sourced from CCTNS via FDW.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync from CCTNS'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Districts', value: districts.length, color: 'text-slate-700' },
          { label: 'Admin Assigned', value: assigned.length, color: 'text-emerald-600' },
          { label: 'Unassigned', value: unassigned.length, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">District</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Assigned Admin</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {districts.map(d => {
                const admin = adminByDist[d.distCode];
                return (
                  <tr key={d.distCode} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                        {d.distName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.distCode}</td>
                    <td className="px-4 py-3">
                      {admin ? (
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="font-medium">{admin.policeProfile?.name || admin.loginId}</span>
                          <span className="text-slate-400 text-xs">({admin.loginId})</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <UserX className="h-3.5 w-3.5" />
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {admin ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          Assigned
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {districts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">
                    No districts found. Click "Sync from CCTNS" to load districts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DistrictManagement;
