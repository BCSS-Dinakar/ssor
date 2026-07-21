import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { StatusPill } from '../../../components/portal/Badges';
import DataTable from '../../../components/common/DataTable';
import { policeApi } from '../../../api/police.api';
import { ListSkeleton } from '../../../components/ui/Skeleton';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';

function VerificationHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        const res = await policeApi.getVerifications();
        if (res.success) {
          setData(res.data.filter((c) => c.status === 'cleared' || c.status === 'rejected'));
        } else {
          setError('Unable to load clearance history.');
        }
      } catch (err) {
        console.error('Failed to load verifications', err);
        setError('Unable to load clearance history. Please try again.');
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
      label: 'Decision date',
      key: 'decisionDate',
      render: (row) => (
        <span className="font-mono text-body-sm text-muted">
          {new Date(row.updatedAt || row.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      label: 'Outcome',
      key: 'status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      label: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button asChild variant="secondary" size="sm">
          <Link to={`/portal/clearance-history/${row.id}`}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View clearance file
          </Link>
        </Button>
      ),
    },
  ];

  if (loading) return <ListSkeleton />;

  return (
    <div className="space-y-6 pb-10 animate-fadeIn">
      <PageHeader
        crumbs={[
          { label: 'Police', to: '/portal' },
          { label: 'Clearance History' },
        ]}
        title="Clearance History"
        subtitle="Review issued and denied clearance decisions and supporting officer notes."
      />

      <SecurityBanner>
        Audit records of all clearance decisions. Offender identities are never disclosed to requesting organizations.
      </SecurityBanner>

      {error && <Alert variant="danger" title="Load error">{error}</Alert>}

      <DataTable
        data={data}
        columns={columns}
        searchPlaceholder="Search by organization, candidate, or role…"
        emptyTitle="No clearance history"
        emptyMessage="Completed clearance decisions will appear here."
      />
    </div>
  );
}

export default VerificationHistory;
