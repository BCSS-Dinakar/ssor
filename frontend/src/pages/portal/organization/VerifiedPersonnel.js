import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck, Users, CheckCircle2, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import StatCard from '../../../components/portal/StatCard';
import { organizationApi } from '../../../api/organization.api';

function VerifiedPersonnel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [baseList, setBaseList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    organizationApi.getVerifications()
      .then(data => setBaseList(data.verifications))
      .catch(err => console.error("Failed to fetch verifications", err));
  }, []);

  const rows = baseList.filter((c) => c.status === 'cleared');

  const filteredCandidates = rows.filter(
    (c) =>
      c.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = baseList.length;
  const cleared = baseList.filter((c) => c.status === 'cleared').length;
  const rejected = baseList.filter((c) => c.status === 'rejected').length;
  const pending = baseList.filter((c) => c.status === 'pending').length;

  return (
    <div className="space-y-6 w-full animate-fadeIn pb-10">
      <PageHeader
        crumb="Verified Roster"
        title="Verified Roster"
        subtitle="View cleared staff credential badges and verification outcomes."
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Roster" value={total} icon={Users} meta="All candidates" />
        <StatCard label="Active Clearances" value={cleared} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" valueClass="text-emerald-600" />
        <StatCard label="Rejected" value={rejected} icon={AlertTriangle} accent="bg-red-50 text-red-600" valueClass="text-red-600" />
        <StatCard label="Pending Audits" value={pending} icon={Clock} accent="bg-amber-50 text-amber-600" valueClass="text-amber-500" />
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center bg-white shadow-sm">
        <div className="relative flex-grow w-full">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all placeholder-slate-400"
            placeholder="Search candidate name, role or clearance ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((c) => {
          const isCleared = c.status === 'cleared';
          const isRejected = c.status === 'rejected';

          let borderClass = 'border-slate-150 hover:border-slate-300';
          let badgeText = 'Under Review';
          let badgeClass = 'bg-slate-100 text-slate-600 border border-slate-200';
          let glowClass = 'bg-slate-500/20';

          if (isCleared) {
            borderClass = 'border-emerald-100/80 hover:border-emerald-300 bg-gradient-to-br from-white to-emerald-50/5';
            badgeText = 'Clearance Vetted';
            badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-250';
            glowClass = 'bg-emerald-500';
          } else if (isRejected) {
            borderClass = 'border-red-100/80 hover:border-red-300 bg-gradient-to-br from-white to-red-50/5';
            badgeText = 'Rejected / Locked';
            badgeClass = 'bg-red-50 text-red-700 border border-red-250';
            glowClass = 'bg-red-500';
          }

          return (
            <div key={c.id} className={`card p-5 border flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 ${borderClass}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <span className="text-[10px] font-mono font-bold text-secondary uppercase tracking-wider">{c.id}</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center shrink-0 border border-slate-200/40 relative">
                    <span className="text-xs font-black text-slate-500 font-heading">{(c.candidateName || 'C').charAt(0)}</span>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${glowClass}`} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm truncate pr-2" title={c.candidateName}>
                        {c.candidateName}
                      </h3>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 truncate" title={c.role}>
                      {c.role}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                      {c.docType} {c.idNumber || 'ID on file'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                    <ShieldCheck className="h-16 w-16" />
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Submitted</span>
                    <span className="font-bold text-slate-700 font-mono">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Cleared</span>
                    <span className="font-bold text-emerald-600 font-mono">{c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end text-xs">
                <button
                  onClick={() => navigate(`/portal/candidates/${c.id}`)}
                  className="text-[10px] font-black text-secondary bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-1 border border-blue-200"
                >
                  View Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCandidates.length === 0 && (
        <div className="card p-12 text-center text-slate-400 max-w-md mx-auto bg-white">
          <UserCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <span className="text-xs font-bold text-slate-500">No personnel match your search filter.</span>
        </div>
      )}
    </div>
  );
}

export default VerifiedPersonnel;
