import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldX, Loader2, CheckCircle2, Building2, Briefcase, Calendar, Hash } from 'lucide-react';
import { verifyApi } from '../api/verify.api';

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">{label}</div>
        <div className="text-sm font-semibold text-slate-800 break-words">{value}</div>
      </div>
    </div>
  );
}

function VerifyCertificate() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await verifyApi.verifyCertificate(token);
        if (active) setResult(res);
      } catch (err) {
        console.error('Verification error:', err);
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, [token]);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isValid = result?.valid === true;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Official header */}
        <div className="text-center mb-6">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Government of Telangana</div>
          <div className="text-sm font-bold text-slate-700">State Sexual Offender Registry (SSOR) Portal</div>
          <div className="text-[11px] font-semibold text-slate-400 mt-0.5">Certificate Authenticity Verification</div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {loading && (
            <div className="p-12 text-center">
              <Loader2 className="h-10 w-10 text-slate-400 animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-slate-500">Verifying certificate…</p>
            </div>
          )}

          {!loading && (error || !result) && (
            <div className="p-10 text-center">
              <ShieldX className="h-14 w-14 text-slate-300 mx-auto mb-4" />
              <h1 className="text-lg font-black text-slate-700">Unable to Verify</h1>
              <p className="text-sm text-slate-500 mt-2">We couldn't reach the verification service. Please try again later.</p>
            </div>
          )}

          {!loading && result && isValid && (
            <div>
              <div className="bg-emerald-600 px-6 py-8 text-center text-white">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 border-2 border-white/30 mb-4">
                  <ShieldCheck className="h-9 w-9" />
                </div>
                <h1 className="text-xl font-black tracking-tight">Genuine Certificate</h1>
                <p className="text-sm text-emerald-50 mt-1 font-medium">
                  This is an official SSOR clearance certificate.
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center gap-2 mb-4 text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl py-2.5 text-sm font-bold">
                  <CheckCircle2 className="h-4 w-4" /> STATUS: {result.certificate.status}
                </div>
                <InfoRow icon={CheckCircle2} label="Candidate Name" value={result.certificate.candidateName} />
                <InfoRow icon={Building2} label="Organization" value={result.certificate.organization} />
                <InfoRow icon={Briefcase} label="Cleared For (Role)" value={result.certificate.role} />
                <InfoRow icon={Calendar} label="Issued Date" value={formatDate(result.certificate.issuedDate)} />
                <InfoRow icon={Hash} label="Reference No." value={result.certificate.referenceNo} />
              </div>
            </div>
          )}

          {!loading && result && !isValid && (
            <div>
              <div className="bg-rose-600 px-6 py-8 text-center text-white">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 border-2 border-white/30 mb-4">
                  <ShieldX className="h-9 w-9" />
                </div>
                <h1 className="text-xl font-black tracking-tight">Not an Official Certificate</h1>
                <p className="text-sm text-rose-50 mt-1 font-medium">This certificate could not be verified.</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {result.reason || 'This code does not match any valid SSOR clearance record.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-400 font-medium">
            Data protected under DPDP Act 2023. All verifications are logged.
          </p>
          <Link to="/" className="inline-block mt-2 text-xs font-bold text-slate-500 hover:text-slate-700">
            ← Go to SSOR Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyCertificate;
