import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { StatusPill } from '../../../components/portal/Badges';
import DataTable from '../../../components/common/DataTable';
import { policeApi } from '../../../api/police.api';

function VerificationHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const res = await policeApi.getVerifications();
        if (res.success) {
          setData(res.data.filter((c) => c.status === 'cleared' || c.status === 'rejected'));
        }
      } catch (err) {
        console.error('Failed to load verifications', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVerifications();
  }, []);

  const columns = [
    {
      label: 'Reference ID',
      key: 'id',
      className: 'font-mono text-secondary text-sm font-bold',
      render: (row) => row.id.split('-')[0]
    },
    {
      label: 'Organization / Requester',
      key: 'org',
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 text-base leading-tight">{row.orgName}</div>
          <div className="text-sm text-slate-400 font-bold mt-0.5">{row.orgType || 'Candidate Vetting'} · Candidate: {row.candidateName}</div>
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
          {new Date(row.updatedAt || row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
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
          className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors text-xs font-black text-secondary uppercase tracking-widest"
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
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <DataTable data={data} columns={columns} />
        )}
      </div>
    </div>
  );
}

export default VerificationHistory;
