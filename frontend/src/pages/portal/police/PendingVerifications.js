import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { StatusPill } from '../../../components/portal/Badges';
import DataTable from '../../../components/common/DataTable';
import { policeApi } from '../../../api/police.api';
import { PageSkeleton } from '../../../components/ui/Skeleton';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';

function PendingVerifications() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const res = await policeApi.getVerifications();
        if (res.success) {
          setData(res.data.filter((c) => c.status === 'pending' || c.status === 'verifying'));
        } else {
          setError('Unable to load clearance requests.');
        }
      } catch (err) {
        console.error('Failed to load verifications', err);
        setError('Unable to load clearance requests. Please try again.');
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
      render: (row) => (
        <span className="font-mono text-body-sm font-bold text-secondary">{String(row.id).split('-')[0]}</span>
      ),
    },
    {
      label: 'Organization / Candidate',
      key: 'org',
      render: (row) => (
        <div>
          <div className="text-base font-bold leading-tight text-slate-800">{row.orgName}</div>
          <div className="mt-1 text-body-sm font-medium text-muted">
            {row.orgType || 'Clearance request'} · {row.candidateName}
          </div>
        </div>
      ),
    },
    {
      label: 'Role',
      key: 'role',
      render: (row) => <span className="font-semibold text-slate-700">{row.role}</span>,
    },
    {
      label: 'Submitted',
      key: 'submitted',
      render: (row) => (
        <span className="font-mono text-body-sm text-muted">
          {new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      label: 'Status',
      key: 'status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      label: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button asChild variant="secondary" size="sm">
          <Link to={`/portal/clearances/${row.id}`}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Process clearance
          </Link>
        </Button>
      ),
    },
  ];

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6 pb-10 animate-fadeIn">
      <PageHeader
        crumbs={[
          { label: 'Police', to: '/portal' },
          { label: 'Pending Clearances' },
        ]}
        title="Pending Clearances"
        subtitle="Review each candidate against the register and issue or deny clearance."
      />

      <SecurityBanner>
        The organization receives only the decision. No offender identity is disclosed to the requester.
      </SecurityBanner>

      {error && <Alert variant="danger" title="Load error">{error}</Alert>}

      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Search by organization, candidate, or role…"
        emptyTitle="No pending clearances"
        emptyMessage="The clearance queue is empty. New requests will appear here."
      />
    </div>
  );
}

export default PendingVerifications;
