import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ExternalLink, ChevronLeft, ChevronRight, Loader2, Database, ShieldAlert, Clock, IndianRupee, Filter, LayoutDashboard } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
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

function EpettyRegistry() {
  // Datatable State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, fines: 0, imprisonment: 0, pending: 0 });
  const [searchParams, setSearchParams] = useSearchParams();

  // Derived state from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const appliedQuery = searchParams.get('search') || '';
  const appliedUnit = searchParams.get('unit') || '';
  const appliedDisposal = searchParams.get('disposal') || '';

  // Input State (initialize from URL so it shows correctly on back)
  const [query, setQuery] = useState(appliedQuery);
  const [unit, setUnit] = useState(appliedUnit);
  const [disposal, setDisposal] = useState(appliedDisposal);

  const fetchStats = async () => {
    try {
      const res = await policeApi.getEpettyRegistryStats();
      if (res?.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await policeApi.getEpettyRegistryList({
        page,
        limit,
        search: appliedQuery,
        unit: appliedUnit,
        disposal: appliedDisposal
      });
      if (res && res.success) {
        setData(res.data);
        if (res.pagination) {
          setTotal(res.pagination.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch e-petty cases:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedQuery, appliedUnit, appliedDisposal]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleSearch = () => {
    setSearchParams({
      page: '1',
      limit: limit.toString(),
      search: query,
      unit: unit,
      disposal: disposal
    });
  };

  const handleClear = () => {
    setQuery('');
    setUnit('');
    setDisposal('');
    setSearchParams({});
  };

  const setPage = (newPage) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('page', typeof newPage === 'function' ? newPage(page).toString() : newPage.toString());
      return p;
    });
  };

  const setLimit = (newLimit) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('limit', newLimit.toString());
      p.set('page', '1');
      return p;
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Compact Header & Banner */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight font-heading">E-petty Dashboard</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Comprehensive database of electronic petty cases and disposal records.</p>
        </div>
        
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm max-w-2xl">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-amber-700 leading-relaxed">
            This database contains electronic petty cases (e-petty). Data is synchronized directly from the central repository.
          </p>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total E-petty Cases" value={stats.total} icon={Database} colorClass="bg-blue-500" />
        <StatCard title="Fines Issued" value={stats.fines} icon={IndianRupee} colorClass="bg-emerald-500" />
        <StatCard title="Imprisonments" value={stats.imprisonment} icon={ShieldAlert} colorClass="bg-red-500" />
        <StatCard title="Pending Disposal" value={stats.pending} icon={Clock} colorClass="bg-amber-500" />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 bg-white shadow-sm border border-slate-200 rounded-2xl">
        <div className="flex flex-col xl:flex-row gap-4 items-center">

          <div className="relative flex-grow w-full xl:w-auto">
            <Search className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-base focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all font-semibold text-slate-700 placeholder-slate-400"
              placeholder="Search offender name, phone number, PS, or case number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto shrink-0">
            <div className="relative flex-grow sm:flex-grow-0">
              <Filter className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full sm:w-[180px] bg-white border border-slate-200 rounded-xl pl-10 pr-8 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-secondary/20 focus:border-secondary cursor-pointer appearance-none"
              >
                <option value="">All Units</option>
                <option value="HYDERABAD">Hyderabad</option>
                <option value="CYBERABAD">Cyberabad</option>
                <option value="Rachakonda">Rachakonda</option>
                <option value="Future City">Future City</option>
                <option value="WARANGAL">Warangal</option>
                <option value="NIZAMABAD">Nizamabad</option>
                <option value="KHAMMAM">Khammam</option>
              </select>
            </div>

            <div className="relative flex-grow sm:flex-grow-0">
              <LayoutDashboard className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <select
                value={disposal}
                onChange={(e) => setDisposal(e.target.value)}
                className="w-full sm:w-[180px] bg-white border border-slate-200 rounded-xl pl-10 pr-8 py-3.5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-secondary/20 focus:border-secondary cursor-pointer appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Fine">Fined</option>
                <option value="Imprisonment">Imprisonment</option>
                <option value="Acquittal">Acquitted</option>
              </select>
            </div>

            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-secondary to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white rounded-xl px-8 py-3.5 text-base font-bold transition-all shadow-md active:scale-95"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="card overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 rounded-2xl">
        <div className="overflow-x-auto min-h-[400px] relative">

          {loading && (
            <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-md flex items-center justify-center transition-all duration-300">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                <span className="text-base font-bold text-slate-600 animate-pulse">Loading e-petty records...</span>
              </div>
            </div>
          )}

          <table className="w-full text-sm text-left min-w-[720px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-sm uppercase font-bold text-slate-400 border-y border-slate-200 tracking-wider">
                <th className="py-3.5 px-5 font-bold">Case Number</th>
                <th className="py-3.5 px-5 font-bold">Offender Profile</th>
                <th className="py-3.5 px-5 font-bold">Act & Section</th>
                <th className="py-3.5 px-5 font-bold">Police Station</th>
                <th className="py-3.5 px-5 font-bold">Offence Date</th>
                <th className="py-3.5 px-5 font-bold">Disposal Status</th>
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
                  <td className="py-4 px-5 text-slate-500 font-mono align-top max-w-[150px]">
                    {o.date}
                  </td>
                  <td className="py-4 px-5 align-top">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${o.disposal === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {o.disposal}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right align-top whitespace-nowrap">
                    <Link
                      to={`/portal/epetty-register/${encodeURIComponent(o.id)}`}
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
                        <Database className="w-8 h-8 text-slate-300" />
                      </div>
                      <div className="text-slate-600 font-bold text-base">No cases found.</div>
                      <button onClick={handleClear} className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">
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

export default EpettyRegistry;
