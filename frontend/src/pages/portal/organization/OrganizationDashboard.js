import React, { useState, useEffect } from 'react';
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
import { organizationApi } from '../../../api/organization.api';
import PageHeader from '../../../components/portal/PageHeader';
import StatCard from '../../../components/portal/StatCard';
import SecurityBanner from '../../../components/portal/SecurityBanner';

function OrganizationDashboard() {
  const { auth } = useAuth();
  
  const [data, setData] = useState({
    stats: { total: 0, pending: 0, cleared: 0, rejected: 0 },
    trendData: [],
    recentVerifications: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await organizationApi.getDashboard();
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const notifications = [
    { id: 1, type: 'success', text: 'Verification check for Rahul Varma is COMPLETED.', time: '2 hours ago' },
    { id: 2, type: 'info', text: 'New Safe Hiring and POCSO guidelines issued by DGP Office.', time: '1 day ago' },
    { id: 3, type: 'warning', text: 'Clearance request CLR-2026-00468 requires additional consent document.', time: '2 days ago' },
  ];

  const quickActions = [
    { to: '/portal/requests', icon: Search, title: 'Track Clearance', desc: 'Live status timeline updates', accent: 'bg-blue-500' },
    { to: '/portal/disclosure', icon: Shield, title: 'Report Child Threat', desc: 'DSP desk risk evaluation', accent: 'bg-purple-500' },
    { to: '/portal/resources', icon: BookOpen, title: 'Legal Compliance', desc: 'POCSO act guidelines & laws', accent: 'bg-emerald-500' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <div className="animate-spin h-8 w-8 border-4 border-secondary border-t-transparent rounded-full mb-4"></div>
        <p className="font-bold">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Administration / Portal"
        title={auth.name}
        subtitle="Safe-Recruitment Clearance Terminal. Cross-check your child-facing personnel against the State Sexual Offender Register."
      />

      <SecurityBanner>
        TSP Verified Institution Level 2 Authed. Ensuring compliance with the DPDP Act 2023 guidelines for data protection.
      </SecurityBanner>

      <div className="flex justify-end mb-4">
        <Link to="/portal/apply" className="btn-accent px-5 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
          <FileCheck className="h-4 w-4" /> Verify New Candidate
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Submissions" value={data.stats.total} icon={FileCheck} meta="All clearance audits YTD" />
        <StatCard label="Cleared Candidates" value={data.stats.cleared} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" valueClass="text-emerald-600" meta="Approved to work" />
        <StatCard label="Pending Reviews" value={data.stats.pending} icon={Clock} accent="bg-amber-50 text-amber-600" valueClass="text-amber-500" meta="Police check in progress" />
        <StatCard label="Rejected Cases" value={data.stats.rejected} icon={AlertTriangle} accent="bg-red-50 text-red-600" valueClass="text-red-500" meta="Review locks active" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column (Data & Tables) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Charts & Trends */}
          <div className="card p-6 bg-white border border-slate-200/80 shadow-md">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
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
                <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          <div className="card bg-white border border-slate-200/80 shadow-md flex flex-col h-[360px]">
            <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Recent Clearance Submissions</h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">Live status feed of checks in queue.</p>
              </div>
              <Link to="/portal/requests" className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline">
                View all requests <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs text-left min-w-[500px]">
                <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                  <tr className="text-[9px] uppercase font-bold text-slate-400 border-b border-slate-150">
                    <th className="py-2.5 px-6 rounded-tl-lg">Reference ID</th>
                    <th className="py-2.5 px-4">Candidate</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">Submitted</th>
                    <th className="py-2.5 px-6 text-right rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.recentVerifications.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-3 px-6 font-mono font-bold text-secondary">{c.id.split('-')[0]}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-primary">{c.candidateName}</div>
                        {c.fatherName && <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Father: {c.fatherName}</div>}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-500">{c.role}</td>
                      <td className="py-3 px-4 text-slate-400 font-medium">{new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="py-3 px-6 text-right">
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
                  {data.recentVerifications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No clearance requests generated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Widgets & Actions) */}
        <div className="space-y-6">
          
          {/* Compliance Status Widget */}
          <div className="card p-6 bg-white border border-slate-200/80 shadow-md">
            <div className="flex items-center gap-3 border-b border-emerald-100 pb-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider leading-tight">Active Certificate</h4>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5 uppercase tracking-wide">Safeguarding Compliant</p>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">License ID</span>
                <span className="font-mono font-black text-primary">REG-2026-88341</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px]">Valid Until</span>
                <span className="font-bold text-primary">05 Jan 2027</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-6 bg-white border border-slate-200/80 shadow-md space-y-4">
            <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider border-b border-slate-100 pb-2">Quick Services</h4>
            <div className="grid grid-cols-1 gap-2.5">
              {quickActions.map((a) => (
                <Link key={a.to} to={a.to} className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-2xl transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${a.accent} text-white flex items-center justify-center shadow-sm`}>
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
          <div className="card p-6 bg-white border border-slate-200/80 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Security Bulletins</h4>
              <Bell className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-4">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 text-xs">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'info' ? 'bg-blue-500' : 'bg-amber-500'}`} />
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

