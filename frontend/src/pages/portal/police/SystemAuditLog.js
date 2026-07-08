import React from 'react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { useData } from '../../../context/DataContext';
import DataTable from '../../../components/common/DataTable';

function SystemAuditLog() {
  const { audit } = useData();

  const columns = [
    {
      label: 'Timestamp',
      key: 'time',
      className: 'font-mono text-xs text-slate-500 font-bold',
    },
    {
      label: 'Authorized Officer',
      key: 'who',
      className: 'text-slate-800 text-sm font-extrabold',
    },
    {
      label: 'Action Conducted',
      key: 'action',
      className: 'text-slate-600 font-medium leading-relaxed',
    },
    {
      label: 'Access IP Node',
      key: 'node',
      className: 'font-mono text-slate-455 font-bold',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Administration / Oversight"
        title="Access audit log"
        subtitle="Every access to the register is recorded. This log is itself immutable."
      />

      <SecurityBanner>
        Access is confined to cleared personnel. Misuse carries disciplinary and penal consequences.
      </SecurityBanner>

      <div className="card p-6 bg-white shadow-md border border-slate-200/80 rounded-2xl">
        <DataTable data={audit} columns={columns} />
      </div>
    </div>
  );
}

export default SystemAuditLog;
