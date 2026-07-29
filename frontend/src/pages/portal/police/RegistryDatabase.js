import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ChevronLeft, ChevronRight, Loader2, Filter, Check, ShieldAlert, Database, AlertTriangle, UserMinus } from 'lucide-react';
import { TierChip, StatusPill } from '../../../components/portal/Badges';
import { TIERS } from '../../../utils/data/portalData';
import { policeApi } from '../../../api/police.api';

function StatCard({ title, value, icon: Icon, colorClass }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${colorClass}`} />
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-slate-500 font-bold text-sm tracking-wide">{title}</h3>
        <div className={`p-2 rounded-xl bg-slate-50 ${colorClass.replace('bg-', 'text-')}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-black text-slate-800 font-heading">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function RegistryDatabase() {
  // Datatable State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, highRisk: 0, monitorList: 0, absconding: 0 });

  // Input State (what the user is currently editing)
  const [query, setQuery] = useState('');
  const [selectedTiers, setSelectedTiers] = useState([]);

  // Applied State (what actually gets sent to the API on "Search" click)
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedTiers, setAppliedTiers] = useState([]);

  const handleSearch = () => {
    setAppliedQuery(query);
    setAppliedTiers(selectedTiers);
    setPage(1); // Always reset to page 1 on new search
  };

  const fetchOffenders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await policeApi.getOffendersList({
        page,
        limit,
        search: appliedQuery,
        tier: appliedTiers.join(',')
      });
      if (res && res.success) {
        setData(res.data);
        if (res.pagination) {
          setTotal(res.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch offenders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedQuery, appliedTiers]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await policeApi.getOffendersStats();
      if (res && res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchOffenders();
  }, [fetchOffenders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Compact Header & Banner */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight font-heading">Registry Database</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Search and filter conviction records. Open a file for the full dossier.</p>
        </div>
        
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-700 whitespace-nowrap">
            Disclosable entries are conviction-based only. Accused persons are not held here.
          </p>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Profiles" value={stats.total} icon={Database} colorClass="bg-blue-500" />
        <StatCard title="High Risk" value={stats.highRisk} icon={ShieldAlert} colorClass="bg-red-500" />
        <StatCard title="Monitor List" value={stats.monitorList} icon={AlertTriangle} colorClass="bg-slate-800" />
        <StatCard title="Absconding" value={stats.absconding} icon={UserMinus} colorClass="bg-amber-500" />
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-grow w-full">
          <Search className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all font-bold text-slate-700 placeholder-slate-400"
            placeholder="Search offender name, area or record ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto shrink-0">
          {/* Tier Filter */}
          <div className="relative flex-grow md:flex-grow-0">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={appliedTiers.length > 0 ? appliedTiers[0] : ''}
              onChange={(e) => {
                const val = e.target.value;
                setAppliedTiers(val ? [val] : []);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 font-bold rounded-xl pl-9 pr-8 py-3 appearance-none focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 cursor-pointer shadow-sm w-full md:w-40"
            >
              <option value="">All Tiers</option>
              <option value="RED">High Risk</option>
              <option value="BLUE">Medium Risk</option>
              <option value="BLACK">Monitor List</option>
            </select>
          </div>
          
          <button
            onClick={handleSearch}
            className="bg-primary hover:bg-secondary text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="card overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 rounded-2xl">
        <div className="overflow-x-auto min-h-[400px] relative">

          {loading && (
            <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-md flex items-center justify-center transition-all duration-300">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                <span className="text-base font-bold text-slate-600 animate-pulse">Loading database...</span>
              </div>
            </div>
          )}

          <table className="w-full text-sm text-left min-w-[720px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-sm uppercase font-bold text-slate-400 border-y border-slate-200 tracking-wider">
                <th className="py-3.5 px-5 font-bold">Record ID</th>
                <th className="py-3.5 px-5 font-bold">Offender Profile</th>
                <th className="py-3.5 px-5 font-bold">Risk Tier</th>
                <th className="py-3.5 px-5 font-bold">Offence Classification</th>
                <th className="py-3.5 px-5 font-bold">Area</th>
                <th className="py-3.5 px-5 font-bold">Status</th>
                <th className="py-3.5 px-5 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((o) => (
                <tr key={o.id} className="group hover:bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 font-semibold relative z-10 hover:z-20">
                  <td className="py-4 px-5 font-mono text-sm text-secondary font-bold group-hover:text-secondary/80 transition-colors align-top">{o.id}</td>
                  <td className="py-4 px-5 align-top">
                    <div className="font-black text-slate-800 text-base leading-tight group-hover:text-primary transition-colors truncate max-w-[180px]" title={o.name === 'N/A' || o.name === '—' || !o.name ? '-' : o.name}>
                      {o.name === 'N/A' || o.name === '—' || !o.name ? '-' : o.name}
                    </div>
                  </td>
                  <td className="py-4 px-5 align-top"><TierChip tier={o.tier} /></td>
                  <td className="py-4 px-5 text-slate-600 max-w-[240px] font-semibold leading-relaxed group-hover:text-slate-800 transition-colors align-top">
                    <div className="line-clamp-2" title={o.offence === 'N/A' || o.offence === '—' || !o.offence ? '-' : o.offence}>
                      {o.offence === 'N/A' || o.offence === '—' || !o.offence ? '-' : o.offence}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 font-bold group-hover:text-slate-700 transition-colors align-top max-w-[150px]">
                    <div className="line-clamp-2" title={o.area === 'N/A' || o.area === '—' || !o.area ? '-' : o.area}>
                      {o.area === 'N/A' || o.area === '—' || !o.area ? '-' : o.area}
                    </div>
                  </td>
                  <td className="py-4 px-5 align-top"><StatusPill status="active" /></td>
                  <td className="py-4 px-5 text-right align-top whitespace-nowrap">
                    <Link
                      to={`/portal/register/${o.id}`}
                      className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all duration-300 text-sm font-black text-slate-700 tracking-wide active:scale-95"
                    >
                      <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-secondary transition-colors" /> Open File
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                        <Search className="w-8 h-8 text-slate-300" />
                      </div>
                      <div className="text-slate-600 font-bold text-base">No records found matching your filters.</div>
                      <div className="text-slate-400 font-medium text-base">Try adjusting your search query or unchecking some Risk Tiers.</div>
                      <button onClick={() => { setQuery(''); setSelectedTiers([]); setAppliedQuery(''); setAppliedTiers([]); setPage(1); }} className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-slate-200/60 px-5 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/80 backdrop-blur-sm relative z-20">
          <div className="text-sm font-bold text-slate-500">
            Showing <span className="text-slate-800">{data.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="text-slate-800">{Math.min(page * limit, total)}</span> of <span className="text-slate-800">{total}</span> records
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              Rows:
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-white border border-slate-200 rounded-lg py-1.5 pl-3 pr-8 focus:ring-2 focus:ring-secondary/20 focus:border-secondary font-bold text-slate-800 cursor-pointer shadow-sm transition-all"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-secondary hover:border-secondary hover:shadow-sm disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-black text-slate-700 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm min-w-[90px] text-center tracking-wider">
                {page} <span className="text-slate-400 font-bold mx-1">/</span> {totalPages || 1}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-secondary hover:border-secondary hover:shadow-sm disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistryDatabase;
