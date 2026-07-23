import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, ArrowRight, DownloadCloud, Copy, Check, Clock, Search, BellRing, FileText } from 'lucide-react';
import { Field, inputClass, FeedbackBanner } from '../../../components/portal/FormControls';
import { organizationApi } from '../../../api/organization.api';
import { ORG_TYPES } from '../../../utils/data/authData';
import SearchableSelect from '../../../components/SearchableSelect';
import { useToast } from '../../../components/ui/Toast';

const empty = { candidate: '', fatherName: '', dob: '', phone: '', address: '', role: '', type: '', consent: false, aadharNumber: '', candidateImage: null, consentFile: null };

function SubmitVerification() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [alert, setAlert] = useState(null);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const copyReferenceId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) { /* clipboard unavailable */ }
  };

  const canDownloadConsent = Boolean(
    form.candidate.trim() &&
    form.dob &&
    form.role.trim() &&
    form.phone.replace(/\D/g, '').length === 10 &&
    form.address.trim() &&
    form.type &&
    form.aadharNumber.replace(/\D/g, '').length === 12
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.candidate.trim()) return setAlert({ type: 'error', message: 'Candidate full name is required.' });
    if (!form.dob) return setAlert({ type: 'error', message: 'Date of birth is required.' });
    if (!form.role.trim()) return setAlert({ type: 'error', message: 'Sensitive role is required.' });
    if (!form.phone.trim()) return setAlert({ type: 'error', message: 'Phone number is required.' });
    if (!form.address.trim()) return setAlert({ type: 'error', message: 'Address is required.' });
    const phoneClean = form.phone.replace(/\D/g, '');
    if (phoneClean.length !== 10) return setAlert({ type: 'error', message: 'Enter a valid 10-digit mobile number.' });
    if (!form.type) return setAlert({ type: 'error', message: 'Institution category is required.' });
    
    const aadharClean = form.aadharNumber.replace(/\D/g, '');
    if (!aadharClean) return setAlert({ type: 'error', message: 'Aadhar number is required.' });
    if (aadharClean.length !== 12) return setAlert({ type: 'error', message: 'Enter a valid 12-digit Aadhar number.' });

    if (!form.candidateImage) return setAlert({ type: 'error', message: 'Candidate image is required.' });
    if (!form.consent) return setAlert({ type: 'error', message: 'Candidate explicit consent must be confirmed before submitting.' });
    if (!form.consentFile) return setAlert({ type: 'error', message: 'Signed consent document must be uploaded.' });

    setLoading(true);
    setAlert(null);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null) {
          let val = form[key];
          if ((key === 'aadharNumber' || key === 'phone') && typeof val === 'string') {
            val = val.replace(/-/g, '');
          }
          formData.append(key, val);
        }
      });

      const data = await organizationApi.submitVerification(formData);
      setSubmittedRecord(data.verification);
      setForm(empty);
      // reset file inputs visually if needed
      document.getElementById('candidateImageInput').value = '';
      document.getElementById('consentFileInput').value = '';
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: err.response?.data?.message || 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  const generateConsentForm = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('candidate', form.candidate);
      formData.append('fatherName', form.fatherName);
      formData.append('dob', form.dob);
      formData.append('aadharNumber', form.aadharNumber);
      formData.append('phone', form.phone);
      formData.append('address', form.address);
      formData.append('type', form.type);
      formData.append('role', form.role);
      if (form.candidateImage) {
        formData.append('candidateImage', form.candidateImage);
      }

      const blob = await organizationApi.generateConsentTemplate(formData);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Consent_Template_${form.candidate ? form.candidate.replace(/\\s+/g, '_') : 'Candidate'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error('Template generation failed', 'Please ensure the form is filled and try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Success Receipt State
  // -------------------------------------------------------------
  if (submittedRecord) {
    const submittedAt = submittedRecord.createdAt
      ? new Date(submittedRecord.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Just now';

    const nextSteps = [
      {
        icon: CheckCircle2,
        title: 'Request Submitted',
        detail: `Received ${submittedAt}`,
        state: 'done',
      },
      {
        icon: Search,
        title: 'Police Verification',
        detail: 'Cross-checking against the Telangana State Sexual Offender Registry under controlled access.',
        state: 'current',
      },
      {
        icon: FileText,
        title: 'Decision Issued',
        detail: 'Clear / Reject outcome delivered to your dashboard, typically within 24–48 hours.',
        state: 'pending',
      },
    ];

    return (
      <div className="space-y-6 w-full animate-fadeIn pb-10">

        {/* Header Section — matches the form/page header pattern */}
        <div className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 shrink-0 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 font-heading">Verification Request Initiated</h2>
              <p className="text-base text-slate-500 mt-0.5">
                The candidate's details have been securely transmitted to the Telangana State Police registry for background vetting.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-start">

          {/* Left: request details */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">

              {/* Reference ID */}
              <div className="bg-slate-900 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Official Reference ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-mono text-base tracking-wide break-all">
                      {submittedRecord.id}
                    </span>
                    <button
                      onClick={() => copyReferenceId(submittedRecord.id)}
                      title="Copy reference ID"
                      className="shrink-0 text-slate-400 hover:text-emerald-300 transition-colors p-1"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active
                </span>
              </div>

              {/* Details grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Candidate Name</span>
                  <p className="text-slate-800 font-bold text-base">{submittedRecord.candidateName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Designated Role</span>
                  <p className="text-slate-800 font-bold text-base">{submittedRecord.role}</p>
                </div>
                <div className="space-y-1 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="flex items-center gap-1.5 text-amber-600/80 text-xs font-bold uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" /> Current Status
                  </span>
                  <p className="text-amber-600 font-bold text-base">Under Police Review</p>
                </div>
                <div className="space-y-1 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Estimated Completion</span>
                  <p className="text-slate-700 font-bold text-base">Within 24–48 Hours</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button onClick={() => navigate(`/portal/track/${submittedRecord.id}`)} className="btn-primary py-3 px-6 justify-center rounded-xl text-base">
                  Track Live Status <ArrowRight className="h-5 w-5 ml-2" />
                </button>
                <button onClick={() => setSubmittedRecord(null)} className="bg-white border border-slate-200 shadow-sm text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors py-3 px-6 rounded-xl text-base text-center">
                  Submit Another Candidate
                </button>
              </div>

            </div>
          </div>

          {/* Right: what happens next */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <h3 className="font-bold text-slate-800 text-lg mb-6">What happens next</h3>

              <ol className="space-y-6">
                {nextSteps.map((step, i) => {
                  const Icon = step.icon;
                  const isLast = i === nextSteps.length - 1;
                  const styles = {
                    done: 'bg-emerald-500 text-white border-emerald-500',
                    current: 'bg-amber-50 text-amber-600 border-amber-300',
                    pending: 'bg-slate-50 text-slate-400 border-slate-200',
                  }[step.state];
                  return (
                    <li key={step.title} className="relative flex gap-4">
                      {!isLast && (
                        <span className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-slate-200" aria-hidden="true" />
                      )}
                      <div className={`relative z-10 w-10 h-10 shrink-0 rounded-full border flex items-center justify-center ${styles}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="pt-1">
                        <p className={`font-bold text-base ${step.state === 'pending' ? 'text-slate-500' : 'text-slate-800'}`}>
                          {step.title}
                          {step.state === 'current' && (
                            <span className="ml-2 align-middle inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-wide">In progress</span>
                          )}
                        </p>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{step.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-8 pt-5 border-t border-slate-100 flex items-start gap-3">
                <BellRing className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-500 leading-relaxed">
                  You'll be notified on your dashboard the moment the status changes. No action is needed from you in the meantime.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Single Form State
  return (
    <div className="space-y-6 w-full animate-fadeIn pb-10">

      {/* Header Section */}
      <div className="mb-6 border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-800 font-heading">Verify New Candidate</h2>
        <p className="text-base text-slate-500 mt-1">
          Submit candidate details for formal background vetting against the State Sexual Offender Registry.
        </p>
      </div>

      <FeedbackBanner type={alert?.type} message={alert?.message} />

      <form onSubmit={submit} className="space-y-10">

        {/* Section 1: Demographics */}
        <div>
          <h3 className="font-bold text-slate-800 text-lg mb-4">Candidate Registry</h3>
          <p className="text-sm text-slate-500 mb-6 -mt-3">Credentials must match official state documents exactly.</p>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-6">
            <Field label="Candidate Full Name" required>
              <input className={inputClass} value={form.candidate} onChange={set('candidate')} placeholder="e.g. Ramesh Kumar" required />
            </Field>

            <Field label="Father's Name" hint="Optional but improves check accuracy.">
              <input className={inputClass} value={form.fatherName} onChange={set('fatherName')} placeholder="e.g. Srinivas Rao" />
            </Field>

            <Field label="Date of Birth" required hint="Used for cross-matching records.">
              <input className={inputClass} type="date" value={form.dob} onChange={set('dob')} required />
            </Field>

            <Field label="Sensitive Role Vetted" required hint="E.g. School Bus Driver.">
              <input className={inputClass} value={form.role} onChange={set('role')} placeholder="e.g. Caregiver" required />
            </Field>

            <Field label="Contact Phone Number" required hint="10-digit mobile number.">
              <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10).replace(/(\d{5})(?=\d)/g, '$1-') })} maxLength={11} placeholder="e.g. 98765-43210" required />
            </Field>

            <Field label="Residential Address" required className="sm:col-span-2">
              <input className={inputClass} value={form.address} onChange={set('address')} placeholder="Full residential address" required />
            </Field>

            <Field label="Institution Category" required>
              <SearchableSelect
                value={form.type}
                onChange={(val) => setForm({ ...form, type: val })}
                options={ORG_TYPES}
                placeholder="Select Category"
              />
            </Field>

            <Field label="Aadhar Number" required hint="12-digit UIDAI Number.">
              <input className={inputClass} value={form.aadharNumber} onChange={(e) => setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12).replace(/(\d{4})(?=\d)/g, '$1-') })} maxLength={14} placeholder="1234-5678-9012" required />
            </Field>

            <Field label="Candidate Image" required hint="Recent passport size photograph.">
              <div className="flex items-center gap-3">
                {form.candidateImage && (
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-300 shadow-sm bg-slate-100">
                    <img src={URL.createObjectURL(form.candidateImage)} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
                <input
                  id="candidateImageInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setForm({ ...form, candidateImage: e.target.files[0] })}
                  className="block w-full text-sm text-slate-900 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all cursor-pointer border border-slate-300 rounded-lg p-1 h-10 bg-white"
                  required
                />
              </div>
            </Field>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Section 2: Consent */}
        <div>
          <h3 className="font-bold text-slate-800 text-lg mb-4">Statutory Consent Declaration</h3>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6 max-w-4xl">

            <label className={`flex items-start gap-3 group ${!form.consentFile ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={form.consent}
                  disabled={!form.consentFile}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all checked:border-primary checked:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <CheckCircle2 className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
              </div>
              <div className="space-y-1">
                <span className="text-base font-bold text-slate-800">I Agree to the Mandatory Candidate Vetting Consent</span>
                <p className="text-sm text-slate-600 leading-relaxed">
                  I confirm that this institution holds a signed, explicit consent letter from the candidate authorizing the Telangana State Police to match their demographics against the conviction-based Sexual Offender Registry.
                  {!form.consentFile && <span className="block text-amber-600 font-semibold mt-1">Please upload the signed consent document below before checking this box.</span>}
                </p>
              </div>
            </label>

            <div className="text-sm text-slate-500 flex gap-2 items-start bg-white p-3 rounded border border-slate-200">
              <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p><strong>Notice under DPDP Act 2023:</strong> Performing background verifications without legal authorization or written consent of the data principal constitutes a severe breach, subject to compliance penalties.</p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Signed Consent Document</label>
                <input
                  id="consentFileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setForm({ ...form, consentFile: e.target.files[0] })}
                  className="block w-full text-sm text-slate-900 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all cursor-pointer border border-slate-300 rounded-lg p-1 h-10 bg-white"
                  required
                />
              </div>

              <div className="flex-1 flex flex-col items-start justify-center">
                <span className="block text-sm font-bold text-slate-700 mb-2">Download Consent form</span>
                <button 
                  type="button" 
                  onClick={generateConsentForm} 
                  disabled={!canDownloadConsent}
                  className={`inline-flex justify-center items-center gap-2 text-sm font-medium rounded-lg border transition-all px-4 py-2 ${
                    canDownloadConsent 
                      ? 'text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-300 shadow-sm' 
                      : 'text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <DownloadCloud className="h-4 w-4" /> Download Consent Form
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 pb-12 flex justify-start">
          <button type="submit" className="btn-primary py-3 px-8 text-base justify-center rounded-lg" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Verification Request'}
            {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitVerification;
