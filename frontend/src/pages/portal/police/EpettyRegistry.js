import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, Database, ShieldAlert, Clock, IndianRupee } from 'lucide-react';
import { policeApi } from '../../../api/police.api';
import DataTable from '../../../components/common/DataTable';

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

  const fetchStats = useCallback(async () => {
    try {
      const res = await policeApi.getEpettyRegistryStats();
      if (res?.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

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
    fetchCases();
  }, [fetchCases, fetchStats]);

  // Handlers for pagination were moved to DataTable

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Compact Header & Banner */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight font-heading">E-petty Dashboard</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Comprehensive database of electronic petty cases and disposal records.</p>
        </div>
        
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-700 whitespace-nowrap">
            Contains electronic petty cases (e-petty) synchronized directly from the central repository.
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

      {/* Epetty DataTable */}
      <DataTable
        data={data}
        totalRows={total}
        page={page}
        pageSize={limit}
        loading={loading}
        initialSearch={appliedQuery}
        initialFilters={{
          unit: appliedUnit ? appliedUnit.split(',') : [],
          disposal: appliedDisposal ? appliedDisposal.split(',') : []
        }}
        searchPlaceholder="Search offender name, phone number, PS, or case number..."
        emptyTitle="No cases found."
        emptyMessage="Try adjusting your search query or changing filters."
        emptyIcon={Database}
        columns={[
          {
            key: 'id',
            label: 'Case Number',
            render: (row) => (
              <span className="font-mono text-sm text-secondary font-bold group-hover:text-secondary/80 transition-colors">
                {row.id}
              </span>
            )
          },
          {
            key: 'name',
            label: 'Offender Profile',
            render: (row) => {
              const name = row.name === 'N/A' || row.name === '—' || !row.name ? '-' : row.name;
              return (
                <div className="font-black text-slate-800 text-base leading-tight group-hover:text-primary transition-colors truncate max-w-[150px]" title={name}>
                  {name}
                </div>
              );
            }
          },
          {
            key: 'offence',
            label: 'Act & Section',
            render: (row) => {
              const offence = row.offence === 'N/A' || row.offence === '—' || !row.offence ? '-' : row.offence;
              return (
                <div className="text-slate-600 max-w-[180px] font-semibold leading-relaxed group-hover:text-slate-800 transition-colors line-clamp-2" title={offence}>
                  {offence}
                </div>
              );
            }
          },
          {
            key: 'area',
            label: 'Police Station',
            render: (row) => {
              const area = row.area === 'N/A' || row.area === '—' || !row.area ? '-' : row.area;
              return (
                <div className="text-slate-500 font-bold group-hover:text-slate-700 transition-colors max-w-[130px] line-clamp-2" title={area}>
                  {area}
                </div>
              );
            }
          },
          {
            key: 'date',
            label: 'Offence Date',
            render: (row) => {
              const formattedDate = row.date ? String(row.date).split('.')[0] : '-';
              return (
                <span className="text-slate-500 font-mono whitespace-nowrap text-sm">
                  {formattedDate}
                </span>
              );
            }
          },
          {
            key: 'disposal',
            label: 'Disposal Status',
            render: (row) => (
              <span className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wide ${row.disposal === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {row.disposal}
              </span>
            )
          },
          {
            key: 'action',
            label: 'Action',
            align: 'right',
            render: (row) => (
              <div className="whitespace-nowrap">
                <Link
                  to={`/portal/epetty-register/${encodeURIComponent(row.id)}`}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all duration-300 text-sm font-black text-slate-700 tracking-wide active:scale-95"
                >
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-secondary transition-colors" /> Open File
                </Link>
              </div>
            )
          }
        ]}
        filters={[
          {
            key: 'unit',
            label: 'All Units',
            multiple: true,
            options: [
              { value: 'HYDERABAD', label: 'Hyderabad' },
              { value: 'CYBERABAD', label: 'Cyberabad' },
              { value: 'Rachakonda', label: 'Rachakonda' },
              { value: 'Future City', label: 'Future City' },
              { value: 'WARANGAL', label: 'Warangal' },
              { value: 'NIZAMABAD', label: 'Nizamabad' },
              { value: 'KHAMMAM', label: 'Khammam' }
            ]
          },
          {
            key: 'disposal',
            label: 'All Statuses',
            multiple: true,
            options: [
              { value: 'Pending', label: 'Pending' },
              { value: 'Fine', label: 'Fined' },
              { value: 'Imprisonment', label: 'Imprisonment' },
              { value: 'Acquittal', label: 'Acquitted' }
            ]
          }
        ]}
        onApplyFilters={({ search, filters }) => {
          setSearchParams({ 
            search: search, 
            page: 1, 
            limit, 
            unit: (filters.unit || []).join(','), 
            disposal: (filters.disposal || []).join(',') 
          });
        }}
        onPageChange={(p) => {
          setSearchParams({ search: appliedQuery, page: p, limit, unit: appliedUnit, disposal: appliedDisposal });
        }}
        onPageSizeChange={(size) => {
          setSearchParams({ search: appliedQuery, page: 1, limit: size, unit: appliedUnit, disposal: appliedDisposal });
        }}
      />
    </div>
  );
}

export default EpettyRegistry;
