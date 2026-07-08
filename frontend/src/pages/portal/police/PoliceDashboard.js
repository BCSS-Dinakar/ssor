import { Link } from 'react-router-dom';
import { FileCheck, Eye, Clock, Plus, Scale } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import PageHeader from '../../../components/portal/PageHeader';
import StatCard from '../../../components/portal/StatCard';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { useData } from '../../../context/DataContext';
import { TIERS } from '../../../utils/data/portalData';

function PoliceDashboard() {
  const { offenders, clearances, audit, counts } = useData();

  const byTier = Object.keys(TIERS).map((key) => ({
    key,
    ...TIERS[key],
    count: offenders.filter((o) => o.tier === key).length,
  }));
  
  const total = offenders.length;
  const convictedCount = offenders.filter(o => o.legalStatus === 'Convicted').length;
  const underTrialCount = offenders.filter(o => o.legalStatus === 'Under-Trial').length;

  const sectionData = [
    { name: 'POCSO Act', value: offenders.filter(o => o.tier === 'red' || o.tier === 'orange').length, color: '#dc2626' },
    { name: 'BNS Harassment', value: offenders.filter(o => o.tier === 'pink' || o.tier === 'green').length, color: '#0ea5e9' },
    { name: 'IT Act (Cyber)', value: offenders.filter(o => o.tier === 'blue').length, color: '#8b5cf6' },
    { name: 'BNS Trafficking', value: offenders.filter(o => o.tier === 'black').length, color: '#f59e0b' }
  ].filter(d => d.value > 0);


  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Administration / Portal"
        title="Register Console"
        subtitle="Secure State Sexual Offender Register Admin Dashboard. Fictional demonstration data."
        actions={
          <Link to="/portal/new" className="btn-primary py-2.5 px-4 text-xs font-black shadow-lg shadow-primary/10">
            <Plus className="h-4.5 w-4.5" />
            New Registration
          </Link>
        }
      />

      <SecurityBanner>
        Controlled-access session. To comply with the privacy tests of legality, necessity and proportionality (Puttaswamy 2017), every record inquiry and query action is written to the immutable cryptographic audit log.
      </SecurityBanner>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Conviction Status Card (Dynamic Split) */}
        <div className="card p-5 flex flex-col justify-between col-span-2 lg:col-span-1 bg-white relative">
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

        <StatCard label="Pending Clearances" value={counts.clearPending} icon={FileCheck} accent="bg-amber-50 text-accent" meta="Awaiting decision queue" />
        <StatCard label="Disclosure Inquiries" value={counts.discPending} icon={Eye} accent="bg-pink-50 text-pink-600" meta="Awaiting manual DSP desk" />
        
        {/* CCTNS Sync Status widget */}
        <div className="card p-5 flex flex-col justify-between bg-white relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">CCTNS Relay Status</h3>
              <div className="text-sm font-black text-emerald-600 mt-1.5 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                99.8% Online
              </div>
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider border-t border-slate-50 pt-2.5 mt-3">Last Sync: 2 mins ago</div>
        </div>
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
        <div className="card p-6 bg-white border border-slate-200/80 shadow-md">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-primary font-heading uppercase text-[10px] tracking-widest text-slate-400">Clearance Vetting Queue</h3>
            <Link to="/portal/clearances" className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline">Vetting Console →</Link>
          </div>
          <div className="divide-y divide-slate-150">
            {clearances.filter((c) => c.status === 'pending').slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[280px]">{c.org}</div>
                  <div className="text-[9px] font-mono font-bold text-slate-400 mt-0.5">{c.id} · Candidate: {c.candidate} · {c.role}</div>
                </div>
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-widest animate-pulse">Review</span>
              </div>
            ))}
            {clearances.filter((c) => c.status === 'pending').length === 0 && (
              <div className="text-xs text-muted py-8 text-center font-semibold">Verification queue clear.</div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-6 bg-white border border-slate-200/80 shadow-md">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-primary font-heading uppercase text-[10px] tracking-widest text-slate-400">Immutable System Log</h3>
            <Link to="/portal/audit" className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline">Full Audit Log →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400 border-b border-slate-150">
                  <th className="py-2 px-3 rounded-l-lg">Officer</th>
                  <th className="py-2 px-3">Action logged</th>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3 text-right rounded-r-lg">Node IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit.slice(0, 5).map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{a.who}</td>
                    <td className="py-2.5 px-3 text-slate-550 font-semibold">{a.action}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{a.time}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">{a.node}</td>
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
