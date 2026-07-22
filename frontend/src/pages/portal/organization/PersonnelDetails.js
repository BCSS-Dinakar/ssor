import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldAlert, ShieldCheck, User, ArrowLeft,
  Calendar, Mail, Phone, Clock, FileText,
  CheckCircle, AlertOctagon, Info
} from 'lucide-react';
import { DetailSkeleton } from '../../../components/ui/index';
import { StatusPill } from '../../../components/portal/Badges';
import { organizationApi } from '../../../api/organization.api';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';

function DetailField({ label, value, mono = false, icon: Icon }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
        {label}
      </span>
      <div className={`font-semibold text-slate-800 ${mono ? 'font-mono text-[15px]' : 'text-base'}`}>
        {value || '—'}
      </div>
    </div>
  );
}

function PersonnelDetails() {
  const { id } = useParams();
  const toast = useToast();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (id) {
          const res = await organizationApi.getVerification(id);
          if (res.success) {
            setSelectedCandidate(res.verification || res.data);
          }
        }
      } catch (err) {
        console.error('Error fetching personnel details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (!selectedCandidate) {
    return (
      <div className="space-y-6">
        <Link to="/portal/candidates" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back to Verified Roster
        </Link>
        <div className="card p-16 text-center text-slate-400 border-dashed border-2">
          <ShieldAlert className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600">Profile Not Found</h3>
          <p className="text-sm mt-2">The candidate record you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const isCleared = selectedCandidate.status === 'cleared';
  const isRejected = selectedCandidate.status === 'rejected';
  const isPending = selectedCandidate.status === 'pending';

  return (
    <div className="space-y-8 w-full animate-fadeIn pb-12">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
        {/* Background Gradient Pattern */}
        <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${isCleared ? 'from-emerald-400 to-teal-600' : isRejected ? 'from-rose-400 to-red-600' : 'from-amber-400 to-orange-600'}`} />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${isCleared ? 'bg-emerald-100 text-emerald-600' : isRejected ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
              <User className="h-8 w-8" />
            </div>
            <div>
              <Link to="/portal/candidates" className="text-xs font-bold text-slate-400 hover:text-primary mb-1 flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to roster
              </Link>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{selectedCandidate.candidate}</h1>
              <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Application for <strong>{selectedCandidate.role}</strong>
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/50 shadow-sm">
            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Official Status</span>
            <StatusPill status={selectedCandidate.status} />
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-8 items-start">
        {/* Left Column: Personal Info Card */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:border-slate-300 transition-all duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Info className="h-5 w-5 text-secondary" /> Personal Identity
              </h4>
            </div>
            <div className="p-6 space-y-6">
              <DetailField label="Government ID" value={selectedCandidate.idNumber} mono />
              <DetailField label="Date of Birth" value={selectedCandidate.dob} mono icon={Calendar} />
              <DetailField label="Email Address" value={selectedCandidate.email} icon={Mail} />
              <DetailField label="Phone Number" value={selectedCandidate.phone} icon={Phone} />

              <div className="pt-6 border-t border-slate-100">
                <DetailField label="Organization" value={selectedCandidate.org} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Vetting Outcome & Details */}
        <div className="xl:col-span-2 space-y-8">

          {/* Outcome Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Vetting Outcome
              </h4>
              <span className="text-xs font-mono text-slate-400">ID: {selectedCandidate.id}</span>
            </div>
            <div className="p-6 sm:p-8">

              {isCleared && (
                <div className="space-y-8">
                  <div className="flex items-start gap-4 p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                    <CheckCircle className="h-6 w-6 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-bold text-emerald-800 text-base">Clearance Issued Successfully</h5>
                      <p className="text-sm text-emerald-700/80 mt-1 font-medium leading-relaxed">
                        Comprehensive registry background checks found no matching records. The applicant is cleared for the targeted role.
                      </p>
                    </div>
                  </div>

                  <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-8 shadow-inner border border-slate-800 text-center">
                    <div className="absolute top-0 right-0 p-32 opacity-5 pointer-events-none">
                      <ShieldCheck className="h-full w-full text-white" />
                    </div>

                    <div className="relative z-10 space-y-6">
                      <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 tracking-widest uppercase">
                        Official SSOR Certificate
                      </div>

                      <div>
                        <div className="text-slate-400 text-sm font-medium mb-1">Clearance reference ID</div>
                        <div className="text-3xl font-black font-mono text-white tracking-tight">
                          {selectedCandidate.id.split('-')[0].toUpperCase()}
                        </div>
                      </div>

                      <div className="max-w-md mx-auto text-sm text-slate-400 font-medium leading-relaxed">
                        This document cryptographically certifies that <strong className="text-slate-200">{selectedCandidate.candidate}</strong> has been cleared under the State Sexual Offender Registry.
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-slate-500">
                        <span>ISSUER: TS POLICE DEPT</span>
                        <span className="text-emerald-400">DATE: {selectedCandidate.decisionDate || selectedCandidate.submitted}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full justify-center py-3 rounded-xl shadow-sm border border-slate-200 bg-white hover:bg-slate-50"
                    disabled
                    onClick={() => toast.info('Certificate download unavailable', 'PDF certificate download is not enabled yet.')}
                  >
                    <FileText className="h-4 w-4 mr-2" /> Download PDF Certificate
                  </Button>
                </div>
              )}

              {isRejected && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-100 rounded-2xl">
                    <AlertOctagon className="h-6 w-6 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-bold text-rose-800 text-base">Referral Rejected</h5>
                      <p className="text-sm text-rose-700/80 mt-1 font-medium leading-relaxed">
                        A potential registry match was flagged and confirmed by a reviewing officer. Safe recruitment clearance is denied.
                      </p>
                    </div>
                  </div>

                  {selectedCandidate.matchedSuspect && (
                    <div className="rounded-2xl border border-rose-200 overflow-hidden shadow-sm">
                      <div className="bg-rose-50/50 px-5 py-3 border-b border-rose-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-rose-800 uppercase tracking-wide">Registry Match</span>
                        <span className="text-xs font-mono font-bold text-rose-500">ID: {selectedCandidate.matchedSuspect.id}</span>
                      </div>
                      <div className="p-5 grid sm:grid-cols-2 gap-y-6 gap-x-4 bg-white">
                        <DetailField label="Registered Name" value={selectedCandidate.matchedSuspect.name} />
                        <DetailField label="Conviction Date" value={selectedCandidate.matchedSuspect.convDate} mono />
                        <div className="sm:col-span-2">
                          <DetailField label="Convicted Offence" value={<span className="text-rose-600">{selectedCandidate.matchedSuspect.offence}</span>} />
                        </div>
                        <div className="sm:col-span-2">
                          <DetailField label="Physical Markings" value={selectedCandidate.matchedSuspect.identifications || 'None recorded'} />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCandidate.reason && (
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-inner">
                      <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Officer Decision Notes</h6>
                      <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {selectedCandidate.reason.split('\n\nOfficer Notes: ')[1] || selectedCandidate.reason.split('\n\nOfficer Notes: ')[0]}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      to="/portal/compliance"
                      state={{ autoCreateTicket: true, reference: selectedCandidate.id, candidate: selectedCandidate.candidate }}
                      className="flex items-center justify-center w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors shadow-md"
                    >
                      File an Appeal with Support Desk
                    </Link>
                  </div>
                </div>
              )}

              {isPending && (
                <div className="py-12 text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 mb-2">
                    <Clock className="h-8 w-8 text-amber-500 animate-spin-slow" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Verification in Progress</h3>
                  <p className="text-slate-500 max-w-md mx-auto text-sm font-medium leading-relaxed">
                    This file is currently under review by the Telangana State Police Department. Certificates will be available once the check completes.
                  </p>
                  <div className="pt-4">
                    <Link to={`/portal/track/${selectedCandidate.id}`} className="inline-block bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 font-bold px-6 py-2.5 rounded-xl transition-colors">
                      Track Application Timeline
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium">
              Data protected under DPDP Act 2023. All accesses are cryptographically logged.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PersonnelDetails;
