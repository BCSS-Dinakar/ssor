import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, User, ArrowLeft, 
  Calendar, Mail, Phone, Clock, FileText, 
  CheckCircle, AlertOctagon, Info, MapPin, Hash, CheckSquare, Image as ImageIcon, Download
} from 'lucide-react';
import { DetailSkeleton } from '../../../components/ui/index';
import { StatusPill } from '../../../components/portal/Badges';
import { organizationApi } from '../../../api/organization.api';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';

function DetailField({ label, value, mono = false, icon: Icon, fullWidth = false }) {
  if (!value) return null;
  return (
    <div className={`space-y-1.5 ${fullWidth ? 'col-span-1 sm:col-span-2' : ''}`}>
      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
        {label}
      </span>
      <div className={`font-semibold text-slate-800 ${mono ? 'font-mono text-[15px]' : 'text-[15px]'}`}>
        {value}
      </div>
    </div>
  );
}

function CertField({ label, value, mono = false }) {
  return (
    <div className="bg-white p-4 text-left">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{label}</div>
      <div className={`text-sm font-semibold text-primary break-words ${mono ? 'font-mono' : ''}`}>
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
  const [downloading, setDownloading] = useState(false);

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

  const handleDownloadCertificate = async () => {
    try {
      setDownloading(true);
      const blob = await organizationApi.downloadCertificate(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      const nameForFile = (selectedCandidate?.candidateName || selectedCandidate?.candidate || id).replace(/\s+/g, '_');
      link.setAttribute('download', `Clearance_Certificate_${nameForFile}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate Downloaded', 'Clearance Certificate PDF downloaded successfully.');
    } catch (err) {
      console.error('Download certificate error:', err);
      toast.error('Download Failed', 'Failed to download Clearance Certificate PDF.');
    } finally {
      setDownloading(false);
    }
  };

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

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const candidateName = selectedCandidate.candidateName || selectedCandidate.candidate || 'Unknown Candidate';
  const role = selectedCandidate.role || 'Unspecified Role';
  const dob = formatDate(selectedCandidate.dob);
  const submitted = formatDate(selectedCandidate.createdAt || selectedCandidate.submitted);
  const decisionDate = formatDate(selectedCandidate.updatedAt || selectedCandidate.decisionDate);
  const policeFeedback = selectedCandidate.policeFeedback || selectedCandidate.reason;
  const orgName = selectedCandidate.orgName || selectedCandidate.org;
  const govId = selectedCandidate.aadharNumber || selectedCandidate.idNumber;
  const maskedGovId = govId ? `XXXX XXXX ${String(govId).slice(-4)}` : null;

  const hasImage = !!selectedCandidate.candidateImage;

  return (
    <div className="space-y-8 w-full animate-fadeIn pb-12">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className={`absolute inset-0 opacity-[0.08] bg-gradient-to-br ${isCleared ? 'from-emerald-400 to-teal-600' : isRejected ? 'from-rose-400 to-red-600' : 'from-amber-400 to-orange-600'}`} />
        
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`h-20 w-20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner border-2 ${isCleared ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : isRejected ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
              <User className="h-10 w-10" />
            </div>
            <div>
              <Link to="/portal/candidates" className="text-xs font-bold text-slate-400 hover:text-primary mb-1.5 flex items-center gap-1 transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to roster
              </Link>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{candidateName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                  <FileText className="h-4 w-4 text-slate-400" /> {role}
                </span>
                {orgName && (
                  <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg">
                    <Info className="h-4 w-4 text-slate-400" /> {orgName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/50 shadow-sm text-right flex flex-col items-end">
            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-widest">Official Status</span>
            <StatusPill status={selectedCandidate.status} />
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-8 items-start">
        {/* Left Column: Personal Info Card */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Info className="h-5 w-5 text-secondary" /> Personal Details
              </h4>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-y-6 gap-x-4 bg-slate-50/30">
              <DetailField label="Government ID" value={selectedCandidate.aadharNumber || selectedCandidate.idNumber} mono icon={Hash} fullWidth />
              <DetailField label="Date of Birth" value={dob} mono icon={Calendar} />
              <DetailField label="Phone Number" value={selectedCandidate.phone} icon={Phone} />
              <DetailField label="Father's Name" value={selectedCandidate.fatherName} icon={User} fullWidth />
              <DetailField label="Email Address" value={selectedCandidate.email} icon={Mail} fullWidth />
              <DetailField label="Residential Address" value={selectedCandidate.address} icon={MapPin} fullWidth />
              
              <div className="pt-4 border-t border-slate-100 col-span-1 sm:col-span-2 xl:col-span-1 space-y-3">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5" /> Documentation
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${hasImage ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    <ImageIcon className="h-3.5 w-3.5" /> Photo {hasImage ? 'Attached' : 'Missing'}
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${selectedCandidate.consentFile ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    <FileText className="h-3.5 w-3.5" /> Consent {selectedCandidate.consentFile ? 'Attached' : 'Missing'}
                  </div>
                </div>
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
              <span className="text-xs font-mono font-bold text-slate-400 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                ID: {selectedCandidate.id}
              </span>
            </div>
            <div className="p-6 sm:p-8">
              
              {isCleared && (
                <div className="space-y-8">
                  <div className="flex items-start gap-4 p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl shadow-sm">
                    <CheckCircle className="h-6 w-6 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-bold text-emerald-800 text-base">Clearance Issued Successfully</h5>
                      <p className="text-sm text-emerald-700 mt-1.5 font-medium leading-relaxed">
                        Comprehensive registry background checks found no matching records. The applicant is cleared for the targeted role.
                      </p>
                    </div>
                  </div>

                  <div className="relative overflow-hidden bg-gradient-to-b from-white to-primary-50 rounded-2xl p-8 shadow-sm border-2 border-primary-100 group">
                    <div className="absolute top-0 right-0 p-32 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none">
                      <ShieldCheck className="h-full w-full text-primary" />
                    </div>

                    <div className="relative z-10 space-y-6">
                      <div className="text-center space-y-4">
                        <div className="inline-block px-4 py-1.5 rounded-full border border-primary/25 text-primary text-[10px] font-black tracking-widest uppercase">
                          Official SSOR Certificate
                        </div>

                        <div>
                          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Clearance reference ID</div>
                          <div className="text-4xl font-black font-mono text-primary tracking-tight">
                            {selectedCandidate.id.split('-')[0].toUpperCase()}
                          </div>
                        </div>

                        <div className="max-w-md mx-auto text-sm text-slate-600 font-medium leading-relaxed">
                          This document cryptographically certifies that <strong className="text-primary font-bold">{candidateName}</strong> has been cleared under the State Sexual Offender Registry.
                        </div>
                      </div>

                      {/* Clear, structured certificate details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
                        <CertField label="Cleared For (Role)" value={role} />
                        <CertField label="Organization" value={orgName} />
                        <CertField label="Date of Birth" value={dob} mono />
                        <CertField label="Government ID" value={maskedGovId} mono />
                        <CertField label="Verification Date" value={decisionDate} mono />
                        <CertField label="Full Reference No." value={selectedCandidate.id} mono />
                      </div>

                      <div className="pt-5 border-t border-slate-200 flex flex-wrap gap-y-2 justify-between items-center text-xs font-bold text-slate-500">
                        <span>ISSUER: TELANGANA STATE POLICE DEPT</span>
                        <span className="text-success flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5" /> DIGITALLY SIGNED &amp; VERIFIED
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full justify-center py-3.5 rounded-xl shadow-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2"
                    onClick={handleDownloadCertificate}
                    disabled={downloading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading ? 'Generating PDF...' : 'Download Official Certificate (PDF)'}
                  </Button>
                  <p className="text-center text-xs font-semibold text-emerald-700 mt-3">
                    Official PDF certificate is verified and ready for download.
                  </p>
                </div>
              )}

              {isRejected && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-5 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm">
                    <AlertOctagon className="h-6 w-6 text-rose-500 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-bold text-rose-800 text-base">Referral Rejected</h5>
                      <p className="text-sm text-rose-700 mt-1.5 font-medium leading-relaxed">
                        A potential registry match was flagged and confirmed by a reviewing officer. Safe recruitment clearance is denied.
                      </p>
                    </div>
                  </div>

                  {selectedCandidate.matchedSuspect && (
                    <div className="rounded-2xl border border-rose-200 overflow-hidden shadow-sm">
                      <div className="bg-rose-50/50 px-5 py-3.5 border-b border-rose-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-rose-800 uppercase tracking-wide flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4" /> Registry Match
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-500 bg-white px-2 py-1 rounded border border-rose-100">
                          ID: {selectedCandidate.matchedSuspect.id}
                        </span>
                      </div>
                      <div className="p-6 grid sm:grid-cols-2 gap-y-6 gap-x-4 bg-white">
                        <DetailField label="Registered Name" value={selectedCandidate.matchedSuspect.name} />
                        <DetailField label="Conviction Date" value={selectedCandidate.matchedSuspect.convDate} mono />
                        <div className="sm:col-span-2">
                          <DetailField label="Convicted Offence" value={<span className="text-rose-600 font-bold">{selectedCandidate.matchedSuspect.offence}</span>} />
                        </div>
                        <div className="sm:col-span-2">
                          <DetailField label="Physical Markings" value={selectedCandidate.matchedSuspect.identifications || 'None recorded'} />
                        </div>
                      </div>
                    </div>
                  )}

                  {policeFeedback && (
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-inner">
                      <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Officer Decision Notes
                      </h6>
                      <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {policeFeedback.split('\n\nOfficer Notes: ')[1] || policeFeedback.split('\n\nOfficer Notes: ')[0] || policeFeedback}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Link 
                      to="/portal/compliance" 
                      state={{ autoCreateTicket: true, reference: selectedCandidate.id, candidate: candidateName }}
                      className="flex items-center justify-center w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors shadow-md"
                    >
                      File an Appeal with Support Desk
                    </Link>
                  </div>
                </div>
              )}

              {isPending && (
                <div className="py-16 text-center space-y-5">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 mb-2 border-4 border-amber-100 shadow-inner">
                    <Clock className="h-8 w-8 text-amber-500 animate-spin-slow" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">Verification in Progress</h3>
                  <p className="text-slate-500 max-w-md mx-auto text-sm font-medium leading-relaxed">
                    This application was submitted on <strong>{submitted}</strong> and is currently under formal review by the Telangana State Police Department. Certificates will be available once the background check is complete.
                  </p>
                  <div className="pt-6">
                    <Link to={`/portal/track/${selectedCandidate.id}`} className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 shadow-sm text-slate-700 hover:border-primary hover:text-primary font-bold px-8 py-3 rounded-xl transition-all">
                      <Clock className="h-4 w-4" /> Track Application Timeline
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Metadata Footer */}
          <div className="text-center pb-4">
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
