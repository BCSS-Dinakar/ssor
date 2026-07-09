import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck, ShieldAlert, CheckCircle2, Info, Calendar, User, FileText, Mail, Phone, ArrowRight } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import { Field, inputClass, FeedbackBanner } from '../../../components/portal/FormControls';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { ORG_TYPES } from '../../../utils/data/authData';
import SearchableSelect from '../../../components/SearchableSelect';

const empty = { candidate: '', docType: 'Aadhaar Card', idNumber: '', dob: '', email: '', phone: '', role: '', type: 'School', consent: false };

function SubmitVerification() {
  const { auth } = useAuth();
  const { submitClearance } = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [alert, setAlert] = useState(null);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [step, setStep] = useState(1); // 1 = Details, 2 = Review & Consent

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.candidate.trim() || !form.idNumber.trim() || !form.role.trim()) {
      return setAlert({ type: 'error', message: 'Candidate name, Government ID, and designated role are required.' });
    }
    setAlert(null);
    setStep(2);
    return undefined;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.consent) {
      return setAlert({ type: 'error', message: 'Candidate explicit consent must be confirmed before submitting.' });
    }
    const rec = submitClearance({
      org: auth.name,
      type: form.type,
      role: form.role,
      candidate: form.candidate,
      docType: form.docType,
      idNumber: form.idNumber,
      dob: form.dob,
      email: form.email,
      phone: form.phone,
      consent: form.consent,
    });
    setSubmittedRecord(rec);
    setForm(empty);
    setStep(1);
    return undefined;
  };

  if (submittedRecord) {
    return (
      <div className="space-y-6 animate-fadeIn pb-10">
        <PageHeader
          crumb="Verify New Candidate"
          title="Verify New Candidate"
          subtitle="Submit staff or volunteer details for background vetting against the State Sexual Offender Register."
        />

        <div className="card p-8 max-w-xl mx-auto space-y-6 border border-emerald-100 shadow-xl bg-white relative overflow-hidden">
          {/* Top aesthetic border */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
          
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div className="text-center space-y-1.5">
            <h3 className="text-xl font-extrabold text-slate-800 font-heading">Vetting Request Generated</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Your application has been logged into the secure state police vetting registry for active investigation.
            </p>
          </div>

          {/* Receipt Panel */}
          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-slate-50/50 overflow-hidden shadow-inner text-xs">
            {[
              ['Reference ID', submittedRecord.id, 'font-mono text-secondary font-bold'],
              ['Candidate Name', submittedRecord.candidate, 'text-slate-800 font-bold'],
              ['Document ID Check', `Masked (XXXX-XXXX-${submittedRecord.idNumber.slice(-4) || '3920'})`, 'text-slate-600 font-medium'],
              ['Designated Role', submittedRecord.role, 'text-slate-800 font-bold'],
              ['Vetting Queue Status', 'Under Police Review', 'text-amber-600 font-black animate-pulse'],
              ['Estimated Vetting Window', 'Within 24-48 Hours', 'text-slate-600 font-medium'],
            ].map(([label, value, cls]) => (
              <div key={label} className="flex justify-between p-3.5 items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{label}</span>
                <strong className={`text-right ${cls}`}>{value}</strong>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button onClick={() => navigate(`/portal/track/${submittedRecord.id}`)} className="btn-primary text-xs py-3 px-5 justify-center">
              Track Status <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => setSubmittedRecord(null)} className="btn-secondary text-xs py-3 px-5 justify-center">
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Verify New Candidate"
        title="Verify New Candidate"
        subtitle="Submit staff or volunteer details for background vetting against the State Sexual Offender Register."
      />

      {/* Steps Indicator */}
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-2xl text-xs mb-2">
        <div className={`flex items-center gap-2 font-bold ${step === 1 ? 'text-primary' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono ${step === 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
          Candidate Credentials
        </div>
        <div className="w-10 h-px bg-slate-200 flex-1 mx-3" />
        <div className={`flex items-center gap-2 font-bold ${step === 2 ? 'text-primary' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono ${step === 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
          Consent & Submit
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left Form */}
        <div className="card p-6 lg:col-span-2 space-y-5 bg-white">
          <FeedbackBanner type={alert?.type} message={alert?.message} />

          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Candidate Registry</h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">Vetting credentials must match official state documents.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Candidate Full Name" required hint="Enter candidate name exactly as printed on photo IDs.">
                  <div className="relative">
                    <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input className={inputClass + ' pl-9'} value={form.candidate} onChange={set('candidate')} placeholder="e.g. Ashok Kumar Reddy" required />
                  </div>
                </Field>

                <Field label="Government ID Type" required hint="Select the official document type.">
                  <SearchableSelect
                    value={form.docType}
                    onChange={(val) => setForm({ ...form, docType: val })}
                    options={['Aadhaar Card', 'PAN Card', 'Voter ID', 'Passport', 'Driving License']}
                    placeholder="Select Document Type"
                  />
                </Field>

                <Field label="Government ID Number" required hint="Enter the exact ID number.">
                  <div className="relative">
                    <FileText className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input className={inputClass + ' pl-9'} value={form.idNumber} onChange={set('idNumber')} placeholder={`e.g. ${form.docType === 'Aadhaar Card' ? 'XXXX-XXXX-5678' : 'ABCDE1234F'}`} required />
                  </div>
                </Field>

                <Field label="Date of Birth" required hint="Used for cross-matching demographic records.">
                  <div className="relative">
                    <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input className={inputClass + ' pl-9'} type="date" value={form.dob} onChange={set('dob')} required />
                  </div>
                </Field>

                <Field label="Sensitive Role Vetted" required hint="E.g. School Bus Driver, Auxiliary Ayah, Sports Coach.">
                  <input className={inputClass} value={form.role} onChange={set('role')} placeholder="e.g. Caregiver, School Bus Driver" required />
                </Field>

                <Field label="Contact Email Address">
                  <div className="relative">
                    <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input className={inputClass + ' pl-9'} type="email" value={form.email} onChange={set('email')} placeholder="candidate@example.com" />
                  </div>
                </Field>

                <Field label="Contact Phone Number" hint="Candidate direct mobile number.">
                  <div className="relative">
                    <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input className={inputClass + ' pl-9'} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" />
                  </div>
                </Field>

                <Field label="Vetting Institution Category" className="sm:col-span-2">
                  <SearchableSelect
                    value={form.type}
                    onChange={(val) => setForm({ ...form, type: val })}
                    options={ORG_TYPES}
                    placeholder="Select Category"
                  />
                </Field>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" className="btn-primary text-xs py-2.5 px-5">
                  Continue to Consent <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">Statutory Consent Declaration</h3>
                <p className="text-[10px] text-slate-455 font-bold mt-0.5">Required compliance verification under Telangana State Acts.</p>
              </div>

              {/* Consent check panel */}
              <div className="p-5 bg-amber-50/50 border border-amber-200/60 rounded-2xl space-y-4">
                <label className="flex items-start gap-3.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                    className="mt-1 h-4.5 w-4.5 rounded border-amber-300 text-secondary focus:ring-secondary/20 shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800">Mandatory Candidate Vetting Consent</span>
                    <p className="text-[11px] text-slate-550 leading-relaxed font-medium">
                      I confirm that this institution holds a signed, explicit consent letter from <strong className="text-primary">{form.candidate}</strong> authorizing the State Police to match their demographics against the conviction-based Sexual Offender Register.
                    </p>
                  </div>
                </label>

                <div className="text-[10px] text-slate-500 bg-white p-3.5 rounded-xl border border-slate-150 leading-relaxed font-medium">
                  <strong>Notice under DPDP Act 2023:</strong> Performing background verifications without legal authorization or written consent of the data principal constitutes a severe breach, subject to compliance penalties.
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary text-xs py-2.5 px-5">
                  Back to Details
                </button>
                <button type="submit" className="btn-primary text-xs py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 shadow-emerald-100">
                  <FileCheck className="h-4.5 w-4.5" /> Submit Vetting Request
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Instructions Panel */}
        <div className="space-y-4">
          <div className="card p-6 bg-gradient-to-br from-slate-900 to-primary text-white border-0 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent" />
            <ShieldAlert className="h-8 w-8 text-accent mb-3 relative z-10" />
            <h3 className="text-sm font-extrabold font-heading uppercase tracking-wider relative z-10">Secure Disclosure Protocol</h3>
            <p className="text-[11px] text-slate-350 leading-relaxed mt-2 relative z-10 font-medium">
              To guarantee constitutional privacy, the register operates under a strict binary disclosure system.
            </p>
            <p className="text-[11px] text-slate-350 leading-relaxed mt-2 relative z-10 font-medium">
              Vetting requests return only <strong className="text-white">CLEARED</strong> (no match identified) or <strong className="text-white">REJECTED</strong> (held for senior DSP desk analysis). Offender registers are never public.
            </p>
          </div>

          <div className="card p-6 space-y-4 bg-white">
            <h4 className="font-extrabold text-primary font-heading text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Hiring Guidelines</h4>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-800">Verify Identity First</span>
                <p className="text-[10px] text-slate-455 font-medium leading-normal mt-0.5">Ensure physical credentials match the digital ID submission before generating requests.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-800">Processing Window</span>
                <p className="text-[10px] text-slate-455 font-medium leading-normal mt-0.5">Standard background verifications are synced and resolved within 24-48 hours.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmitVerification;
