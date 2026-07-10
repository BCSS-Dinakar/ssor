import { Link } from 'react-router-dom';
import { FileCheck, Scale } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import PageHeader from '../../../components/portal/PageHeader';
import StatCard from '../../../components/portal/StatCard';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import React, { useState, useEffect } from 'react';
import { policeApi } from '../../../api/police.api';
import { TIERS } from '../../../utils/data/portalData';

function PoliceDashboard() {
  const [stats, setStats] = useState(null);
  const [clearances, setClearances] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, clrRes, auditRes] = await Promise.all([
          policeApi.getDashboardStats(),
          policeApi.getVerifications(),
          policeApi.getLogs()
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (clrRes.success) setClearances(clrRes.data);
        if (auditRes.success) setAudit(auditRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="animate-spin h-8 w-8 border-4 border-secondary border-t-transparent rounded-full mb-4"></div>
        <p className="font-bold">Loading dashboard...</p>
      </div>
    );
  }

  const byTier = Object.keys(TIERS).map((key) => {
    const match = stats?.byTier?.find(t => t.tier === key);
    return {
      key,
      ...TIERS[key],
      count: match ? match.count : 0,
    };
  });

  const total = stats?.totalOffenders || 0;
  const convictedCount = stats?.convictedCount || 0;
  const underTrialCount = stats?.underTrialCount || 0;

  const colorPalette = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'];
  const sectionData = (stats?.sectionData || []).map((s, i) => ({
    name: s.name,
    value: s.value,
    color: colorPalette[i % colorPalette.length]
  }));


  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Administration / Portal"
        title="Register Console"
        subtitle="Secure State Sexual Offender Register Admin Dashboard."
      />

      <SecurityBanner>
        Controlled-access session. To comply with the privacy tests of legality, necessity and proportionality (Puttaswamy 2017), every record inquiry and query action is written to the immutable cryptographic audit log.
      </SecurityBanner>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Conviction Status Card (Dynamic Split) */}
        <div className="card p-5 flex flex-col justify-between bg-white relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Offenders</h3>
              <div className="text-2xl font-black font-mono text-slate-800 mt-1 leading-none">{total}</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider mb-1.5">
              <span className="text-indigo-700">Convictions: {convictedCount}</span>
              <span className="text-amber-600">Trials: {underTrialCount}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden border border-slate-100/50 bg-slate-100">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full" style={{ width: `${total ? (convictedCount / total) * 100 : 0}%` }} />
              <div className="bg-gradient-to-r from-amber-400 to-amber-300 rounded-full" style={{ width: `${total ? (underTrialCount / total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        <StatCard label="Pending Clearances" value={stats?.clearPending || 0} icon={FileCheck} accent="bg-amber-50 text-accent" meta="Awaiting decision queue" />
      </div>

      {/* Analytics Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Tier breakdown */}
        <div className="card p-6 bg-white">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Register by Risk Tier</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Risk levels mapping to statutory penal categories.</p>
          </div>
          <div className="space-y-4">
            {byTier.map((t) => {
              const pct = total ? Math.round((t.count / total) * 100) : 0;
              return (
                <div key={t.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${t.color}`} />
                      {t.name} Tier <span className="text-[10px] text-slate-400 font-medium">({t.category})</span>
                    </span>
                    <span className="font-mono font-bold text-primary">{t.count}</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-150">
                    <div className={`h-full rounded-full ${t.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section-wise Distribution */}
        <div className="card p-6 bg-white">
          <div className="border-b border-slate-100 pb-3 mb-2">
            <h3 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Offence Law Distribution</h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Category segmentation as per statutory acts.</p>
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Pending clearances */}
        <div className="card bg-white border border-slate-200/80 shadow-md flex flex-col h-[360px]">
          <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 shrink-0">
            <h3 className="font-extrabold text-primary font-heading uppercase text-[10px] tracking-widest text-slate-400">Clearance Vetting Queue</h3>
            <Link to="/portal/clearances" className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline">Vetting Console →</Link>
          </div>
          <div className="flex-1 overflow-y-auto p-6 pt-0">
            <div className="divide-y divide-slate-150">
              {clearances.filter((c) => c.status === 'pending' || c.status === 'verifying').map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-xs font-bold text-slate-800 truncate max-w-[280px]">{c.orgName || c.org}</div>
                    <div className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">{c.id.split('-')[0]} · Candidate: {c.candidateName || c.candidate} · {c.role}</div>
                  </div>
                  <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-widest animate-pulse">Review</span>
                </div>
              ))}
              {clearances.filter((c) => c.status === 'pending' || c.status === 'verifying').length === 0 && (
                <div className="text-xs text-muted py-8 text-center font-semibold">Verification queue clear.</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card bg-white border border-slate-200/80 shadow-md flex flex-col h-[360px]">
          <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 shrink-0">
            <h3 className="font-extrabold text-primary font-heading uppercase text-[10px] tracking-widest text-slate-400">Immutable System Log</h3>
            <Link to="/portal/audit" className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline">Full Audit Log →</Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                <tr className="text-[9px] uppercase font-bold text-slate-400 border-b border-slate-150">
                  <th className="py-2.5 px-6 rounded-tl-lg">Officer</th>
                  <th className="py-2.5 px-3">Action logged</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-6 text-right rounded-tr-lg">Node IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit.slice(0, 8).map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-800">{a.who}</td>
                    <td className="py-3 px-3 text-slate-550 font-semibold">{a.action}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-400">{a.time}</td>
                    <td className="py-3 px-6 text-right font-mono text-slate-400">{a.node}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PoliceDashboard;
