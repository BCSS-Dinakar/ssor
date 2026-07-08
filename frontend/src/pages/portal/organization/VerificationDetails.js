import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  User,
  Award,
  Lock,
  ArrowLeft,
  Download,
  MessageSquare,
} from 'lucide-react';
import { StatusPill } from '../../../components/portal/Badges';
import { useData } from '../../../context/DataContext';

function DetailField({ label, value, mono = false }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <div className={`font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </div>
    </div>
  );
}

function VerificationDetails() {
  const { id } = useParams();
  const { clearances, disclosures } = useData();
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (id) {
      let matched = clearances.find((c) => c.id.toUpperCase() === id.trim().toUpperCase());
      let type = 'Candidate Vetting';

      if (!matched) {
        const dMatch = disclosures.find((d) => d.id.toUpperCase() === id.trim().toUpperCase());
        if (dMatch) {
          matched = {
            id: dMatch.id,
            org: dMatch.by || 'Associated School Unit',
            role: dMatch.concern || 'Threat Inquiry',
            candidate: dMatch.by || 'Suspect Individual',
            idNumber: '',
            dob: '',
            submitted: dMatch.submitted,
            decisionDate: '',
            status: dMatch.status === 'approved' ? 'cleared' : dMatch.status === 'declined' ? 'rejected' : 'pending',
          };
          type = 'Child Threat Inquiry';
        }
      }

      if (matched) {
        const isPending = matched.status === 'pending';
        const steps = [
          { label: 'Application Submitted', detail: `Received on ${matched.submitted || '—'}`, done: true },
          {
            label: 'Police Verification',
            detail: isPending ? 'Cross-checking against the register under controlled access' : 'Register database search completed',
            done: !isPending,
            current: isPending,
          },
          {
            label: 'Decision Issued',
            detail: matched.status === 'cleared' ? 'Clearance approved' : matched.status === 'rejected' ? 'Reject decision issued' : 'Clear / Reject outcome pending',
            done: !isPending,
          },
        ];

        setSelectedRequest({ ...matched, type, steps });
      }
    }
  }, [id, clearances, disclosures]);

  if (!selectedRequest) {
    return (
      <div className="space-y-6">
        <Link to="/portal/requests" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back to Applications List
        </Link>
        <div className="card p-12 text-center text-slate-400">
          <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Reference {id} Not Found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-fadeIn pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200/60 gap-4">
        <Link to="/portal/requests" className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-primary transition-all bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Applications
        </Link>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
          <span>Current Status:</span>
          <StatusPill status={selectedRequest.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Left Card: Audit File */}
        <div className="card p-6 space-y-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-secondary" />
            <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Submitted Audit File</h4>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <DetailField
              label={selectedRequest.type === 'Candidate Vetting' ? 'Candidate Name' : 'Subject of Concern'}
              value={selectedRequest.candidate}
            />
            <DetailField
              label={selectedRequest.type === 'Candidate Vetting' ? 'Targeted Role' : 'Relation / Context'}
              value={selectedRequest.role}
            />
            <DetailField label="Government ID Number" value={selectedRequest.idNumber} mono />
            <DetailField label="Date of Birth" value={selectedRequest.dob} mono />
            <div className="sm:col-span-2">
              <DetailField label="Submitting Institution" value={selectedRequest.org} />
            </div>
            <DetailField label="Submission Date" value={selectedRequest.submitted} mono />
            <DetailField label="Decision Date" value={selectedRequest.decisionDate || 'Pending Vetting'} mono />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-[11px] text-slate-500 leading-relaxed flex items-start gap-2.5 font-medium">
            <Lock className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <span>Attributes verified under DPDP Act 2023 guidelines. Data matching process is securely logged on police servers and is fully auditable.</span>
          </div>
        </div>

        {/* Right Card: Pipeline & Result */}
        <div className="space-y-6">
          {/* Verification Pipeline */}
          <div className="card p-6 space-y-4 bg-white">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Verification Pipeline</h4>
            </div>

            <div className="relative pl-7 space-y-5">
              <div className="absolute left-[9px] top-1.5 bottom-1.5 w-[2px] bg-slate-200" />
              {selectedRequest.steps.map((step, idx) => (
                <div key={idx} className="relative flex gap-3 text-xs leading-relaxed font-semibold">
                  <div className={`absolute -left-7 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-sm ${step.done ? 'bg-emerald-500 text-white shadow-emerald-200' : step.current ? 'bg-amber-500 text-white shadow-amber-200' : 'bg-slate-200 text-slate-400'
                    }`}>
                    {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <span className={`font-bold text-[13px] ${step.done ? 'text-slate-800' : step.current ? 'text-amber-700 font-extrabold' : 'text-slate-400'}`}>{step.label}</span>
                    <p className="text-[11px] text-slate-455 font-medium mt-0.5">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vetting Result Card */}
          <div className="card p-6 space-y-4 bg-white">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Verification Result</h4>
            </div>

            {selectedRequest.status === 'cleared' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-2xl">
                  <strong>Clearance Status: CLEARED (APPROVED)</strong>
                  <p className="mt-1 text-emerald-700/90 font-medium">No matching sex offender register records identified. Candidate is cleared for recruitment.</p>
                </div>

                {/* Official Stamp Box */}
                <div className="border-4 border-double border-slate-200 bg-slate-50/50 rounded-2xl p-5 space-y-4 relative overflow-hidden text-center shadow-inner">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                    <Award className="w-28 h-28 text-primary" />
                  </div>

                  <div className="text-[9px] uppercase tracking-widest text-slate-455 font-black">Telangana State Police Department</div>

                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Clearance Certificate</h5>
                    <span className="text-[10px] font-mono text-secondary font-bold block">{selectedRequest.id}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-normal max-w-sm mx-auto font-medium">
                    This document certifies that candidate <strong>{selectedRequest.candidate}</strong> was vetted against the state conviction records with matching details.
                  </p>

                  <div className="flex items-center justify-between pt-2 max-w-xs mx-auto border-t border-slate-200 border-dashed text-[8px] font-bold text-slate-400">
                    <span>SEAL SECURED</span>
                    <span className="font-mono text-emerald-600">VALID: 365 DAYS</span>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Downloading clearance certificate PDF for ${selectedRequest.candidate}`)}
                  className="btn-primary py-2.5 px-5 text-xs w-full justify-center shadow-lg"
                >
                  <Download className="h-4.5 w-4.5" /> Download Clearance Certificate (PDF)
                </button>
              </div>
            )}

            {selectedRequest.status === 'rejected' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 text-xs font-semibold text-red-800 rounded-2xl">
                  <strong>Clearance Status: REJECTED (LOCKED)</strong>
                  <p className="mt-1 text-red-700/90 font-medium">A potential mismatch has been flagged. The application is locked pending a formal investigation at the DSP Desk.</p>
                </div>

                {selectedRequest.reason && (
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-slate-455 font-black block">Police Decision Log Reason</span>
                    <p className="text-xs font-semibold text-slate-655 leading-normal whitespace-pre-wrap">
                      {selectedRequest.reason.split('\n\nOfficer Notes: ')[0]}
                    </p>
                  </div>
                )}

                {selectedRequest.matchedSuspect && (
                  <div className="border border-red-200 bg-red-50/30 rounded-2xl overflow-hidden mt-4">
                    <div className="bg-red-100/50 px-4 py-2 border-b border-red-200">
                      <span className="text-[10px] font-black text-red-800 uppercase tracking-wider">Confirmed Registry Match</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Match ID</span>
                        <span className="font-mono font-semibold text-slate-800">{selectedRequest.matchedSuspect.id}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Registered Name</span>
                        <span className="font-bold text-slate-800">{selectedRequest.matchedSuspect.name}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Convicted Offence</span>
                        <span className="font-semibold text-red-700">{selectedRequest.matchedSuspect.offence}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Conviction Date</span>
                        <span className="font-mono font-semibold text-slate-800">{selectedRequest.matchedSuspect.convDate}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Physical Markings</span>
                        <span className="font-semibold text-slate-700">{selectedRequest.matchedSuspect.identifications || 'None recorded'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.reason && selectedRequest.reason.includes('\n\nOfficer Notes: ') && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 mt-3 shadow-inner">
                    <span className="text-[9px] uppercase tracking-widest text-amber-600 font-black block">Officer Verification Notes</span>
                    <p className="text-xs font-semibold text-amber-900 leading-normal whitespace-pre-wrap">
                      {selectedRequest.reason.split('\n\nOfficer Notes: ')[1]}
                    </p>
                  </div>
                )}

                <Link 
                  to="/portal/compliance" 
                  state={{ autoCreateTicket: true, reference: selectedRequest.id, candidate: selectedRequest.candidate }}
                  className="btn-primary py-2.5 px-5 text-xs w-full justify-center bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-100 mt-2"
                >
                  <MessageSquare className="h-4.5 w-4.5" /> Speak with Police Support Desk
                </Link>
              </div>
            )}

            {selectedRequest.status === 'pending' && (
              <div className="p-8 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-center space-y-3 shadow-inner">
                <Clock className="h-8 w-8 text-amber-500 mx-auto animate-spin-slow" />
                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">Police verification in progress</h5>
                <p className="text-[11px] text-slate-500 font-medium">Vetting queries are actively syncing. The certificate preview will generate upon case resolution.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationDetails;
