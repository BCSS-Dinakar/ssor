import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, ChevronLeft, ChevronRight, Loader2, Filter, Check } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { TierChip, StatusPill } from '../../../components/portal/Badges';
import { TIERS } from '../../../utils/data/portalData';
import { policeApi } from '../../../api/police.api';

function RegistryDatabase() {
  // Datatable State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Input State (what the user is currently editing)
  const [query, setQuery] = useState('');
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Applied State (what actually gets sent to the API on "Search" click)
  const [appliedQuery, setAppliedQuery] = useState('');
  const [appliedTiers, setAppliedTiers] = useState([]);

  const toggleTier = (t) => {
    setSelectedTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSearch = () => {
    setAppliedQuery(query);
    setAppliedTiers(selectedTiers);
    setPage(1); // Always reset to page 1 on new search
  };

  const activeFiltersCount = selectedTiers.length;

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

  useEffect(() => {
    fetchOffenders();
  }, [fetchOffenders]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumbs={[
          { label: 'Police', to: '/portal' },
          { label: 'Registry Database' },
        ]}
        title="Registry Database"
        subtitle="Search and filter conviction records. Open a file for the full dossier."
      />

      <SecurityBanner>
        Disclosable entries are conviction-based only. Accused persons are never held in this register.
      </SecurityBanner>

      {/* Filter and Search Bar */}
      <div className="p-5 bg-white shadow-sm border border-slate-200 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-base focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/10 transition-all font-semibold text-slate-700 placeholder-slate-400"
              placeholder="Search offender name, area or record ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 border rounded-xl px-5 py-3.5 text-base font-bold transition-all active:scale-95 ${isFilterOpen ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-inner' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
            >
              <Filter className={`w-4 h-4 ${isFilterOpen ? 'text-secondary' : 'text-slate-500'}`} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="text-sm px-2 py-0.5 rounded-full ml-1 bg-secondary text-white shadow-sm">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-gradient-to-r from-secondary to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white rounded-xl px-8 py-3.5 text-base font-bold transition-all shadow-md active:scale-95"
            >
              Search
            </button>
          </div>
        </div>

        {/* Expandable Filters Section */}
        {isFilterOpen && (
          <div className="mt-5 pt-5 border-t border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black tracking-wide text-slate-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                Risk Tier
              </h3>
              {selectedTiers.length > 0 && (
                <button onClick={() => setSelectedTiers([])} className="text-sm text-secondary font-bold hover:underline transition-all">Clear Selection</button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.keys(TIERS).map((t) => (
                <label key={t} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedTiers.includes(t) ? 'bg-secondary/5 border-secondary' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}>
                  <input type="checkbox" className="hidden" checked={selectedTiers.includes(t)} onChange={() => toggleTier(t)} />
                  <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all duration-200 ${selectedTiers.includes(t) ? 'bg-secondary border-secondary text-white' : 'border-slate-300 bg-white'}`}>
                    {selectedTiers.includes(t) && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-bold text-slate-700 tracking-wide">{TIERS[t].name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
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
