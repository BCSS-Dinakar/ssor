import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { TierChip, StatusPill } from '../../../components/portal/Badges';
import { useData } from '../../../context/DataContext';
import { TIERS } from '../../../utils/data/portalData';

function RegistryDatabase() {
  const { offenders, logAudit } = useData();
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');

  const rows = offenders.filter((o) => {
    const q = query.toLowerCase();
    return (
      (!tier || o.tier === tier) &&
      (!status || o.status === status) &&
      (o.name.toLowerCase().includes(q) || o.area.toLowerCase().includes(q) || o.id.toLowerCase().includes(q))
    );
  });



  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Administration / Register"
        title="Offender register"
        subtitle="Search and filter convicted records. Click open for full detail."
      />

      <SecurityBanner>
        Disclosable entries are conviction-based only. Accused persons are never held in this register.
      </SecurityBanner>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center bg-white shadow-sm">
        <div className="relative flex-grow w-full">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all placeholder-slate-400"
            placeholder="Search offender name, area or record ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto shrink-0">
          <select 
            className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15" 
            value={tier} 
            onChange={(e) => setTier(e.target.value)}
          >
            <option value="">All Tiers</option>
            {Object.keys(TIERS).map((t) => (
              <option key={t} value={t}>{TIERS[t].name}</option>
            ))}
          </select>
          <select 
            className="w-full sm:w-44 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="review">Due Review</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="card overflow-hidden bg-white shadow-md border border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b border-slate-150 tracking-wider">
                <th className="py-3.5 px-4 font-bold rounded-tl-2xl">Record ID</th>
                <th className="py-3.5 px-4 font-bold">Offender Profile</th>
                <th className="py-3.5 px-4 font-bold">Risk Tier</th>
                <th className="py-3.5 px-4 font-bold">Offence Classification</th>
                <th className="py-3.5 px-4 font-bold">Area</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold text-right rounded-tr-2xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors font-semibold">
                  <td className="py-3.5 px-4 font-mono text-xs text-secondary font-bold">{o.id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-800 text-sm leading-tight">{o.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">Age {o.age} · {o.cc}</div>
                  </td>
                  <td className="py-3.5 px-4"><TierChip tier={o.tier} /></td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[220px] font-medium leading-relaxed">{o.offence}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-bold">{o.area}</td>
                  <td className="py-3.5 px-4"><StatusPill status={o.status} /></td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/portal/register/${o.id}`}
                      onClick={() => logAudit(`Viewed record ${o.id}`)}
                      className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors text-[10px] font-black text-secondary uppercase tracking-widest"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open File
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">No records match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RegistryDatabase;
