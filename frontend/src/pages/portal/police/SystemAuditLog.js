import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import DataTable from '../../../components/common/DataTable';
import { policeApi } from '../../../api/police.api';
import { ShieldAlert } from 'lucide-react';

function SystemAuditLog() {
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await policeApi.getLogs();
        if (data.success) {
          // Add a derived category for filtering purposes
          const processedLogs = data.data.map(log => {
            const actionLower = log.action.toLowerCase();
            let category = 'System';
            if (actionLower.includes('login') || actionLower.includes('logout')) category = 'Authentication';
            else if (actionLower.includes('view') || actionLower.includes('record')) category = 'Record Access';
            else if (actionLower.includes('ticket') || actionLower.includes('message')) category = 'Support';
            else if (actionLower.includes('status') || actionLower.includes('vetting')) category = 'Vetting';

            return { ...log, category };
          });
          setAudit(processedLogs);
        }
      } catch (err) {
        console.error('Failed to fetch logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const columns = [
    {
      label: 'Timestamp',
      key: 'rawTime',
      render: (row) => (
        <div>
          <div className="font-mono text-sm text-slate-700 font-bold">{new Date(row.rawTime || row.time).toLocaleDateString()}</div>
          <div className="text-sm text-slate-400 font-medium">{new Date(row.rawTime || row.time).toLocaleTimeString()}</div>
        </div>
      )
    },
    {
      label: 'Authorized Officer',
      key: 'who',
      render: (row) => (
        <div>
          <div className="text-base font-extrabold text-slate-800">{row.who}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm uppercase font-bold tracking-wider text-secondary">{row.role}</span>
            {row.badgeId !== 'N/A' && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-sm font-medium text-slate-500">Badge: {row.badgeId}</span>
              </>
            )}
            {row.rank !== 'N/A' && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-sm font-medium text-slate-500">{row.rank}</span>
              </>
            )}
          </div>
        </div>
      )
    },
    {
      label: 'Action Conducted',
      key: 'action',
      render: (row) => (
        <div>
          <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold tracking-wide mb-1 ${
            row.category === 'Authentication' ? 'bg-blue-100 text-blue-700' :
            row.category === 'Record Access' ? 'bg-emerald-100 text-emerald-700' :
            row.category === 'Vetting' ? 'bg-purple-100 text-purple-700' :
            row.category === 'Support' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            {row.category}
          </span>
          <div className="text-slate-700 text-sm font-semibold">{row.action}</div>
        </div>
      )
    },
    {
      label: 'Access Node (IP)',
      key: 'node',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
          {row.node}
        </span>
      )
    }
  ];

  const filters = useMemo(() => [
    {
      key: 'category',
      label: 'Action Type',
      options: [
        { label: 'Authentication', value: 'Authentication' },
        { label: 'Record Access', value: 'Record Access' },
        { label: 'Support Tickets', value: 'Support' },
        { label: 'Vetting', value: 'Vetting' },
        { label: 'System', value: 'System' }
      ]
    },
    {
      key: 'role',
      label: 'User Role',
      options: [
        { label: 'Police', value: 'police' },
        { label: 'Organization', value: 'organization' }
      ]
    }
  ], []);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Administration / Oversight"
        title="System audit log"
        subtitle="Immutable ledger of all system access and administrative actions."
      />

      <SecurityBanner>
        Access is confined to cleared personnel. Misuse or unauthorized extraction carries disciplinary and penal consequences.
      </SecurityBanner>

      {loading ? (
        <div className="card p-12 text-center text-slate-500 font-bold bg-white">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-secondary animate-spin mx-auto mb-4"></div>
          Retrieving cryptographically verified logs...
        </div>
      ) : (
        <DataTable
          data={audit}
          columns={columns}
          filters={filters}
          searchPlaceholder="Search officer name, IP, or action..."
          emptyIcon={ShieldAlert}
          emptyTitle="No audit records found"
          emptyMessage="No ledger entries match your current filters or search query."
        />
      )}
    </div>
  );
}

export default SystemAuditLog;
