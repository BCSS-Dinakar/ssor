import { useNavigate } from 'react-router-dom';
import { Download, FileCheck, Eye, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import StatCard from '../../../components/portal/StatCard';
import DataTable from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/portal/Badges';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

function VerificationRequests() {
  const { auth } = useAuth();
  const { clearances } = useData();
  const navigate = useNavigate();

  const mine = clearances.filter((c) => c.org && c.org.includes(auth.name));
  const baseList = mine.length ? mine : clearances;

  const total = baseList.length;
  const cleared = baseList.filter((r) => r.status === 'cleared').length;
  const rejected = baseList.filter((r) => r.status === 'rejected').length;
  const pending = baseList.filter((r) => r.status === 'pending').length;

  const rows = baseList.filter((r) => r.status === 'pending' || r.status === 'rejected' || r.status === 'verifying');

  const columns = [
    {
      label: 'Reference ID',
      key: 'id',
      render: (row) => <span className="font-mono text-xs font-bold text-secondary">{row.id}</span>,
    },
    {
      label: 'Candidate Name',
      key: 'candidate',
      render: (row) => (
        <div>
          <div className="font-semibold text-primary">{row.candidate}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{row.idNumber || 'ID on file'}</div>
        </div>
      ),
    },
    {
      label: 'Designated Role',
      key: 'role',
      render: (row) => <span className="text-xs font-semibold text-slate-600">{row.role}</span>,
    },
    {
      label: 'Date Submitted',
      key: 'submitted',
      render: (row) => <span className="font-mono text-xs text-slate-500">{row.submitted || '—'}</span>,
    },
    {
      label: 'Verification Status',
      key: 'status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      label: 'Outcome / Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate(`/portal/track/${row.id}`)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> Track
          </button>

          {row.status === 'cleared' && (
            <button
              onClick={() => alert(`Downloading clearance certificate for ${row.candidate} (${row.id})`)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
          )}

          {row.status === 'pending' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-1.5 rounded-full border border-blue-200 uppercase tracking-wider">
              Pending
            </span>
          )}

          {row.status === 'verifying' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-1.5 rounded-full border border-amber-200 uppercase tracking-wider animate-pulse">
              Verifying
            </span>
          )}

          {row.status === 'rejected' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-50 px-2 py-1.5 rounded-full border border-red-200 uppercase tracking-wider">
              Rejected
            </span>
          )}
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Verifying', value: 'verifying' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ];

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        crumb="Applications List"
        title="Applications List"
        subtitle="Search and inspect submitted checks for your organization."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={total} icon={FileCheck} meta="All time" />
        <StatCard label="Cleared" value={cleared} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" valueClass="text-emerald-600" meta="Approved to work" metaClass="text-emerald-600" />
        <StatCard label="Rejected" value={rejected} icon={AlertTriangle} accent="bg-red-50 text-red-600" valueClass="text-red-600" meta="Review locks" metaClass="text-red-600" />
        <StatCard label="Pending & Verifying" value={pending + baseList.filter((r) => r.status === 'verifying').length} icon={Clock} accent="bg-amber-50 text-amber-600" valueClass="text-amber-500" meta="Police check active" metaClass="text-amber-600" />
      </div>

      <DataTable
        data={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search candidate name, reference ID, or role..."
        emptyIcon={FileCheck}
        emptyTitle="No Clearance Requests Found"
        emptyMessage="You have not submitted any background checks yet."
        minHeight="min-h-[300px]"
      />
    </div>
  );
}

export default VerificationRequests;
