import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileCheck, Eye, Clock, CheckCircle2, AlertTriangle, Loader2, HelpCircle } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import StatCard from '../../../components/portal/StatCard';
import DataTable from '../../../components/common/DataTable';
import { StatusPill } from '../../../components/portal/Badges';
import { organizationApi } from '../../../api/organization.api';

function VerificationRequests() {
  const navigate = useNavigate();
  const [baseList, setBaseList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    organizationApi.getVerifications()
      .then(data => {
        setBaseList(data.verifications);
      })
      .catch(err => console.error("Failed to fetch verifications", err))
      .finally(() => setLoading(false));
  }, []);

  const total = baseList.length;
  const cleared = baseList.filter((r) => r.status === 'cleared').length;
  const rejected = baseList.filter((r) => r.status === 'rejected').length;
  const pending = baseList.filter((r) => r.status === 'pending' || r.status === 'verifying').length;

  const rows = baseList.filter((r) => r.status === 'pending' || r.status === 'rejected' || r.status === 'verifying');

  const columns = [
    {
      label: 'Reference ID',
      key: 'id',
      render: (row) => <span className="font-mono text-sm font-bold text-secondary">{row.id}</span>,
    },
    {
      label: 'Candidate Name',
      key: 'candidateName',
      render: (row) => (
        <div>
          <div className="font-semibold text-primary">{row.candidateName}</div>
          <div className="text-sm text-slate-400 mt-0.5">
            {row.fatherName ? `Father: ${row.fatherName} · ` : ''}ID on file
          </div>
        </div>
      ),
    },
    {
      label: 'Designated Role',
      key: 'role',
      render: (row) => <span className="text-sm font-semibold text-slate-600">{row.role}</span>,
    },
    {
      label: 'Date Submitted',
      key: 'createdAt',
      render: (row) => <span className="font-mono text-sm text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</span>,
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
            className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" /> Track
          </button>

          {row.status === 'cleared' && (
            <button
              onClick={() => alert(`Downloading clearance certificate for ${row.candidate} (${row.id})`)}
              className="inline-flex items-center gap-1 text-sm font-bold text-secondary bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
          )}

          {row.status !== 'cleared' && (
            <button
              onClick={() => navigate('/portal/compliance', { state: { prefillTicket: { reference: row.id, candidate: row.candidateName, status: row.status } } })}
              className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Help
            </button>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={total} icon={FileCheck} meta="All time" />
        <StatCard label="Cleared" value={cleared} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" valueClass="text-emerald-600" meta="Approved to work" metaClass="text-emerald-600" />
        <StatCard label="Rejected" value={rejected} icon={AlertTriangle} accent="bg-red-50 text-red-600" valueClass="text-red-600" meta="Review locks" metaClass="text-red-600" />
        <StatCard label="Pending & Verifying" value={pending} icon={Clock} accent="bg-amber-50 text-amber-600" valueClass="text-amber-500" meta="Police check active" metaClass="text-amber-600" />
      </div>

      <div className="card">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-emerald-500" />
            <p className="text-base font-semibold">Loading verification requests...</p>
          </div>
        ) : (
          <DataTable 
            data={rows} 
            columns={columns} 
            filters={filters} 
            searchPlaceholder="Search by Reference ID or Name..." 
            emptyIcon={FileCheck}
            emptyTitle="No Clearance Requests Found"
            emptyMessage="You have not submitted any background checks yet."
            minHeight="min-h-[300px]"
          />
        )}
      </div>
    </div>
  );
}

export default VerificationRequests;
