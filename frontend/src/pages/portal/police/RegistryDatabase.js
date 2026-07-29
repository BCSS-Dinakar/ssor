import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ExternalLink, ShieldAlert, Database, AlertTriangle, UserMinus } from 'lucide-react';
import { TierChip, StatusPill } from '../../../components/portal/Badges';
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

function RegistryDatabase() {
  // Datatable State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, highRisk: 0, monitorList: 0, absconding: 0 });

  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const appliedQuery = searchParams.get('search') || '';
  const tierStr = searchParams.get('tier') || '';
  const statusStr = searchParams.get('status') || '';
  const crimeStr = searchParams.get('crime') || '';

  const appliedTiers = useMemo(() => tierStr ? tierStr.split(',') : [], [tierStr]);
  const appliedStatus = useMemo(() => statusStr ? statusStr.split(',') : [], [statusStr]);
  const appliedCrime = useMemo(() => crimeStr ? crimeStr.split(',') : [], [crimeStr]);

  const fetchOffenders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await policeApi.getOffendersList({
        page,
        limit,
        search: appliedQuery,
        tier: tierStr,
        status: statusStr,
        crime: crimeStr
      });
      if (res?.success) {
        setData(res.data);
        setTotal(res.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch offenders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, appliedQuery, tierStr, statusStr, crimeStr]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await policeApi.getOffendersStats();
      if (res?.success) {
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

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Profiles" value={stats.total} icon={Database} colorClass="bg-blue-500" />
        <StatCard title="High Risk" value={stats.highRisk} icon={ShieldAlert} colorClass="bg-red-500" />
        <StatCard title="Monitor List" value={stats.monitorList} icon={AlertTriangle} colorClass="bg-slate-800" />
        <StatCard title="Absconding" value={stats.absconding} icon={UserMinus} colorClass="bg-amber-500" />
      </div>

      <DataTable
        data={data}
        totalRows={total}
        page={page}
        pageSize={limit}
        loading={loading}
        initialSearch={appliedQuery}
        initialFilters={{ 
          tier: appliedTiers,
          status: appliedStatus,
          crime: appliedCrime
        }}
        searchPlaceholder="Search offender name, area or record ID..."
        emptyTitle="No records found matching your filters."
        emptyMessage="Try adjusting your search query or changing filters."
        emptyIcon={Search}
        columns={[
          {
            key: 'id',
            label: 'Record ID',
            render: (row) => (
              <div className="font-mono text-sm text-secondary font-bold group-hover:text-secondary/80 transition-colors" title={row.id}>
                {row.id}
              </div>
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
            key: 'tier',
            label: 'Risk Tier',
            render: (row) => <TierChip tier={row.tier} />
          },
          {
            key: 'offence',
            label: 'Offence Classification',
            render: (row) => {
              const offence = row.offence === 'N/A' || row.offence === '—' || !row.offence ? '-' : row.offence;
              return (
                <div className="text-slate-600 max-w-[200px] font-semibold leading-relaxed group-hover:text-slate-800 transition-colors line-clamp-2" title={offence}>
                  {offence}
                </div>
              );
            }
          },
          {
            key: 'area',
            label: 'Area',
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
            key: 'status',
            label: 'Status',
            render: () => <StatusPill status="active" />
          },
          {
            key: 'action',
            label: 'Action',
            align: 'right',
            render: (row) => (
              <div className="whitespace-nowrap">
                <Link
                  to={`/portal/register/${row.id}`}
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
            key: 'tier',
            label: 'Risk Tier',
            multiple: true,
            options: [
              { value: 'Red', label: 'Red Tier' },
              { value: 'Black', label: 'Black Tier' },
              { value: 'Blue', label: 'Blue Tier' }
            ]
          },
          {
            key: 'status',
            label: 'Status',
            multiple: true,
            options: [
              { value: 'Active', label: 'Active' },
              { value: 'Absconding', label: 'Absconding' },
              { value: 'In Jail', label: 'In Jail' },
              { value: 'On Bail', label: 'On Bail' }
            ]
          },
          {
            key: 'crime',
            label: 'Crime Type',
            multiple: true,
            options: [
              { value: 'Crime Against Women', label: 'Against Women' },
              { value: 'Cyber Crime', label: 'Cyber Crime' },
              { value: 'Property', label: 'Property Offence' },
              { value: 'Bodily', label: 'Bodily Offence' }
            ]
          }
        ]}
        onApplyFilters={({ search, filters }) => {
          setSearchParams({ 
            search: search, 
            page: 1, 
            limit, 
            tier: (filters.tier || []).join(','),
            status: (filters.status || []).join(','),
            crime: (filters.crime || []).join(',')
          });
        }}
        onPageChange={(p) => {
          setSearchParams({ 
            search: appliedQuery, 
            page: p, 
            limit, 
            tier: appliedTiers.join(','),
            status: appliedStatus.join(','),
            crime: appliedCrime.join(',')
          });
        }}
        onPageSizeChange={(size) => {
          setSearchParams({ 
            search: appliedQuery, 
            page: 1, 
            limit: size, 
            tier: appliedTiers.join(','),
            status: appliedStatus.join(','),
            crime: appliedCrime.join(',')
          });
        }}
      />
    </div>
  );
}

export default RegistryDatabase;
