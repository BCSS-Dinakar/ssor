import React, { useState, useEffect } from 'react';
import { Building2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/portal/PageHeader';
import DataTable from '../../../components/common/DataTable';
import api from '../../../api/api';

function OrganizationApprovals() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get('/police/organizations');
        if (res.data.success) {
          const mapped = res.data.data.map(org => ({
            id: org.id,
            name: org.organizationProfile?.orgName || org.loginId,
            type: org.organizationProfile?.orgType || 'Unknown',
            district: org.organizationProfile?.district || 'Unknown',
            appliedOn: new Date(org.createdAt).toISOString().split('T')[0],
            status: org.status
          }));
          setVerifications(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch orgs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const columns = [
    {
      key: 'name',
      label: 'Organization',
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 text-sm leading-tight">{row.name}</div>
          <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{row.id}</div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => <span className="text-xs text-slate-700 font-bold">{row.type}</span>
    },
    {
      key: 'district',
      label: 'District',
      render: (row) => <span className="text-xs text-slate-500 font-bold">{row.district}</span>
    },
    {
      key: 'appliedOn',
      label: 'Applied On',
      render: (row) => <span className="text-xs text-slate-455 font-mono font-bold">{row.appliedOn}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const styles = {
          pending: 'bg-amber-50 text-amber-700 border-amber-250',
          approved: 'bg-emerald-50 text-emerald-700 border-emerald-250',
          rejected: 'bg-red-50 text-red-700 border-red-250'
        }[row.status] || 'bg-slate-50 text-slate-700 border-slate-200';
        return <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${styles}`}>{row.status}</span>;
      }
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <Link
          to={`/portal/org-verify/${row.id}`}
          className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-200 transition-colors text-[10px] font-black text-secondary uppercase tracking-widest"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Review File
        </Link>
      )
    }
  ];

  const filters = [
    {
      key: 'type',
      label: 'Type',
      options: [
        { label: 'School', value: 'School' },
        { label: 'Pre-school', value: 'Pre-school' },
        { label: 'College', value: 'College' },
        { label: 'Healthcare', value: 'Healthcare' }
      ]
    },
    {
      key: 'district',
      label: 'District',
      options: [
        { label: 'Hyderabad', value: 'Hyderabad' },
        { label: 'Cyberabad', value: 'Cyberabad' },
        { label: 'Rangareddy', value: 'Rangareddy' },
        { label: 'Medchal', value: 'Medchal' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        crumb="Administration / Requests"
        title="Organization Verifications"
        subtitle="Review and approve organization registrations to grant them portal access."
      />

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-medium text-sm">Loading organizations...</div>
      ) : (
        <DataTable
          data={verifications}
          columns={columns}
          filters={filters}
          searchPlaceholder="Search by name, ID, or district..."
          emptyIcon={Building2}
          emptyTitle="No pending verifications"
          emptyMessage="All organization registrations have been processed."
          minHeight="min-h-[500px]"
        />
      )}
    </div>
  );
}

export default OrganizationApprovals;
