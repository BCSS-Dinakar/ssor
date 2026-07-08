import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { StatusPill } from '../../../components/portal/Badges';
import { useData } from '../../../context/DataContext';
import DataTable from '../../../components/common/DataTable';

function VerificationHistory() {
  const { clearances } = useData();

  // Filter clearances to only processed (approved/cleared and referred/rejected)
  const historyData = clearances.filter((c) => c.status === 'cleared' || c.status === 'rejected');

  const columns = [
    {
      label: 'Reference ID',
      key: 'id',
      className: 'font-mono text-secondary text-xs font-bold',
    },
    {
      label: 'Organization / Requester',
      key: 'org',
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 text-sm leading-tight">{row.org}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-0.5">{row.type || 'Candidate Vetting'} · Candidate: {row.candidate}</div>
        </div>
      ),
    },
    {
      label: 'Vetted Role',
      key: 'role',
      className: 'text-slate-655 font-bold',
    },
    {
      label: 'Decision Date',
      key: 'decisionDate',
      render: (row) => (
        <span className="font-mono text-slate-500 font-bold">
          {row.decisionDate || row.submitted}
        </span>
      ),
    },
    {
      label: 'Outcome Decision',
      key: 'status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      label: 'Action',
      key: 'action',
      className: 'text-right',
      render: (row) => (
        <Link
          to={`/portal/clearance-history/${row.id}`}
          className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors text-[9px] font-black text-secondary uppercase tracking-widest"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View Vetting File
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Administration / Vetting History"
        title="Vetting Decision History"
        subtitle="Review historic vetting clearances, matching sus identification records, and police logs."
      />

      <SecurityBanner>
        Audit records of all issued certificates and match confirmation decisions.
      </SecurityBanner>

      <div className="card p-6 bg-white shadow-md border border-slate-200/80 rounded-2xl">
        <DataTable data={historyData} columns={columns} />
      </div>
    </div>
  );
}

export default VerificationHistory;
