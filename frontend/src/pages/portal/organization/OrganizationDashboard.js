import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  BookOpen,
  ChevronRight,
  Inbox,
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
import { PageSkeleton } from '../../../components/ui/Skeleton';
import { StatusBadge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';

function OrganizationDashboard() {
  const { auth } = useAuth();
  const [data, setData] = useState({
    stats: { total: 0, pending: 0, cleared: 0, rejected: 0 },
    trendData: [],
    recentVerifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await organizationApi.getDashboard();
        if (res.success) {
          setData(res);
        } else {
          setError('Unable to load dashboard data.');
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
        setError('Unable to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const quickActions = [
    { to: '/portal/requests', icon: Search, title: 'Track Clearance', desc: 'Live status of submitted requests' },
    { to: '/portal/resources', icon: BookOpen, title: 'Legal Resources', desc: 'POCSO guidelines and hiring manuals' },
    { to: '/portal/compliance', icon: AlertTriangle, title: 'Compliance & Support', desc: 'Contact the police support desk' },
  ];

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      <PageHeader
        crumbs={[
          { label: 'Organization', to: '/portal' },
          { label: 'Dashboard' },
        ]}
        title={auth?.name || 'Organization Dashboard'}
        subtitle="Submit and track clearance requests for child-facing personnel against the State Sexual Offender Registry."
        actions={
          <Button asChild variant="accent">
            <Link to="/portal/apply">
              <FileCheck className="h-4.5 w-4.5" aria-hidden="true" />
              Submit Clearance Request
            </Link>
          </Button>
        }
      />

      <SecurityBanner>
        Ensuring compliance with DPDP Act 2023 guidelines for data protection. All clearance outcomes are logged.
      </SecurityBanner>

      {error && <Alert variant="danger" title="Dashboard error">{error}</Alert>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Submissions" value={data.stats.total} icon={FileCheck} meta="All clearance requests" to="/portal/requests" />
        <StatCard label="Cleared" value={data.stats.cleared} icon={CheckCircle2} accent="bg-success-50 text-success" valueClass="text-success" meta="Clearance issued" to="/portal/candidates" />
        <StatCard label="Pending" value={data.stats.pending} icon={Clock} accent="bg-warning-50 text-warning" valueClass="text-warning" meta="Awaiting police decision" to="/portal/requests" />
        <StatCard label="Rejected" value={data.stats.rejected} icon={AlertTriangle} accent="bg-danger-50 text-danger" valueClass="text-danger" meta="Clearance denied" to="/portal/requests" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Clearance Trends</CardTitle>
              <CardDescription>Submitted vs cleared requests (recent months).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[230px] w-full">
                {data.trendData?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorClear" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#15803d" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                      <Area type="monotone" dataKey="requests" stroke="#1e3a8a" strokeWidth={2} fillOpacity={1} fill="url(#colorReq)" name="Submitted" />
                      <Area type="monotone" dataKey="cleared" stroke="#15803d" strokeWidth={2} fillOpacity={1} fill="url(#colorClear)" name="Cleared" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-muted">
                    <Inbox className="mb-2 h-8 w-8" aria-hidden="true" />
                    <p className="text-base font-medium">No trend data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex h-[360px] flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle>Recent Clearance Requests</CardTitle>
                <CardDescription>Latest submissions from your organization.</CardDescription>
              </div>
              <Link to="/portal/requests" className="inline-flex items-center gap-1 text-body-sm font-semibold text-secondary hover:underline">
                View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </CardHeader>
            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[500px] text-left text-base">
                <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                  <tr className="text-body-sm font-bold text-muted">
                    <th scope="col" className="px-6 py-3">Reference</th>
                    <th scope="col" className="px-4 py-3">Candidate</th>
                    <th scope="col" className="px-4 py-3">Role</th>
                    <th scope="col" className="px-4 py-3">Submitted</th>
                    <th scope="col" className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentVerifications.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-3 font-mono text-body-sm font-bold text-secondary">{String(c.id).split('-')[0]}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-primary">{c.candidateName}</div>
                        {c.fatherName && <div className="mt-0.5 text-body-sm text-muted">Father: {c.fatherName}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.role}</td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  ))}
                  {data.recentVerifications.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted">
                        No clearance requests yet. Submit your first request to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Details from your registered account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-base">
              <div className="flex justify-between gap-4">
                <span className="text-muted">Organization</span>
                <span className="font-semibold text-primary text-right">{auth?.name || '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Login ID</span>
                <span className="font-mono font-semibold text-primary text-right">{auth?.loginId || '—'}</span>
              </div>
              <Button asChild variant="secondary" className="mt-2 w-full">
                <Link to="/portal/profile">Open profile</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3.5 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-white" aria-hidden="true">
                      <a.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block font-semibold text-slate-800">{a.title}</span>
                      <p className="mt-0.5 text-body-sm text-muted">{a.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default OrganizationDashboard;
