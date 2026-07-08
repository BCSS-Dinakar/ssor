import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Bell,
  TrendingUp,
  Shield,
  Search,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';

function OrganizationDashboard() {
  const { auth } = useAuth();
  const { clearances } = useData();

  const mine = clearances.filter((c) => c.org && c.org.includes(auth.name));
  const list = mine.length ? mine : clearances;

  const pending = list.filter((c) => c.status === 'pending' || c.status === 'verifying').length;
  const cleared = list.filter((c) => c.status === 'cleared').length;
  const rejected = list.filter((c) => c.status === 'rejected').length;
  const total = list.length;

  const trendData = [
    { month: 'Jan', requests: 4, cleared: 4 },
    { month: 'Feb', requests: 7, cleared: 6 },
    { month: 'Mar', requests: 5, cleared: 5 },
    { month: 'Apr', requests: 9, cleared: 8 },
    { month: 'May', requests: 12, cleared: 11 },
    { month: 'Jun', requests: total, cleared },
  ];


  const notifications = [
    { id: 1, type: 'success', text: 'Verification check for Rahul Varma is COMPLETED.', time: '2 hours ago' },
    { id: 2, type: 'info', text: 'New Safe Hiring and POCSO guidelines issued by DGP Office.', time: '1 day ago' },
    { id: 3, type: 'warning', text: 'Clearance request CLR-2026-00468 requires additional consent document.', time: '2 days ago' },
  ];

  const stats = [
    { label: 'Total Submissions', value: total, meta: 'All clearance audits YTD', icon: FileCheck, accent: 'bg-blue-50 text-secondary', valueClass: 'text-primary' },
    { label: 'Cleared Candidates', value: cleared, meta: 'Approved to work', icon: CheckCircle2, accent: 'bg-emerald-50 text-emerald-600', valueClass: 'text-emerald-600' },
    { label: 'Pending Reviews', value: pending, meta: 'Police check in progress', icon: Clock, accent: 'bg-amber-50 text-amber-600', valueClass: 'text-amber-500' },
    { label: 'Rejected Cases', value: rejected, meta: 'Review locks active', icon: AlertTriangle, accent: 'bg-red-50 text-red-600', valueClass: 'text-red-500' },
  ];

  const quickActions = [
    { to: '/portal/requests', icon: Search, title: 'Track Clearance', desc: 'Live status timeline updates', accent: 'bg-blue-500' },
    { to: '/portal/disclosure', icon: Shield, title: 'Report Child Threat', desc: 'DSP desk risk evaluation', accent: 'bg-purple-500' },
    { to: '/portal/resources', icon: BookOpen, title: 'Legal Compliance', desc: 'POCSO act guidelines & laws', accent: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* ───────── HEADER BANNER (PREMIUM GRADIENT) ───────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-[#0E2A4F] to-secondary p-8 text-white shadow-xl shadow-primary/10">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent rounded-full filter blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500 rounded-full filter blur-[100px]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" /> TSP Verified Institution
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-white/10 border border-white/20 text-blue-200 uppercase tracking-wider">
                Level 2 Authed
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold font-heading tracking-tight text-white leading-tight">
              {auth.name}
            </h1>
            <p className="text-blue-100/70 max-w-2xl text-xs md:text-sm leading-relaxed font-medium">
              Safe-Recruitment Clearance Terminal. Cross-check your child-facing personnel against the State Sexual Offender Register securely under the DPDP Act 2023 guidelines.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link to="/portal/apply" className="btn-accent hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-accent/20 text-xs px-5 py-3 font-extrabold">
              <FileCheck className="h-4.5 w-4.5" /> Verify New Candidate
            </Link>
          </div>
        </div>
      </div>

      {/* ───────── STATS ROW ───────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{s.label}</span>
                <div className={`text-3xl font-black font-heading ${s.valueClass}`}>{s.value}</div>
              </div>
              <div className={`p-2.5 rounded-xl border shrink-0 ${s.accent.includes('emerald') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : s.accent.includes('amber') ? 'bg-amber-50 text-amber-600 border-amber-100' : s.accent.includes('red') ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-secondary border-blue-100'}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider border-t border-slate-50 pt-2.5 mt-3">{s.meta}</div>
          </div>
        ))}
      </div>

      {/* ───────── MAIN DASHBOARD CONTENT ───────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* ───────── LEFT COLUMN (DATA & TABLES) ───────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts & Trends */}
          <div className="card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
              <div>
                <h3 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Verification Trends</h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">Submitted vs Cleared candidates (6M Trend).</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                <TrendingUp className="h-3 w-3" /> +15% this month
              </span>
            </div>

            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorClear" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94a3b8', fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }} />
                  <Area type="monotone" dataKey="requests" stroke="#1e3a8a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReq)" name="Submitted" />
                  <Area type="monotone" dataKey="cleared" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClear)" name="Cleared" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Submissions Table */}
          <div className="card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Recent Clearance Submissions</h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">Live status feed of checks in queue.</p>
              </div>
              <Link to="/portal/requests" className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline">
                View all requests <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-[9px] uppercase font-bold text-slate-400 border-b border-slate-100">
                    <th className="py-2.5 px-4 rounded-l-lg">Reference ID</th>
                    <th className="py-2.5 px-4">Candidate</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Submitted</th>
                    <th className="py-2.5 px-4 text-right rounded-r-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {list.slice(0, 5).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-secondary group-hover:text-primary transition-colors">{c.id}</td>
                      <td className="py-3 px-4 font-bold text-primary">{c.candidate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{c.role}</td>
                      <td className="py-3 px-4 text-slate-400 font-medium">{c.submitted}</td>
                      <td className="py-3 px-4 text-right">
                        {c.status === 'cleared' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">CLEARED</span>
                        ) : c.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">REJECTED</span>
                        ) : c.status === 'verifying' ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 animate-pulse">VERIFYING</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">PENDING</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No clearance requests generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ───────── RIGHT COLUMN (WIDGETS & ACTIONS) ───────── */}
        <div className="space-y-6">
          
          {/* Sleek Compliance Status Widget */}
          <div className="card p-5 relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-100/60 group hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck className="h-24 w-24 text-emerald-600" />
            </div>
            
            <div className="flex items-center gap-3 border-b border-emerald-100/50 pb-3 mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-900 font-heading text-sm uppercase tracking-wider leading-tight">Active Certificate</h4>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5 uppercase tracking-wide">Safeguarding Compliant</p>
              </div>
            </div>
            
            <div className="space-y-2.5 relative z-10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-700/70 font-bold uppercase tracking-wider text-[9px]">License ID</span>
                <span className="font-mono font-black text-emerald-900">REG-2026-88341</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-700/70 font-bold uppercase tracking-wider text-[9px]">Valid Until</span>
                <span className="font-bold text-emerald-800">05 Jan 2027</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6 space-y-4">
            <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Quick Services</h4>
            <div className="grid grid-cols-1 gap-2.5">
              {quickActions.map((a) => (
                <Link key={a.to} to={a.to} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-2xl transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${a.accent.includes('blue') ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : a.accent.includes('purple') ? 'bg-gradient-to-br from-purple-500 to-violet-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'} text-white flex items-center justify-center shadow-md shadow-slate-200/50`}>
                      <a.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block group-hover:text-primary transition-colors">{a.title}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">{a.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Advisory Feed */}
          <div className="card p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Security Bulletins</h4>
              <Bell className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-4">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 text-xs">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${n.type === 'success' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : n.type === 'info' ? 'bg-blue-500 shadow-sm shadow-blue-500/50' : 'bg-amber-500 shadow-sm shadow-amber-500/50'}`} />
                  <div className="space-y-1 flex-1">
                    <span className="font-semibold text-slate-700 leading-relaxed block text-[11px]">{n.text}</span>
                    <span className="text-[9px] text-slate-400 font-mono block leading-none">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizationDashboard;
