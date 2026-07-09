import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { StatusPill } from '../../../components/portal/Badges';
import DataTable from '../../../components/common/DataTable';
import { policeApi } from '../../../api/police.api';

function PendingVerifications() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const res = await policeApi.getVerifications();
        if (res.success) {
          setData(res.data.filter((c) => c.status === 'pending' || c.status === 'verifying'));
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
      label: 'Reference',
      key: 'id',
      className: 'font-mono text-secondary text-xs font-bold',
      render: (row) => row.id.split('-')[0]
    },
    {
      label: 'Organization / Requester',
      key: 'org',
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 text-sm leading-tight">{row.orgName}</div>
          <div className="text-[10px] text-slate-400 font-bold mt-0.5">{row.orgType || 'Candidate Vetting'} · Candidate: {row.candidateName}</div>
        </div>
      ),
    },
    {
      label: 'Targeted Role',
      key: 'role',
      className: 'text-slate-655 font-bold',
    },
    {
      label: 'Submitted Date',
      key: 'submitted',
      className: 'font-mono text-slate-500 font-bold',
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    {
      label: 'Decision Status',
      key: 'status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      label: 'Action',
      key: 'action',
      className: 'text-right',
      render: (row) => (
        <Link
          to={`/portal/clearances/${row.id}`}
          className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors text-[10px] font-black text-secondary uppercase tracking-widest"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Process Vetting
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Administration / Requests"
        title="Clearance requests"
        subtitle="Verify each candidate against the register and issue a decision."
      />

      <SecurityBanner>
        The organization receives only the decision. No offender identity is disclosed to the requester.
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

export default PendingVerifications;
