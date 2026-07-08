import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldAlert, Award, Download, User, Lock, ArrowLeft, CheckCircle2, Mail, Phone, Calendar, Clock } from 'lucide-react';
import { StatusPill } from '../../../components/portal/Badges';
import { useData } from '../../../context/DataContext';

function DetailField({ label, value, mono = false, icon: Icon }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <div className={`font-semibold text-slate-800 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-2 ${mono ? 'font-mono text-sm' : 'text-sm'}`}>
        {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0" />}
        {value || '—'}
      </div>
    </div>
  );
}

function PersonnelDetails() {
  const { id } = useParams();
  const { clearances } = useData();
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    if (id) {
      const matched = clearances.find((c) => c.id.toUpperCase() === id.trim().toUpperCase());
      if (matched) setSelectedCandidate(matched);
    }
  }, [id, clearances]);

  if (!selectedCandidate) {
    return (
      <div className="space-y-6">
        <Link to="/portal/candidates" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-primary transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back to Verified Roster
        </Link>
        <div className="card p-12 text-center text-slate-400">
          <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Candidate ID {id} Not Found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-fadeIn pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200/60 gap-4">
        <Link to="/portal/candidates" className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-primary transition-all bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Verified Roster
        </Link>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
          <span>Roster Status:</span>
          <StatusPill status={selectedCandidate.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Profile Card */}
        <div className="card p-6 space-y-5 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
          
          <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Candidate Profile Card</h4>
              <p className="text-[9px] text-slate-400 font-bold">Immutable CCTNS relay reference data.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <DetailField label="Candidate Name" value={selectedCandidate.candidate} />
            <DetailField label="Targeted Role" value={selectedCandidate.role} />
            <DetailField label="Government ID" value={selectedCandidate.idNumber} mono />
            <DetailField label="Date of Birth" value={selectedCandidate.dob} mono icon={Calendar} />
            <DetailField label="Contact Email" value={selectedCandidate.email} icon={Mail} />
            <DetailField label="Contact Phone" value={selectedCandidate.phone} icon={Phone} />
            <div className="sm:col-span-2">
              <DetailField label="Submitting Institution" value={selectedCandidate.org} />
            </div>
            <DetailField label="Submission Date" value={selectedCandidate.submitted} mono />
            <DetailField label="Decision Date" value={selectedCandidate.decisionDate || 'Vetting Completed'} mono />
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consent Vetted</span>
              <div className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs uppercase flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Authorized
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-[11px] text-slate-500 leading-relaxed flex items-start gap-2.5 font-medium">
            <Lock className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
            <span>Attributes audited under DPDP Act 2023 directives. Roster records are read-only, securely encrypted, and audit logs are recorded upon access.</span>
          </div>
        </div>

        {/* Outcome Card */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4 bg-white">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Vetting Outcome</h4>
              <StatusPill status={selectedCandidate.status} />
            </div>

            {selectedCandidate.status === 'cleared' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800">
                  <strong>Verification completed: no matches found</strong>
                  <p className="mt-1 text-emerald-700 font-medium">Clearance issued successfully. The candidate is registered on the active compliance roster.</p>
                </div>

                <div className="border-4 border-double border-slate-200 bg-slate-50/50 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-inner text-center">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center select-none">
                    <Award className="w-32 h-32 text-primary" />
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-455 font-black border-b border-slate-200 border-dashed pb-2">Telangana State Police Department</div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Official SSOR Clearance Certificate</h5>
                    <span className="text-[10px] font-mono text-secondary font-bold block pt-1">{selectedCandidate.id}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 leading-normal max-w-sm mx-auto font-medium">
                    This certifies that applicant <strong>{selectedCandidate.candidate}</strong> has been cleared under the State Sexual Offender Register vetting cell.
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 border-t border-slate-200 border-dashed pt-2 mt-2">
                    <span>DSP DIGITAL SIGNATURE: VERIFIED</span>
                    <span className="font-mono text-emerald-600">DATE: {selectedCandidate.decisionDate || selectedCandidate.submitted}</span>
                  </div>
                </div>

                <button
                  onClick={() => alert(`Downloading clearance certificate PDF for ${selectedCandidate.candidate}`)}
                  className="btn-primary py-2.5 px-5 text-xs w-full justify-center shadow-lg"
                >
                  <Download className="h-4.5 w-4.5" /> Download Clearance Certificate (PDF)
                </button>
              </div>
            )}

            {selectedCandidate.status === 'rejected' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 font-semibold">
                  <strong>Verification outcome: referral locked</strong>
                  <p className="mt-1 text-red-700 font-medium">A potential registry match is active. Candidate clearance has been rejected after formal investigation.</p>
                </div>

                {selectedCandidate.reason && (
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-slate-455 font-black block">Police Decision Log Reason</span>
                    <p className="text-xs font-semibold text-slate-655 leading-normal whitespace-pre-wrap">
                      {selectedCandidate.reason.split('\n\nOfficer Notes: ')[0]}
                    </p>
                  </div>
                )}
                
                {selectedCandidate.matchedSuspect && (
                  <div className="border border-red-200 bg-red-50/30 rounded-2xl overflow-hidden mt-4">
                    <div className="bg-red-100/50 px-4 py-2 border-b border-red-200">
                      <span className="text-[10px] font-black text-red-800 uppercase tracking-wider">Confirmed Registry Match</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Match ID</span>
                        <span className="font-mono font-semibold text-slate-800">{selectedCandidate.matchedSuspect.id}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Registered Name</span>
                        <span className="font-bold text-slate-800">{selectedCandidate.matchedSuspect.name}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Convicted Offence</span>
                        <span className="font-semibold text-red-700">{selectedCandidate.matchedSuspect.offence}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Conviction Date</span>
                        <span className="font-mono font-semibold text-slate-800">{selectedCandidate.matchedSuspect.convDate}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] font-bold text-slate-500 uppercase">Physical Markings</span>
                        <span className="font-semibold text-slate-700">{selectedCandidate.matchedSuspect.identifications || 'None recorded'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedCandidate.reason && selectedCandidate.reason.includes('\n\nOfficer Notes: ') && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 mt-3 shadow-inner">
                    <span className="text-[9px] uppercase tracking-widest text-amber-600 font-black block">Officer Verification Notes</span>
                    <p className="text-xs font-semibold text-amber-900 leading-normal whitespace-pre-wrap">
                      {selectedCandidate.reason.split('\n\nOfficer Notes: ')[1]}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-slate-600 leading-relaxed flex items-start gap-2.5 font-medium">
                  <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Action needed:</strong> Safe recruitment clearance is suspended. Please contact the department via the safety helpdesk to file an appeal.
                  </div>
                </div>
                <Link 
                  to="/portal/compliance" 
                  state={{ autoCreateTicket: true, reference: selectedCandidate.id, candidate: selectedCandidate.candidate }}
                  className="btn-primary py-2.5 px-5 text-xs w-full justify-center bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-100"
                >
                  Speak with Police Support Desk
                </Link>
              </div>
            )}

            {selectedCandidate.status === 'pending' && (
              <div className="p-6 bg-amber-50/50 border border-amber-200/50 rounded-2xl text-center space-y-3 shadow-inner text-xs">
                <Clock className="h-8 w-8 text-amber-500 mx-auto animate-spin-slow" />
                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">Police check in progress</h5>
                <p className="text-[11px] text-slate-500 font-medium leading-normal">Certificate will be available once verification is complete.</p>
                <Link to={`/portal/track/${selectedCandidate.id}`} className="btn-secondary py-2 px-4 text-xs justify-center mt-2">
                  View timeline
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonnelDetails;
