import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, Info, Calendar, User, Phone, ArrowRight } from 'lucide-react';
import { Field, inputClass, FeedbackBanner } from '../../../components/portal/FormControls';
import { organizationApi } from '../../../api/organization.api';
import { ORG_TYPES } from '../../../utils/data/authData';
import SearchableSelect from '../../../components/SearchableSelect';

const empty = { candidate: '', fatherName: '', dob: '', phone: '', role: '', type: 'School', consent: false };

function SubmitVerification() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [alert, setAlert] = useState(null);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.candidate.trim() || !form.dob || !form.phone.trim() || !form.role.trim()) {
      return setAlert({ type: 'error', message: 'Candidate name, DOB, Phone Number, and designated role are required.' });
    }
    if (!form.consent) {
      return setAlert({ type: 'error', message: 'Candidate explicit consent must be confirmed before submitting.' });
    }

    setLoading(true);
    setAlert(null);
    try {
      const data = await organizationApi.submitVerification(form);
      setSubmittedRecord(data.verification);
      setForm(empty);
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: err.response?.data?.message || 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Success Receipt State
  // -------------------------------------------------------------
  if (submittedRecord) {
    return (
      <div className="animate-fadeIn -mx-4 sm:-mx-6 lg:-mx-8 -my-6 min-h-[calc(100vh-80px)] bg-slate-50 flex items-center justify-center p-4">
        <div className="card w-full max-w-xl space-y-8 p-10 border border-emerald-100 shadow-2xl bg-white relative overflow-hidden rounded-3xl">
          {/* Top aesthetic border */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-400" />

          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="text-center space-y-3">
            <h3 className="text-2xl font-black text-slate-800 font-heading">Vetting Request Generated</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-semibold">
              Your application has been securely logged into the state police registry for active investigation.
            </p>
          </div>

          {/* Receipt Panel */}
          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-slate-50/50 overflow-hidden shadow-inner text-sm">
            {[
              ['Reference ID', submittedRecord.id, 'font-mono text-secondary font-bold text-xs'],
              ['Candidate Name', submittedRecord.candidateName, 'text-slate-800 font-bold'],
              ['Designated Role', submittedRecord.role, 'text-slate-800 font-bold'],
              ['Vetting Queue Status', 'Under Police Review', 'text-amber-600 font-black animate-pulse'],
              ['Estimated Vetting Window', 'Within 24-48 Hours', 'text-slate-600 font-medium'],
            ].map(([label, value, cls]) => (
              <div key={label} className="flex justify-between p-4 items-center">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{label}</span>
                <strong className={`text-right ${cls}`}>{value}</strong>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button onClick={() => navigate(`/portal/track/${submittedRecord.id}`)} className="btn-primary py-3.5 px-8 justify-center shadow-lg shadow-primary/20">
              Track Live Status <ArrowRight className="h-5 w-5 ml-1" />
            </button>
            <button onClick={() => setSubmittedRecord(null)} className="btn-secondary py-3.5 px-8 justify-center">
              Register Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Single Form State
  // -------------------------------------------------------------
  return (
    <div className="animate-fadeIn -mx-4 sm:-mx-6 lg:-mx-8 -my-6 h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-[#F8F9FA] overflow-hidden">

      {/* Left Pane: Info & Tracker */}
      <div className="w-full lg:w-[380px] shrink-0 bg-gradient-to-br from-slate-900 to-primary text-white p-8 flex flex-col relative overflow-hidden border-r border-slate-800 shadow-2xl z-10 hidden lg:flex">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent" />

        <div className="relative z-10 flex-grow">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/20 backdrop-blur-sm shadow-inner">
            <ShieldAlert className="h-6 w-6 text-accent" />
          </div>
          <h2 className="text-2xl font-black font-heading leading-tight mb-2">Verify New<br />Candidate</h2>
          <p className="text-xs text-slate-350 font-medium leading-relaxed max-w-[280px]">
            Submit staff or volunteer details for background vetting against the State Sexual Offender Register.
          </p>

          <div className="mt-12 space-y-6 bg-white/5 p-5 rounded-2xl border border-white/10">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-accent border-b border-white/10 pb-2 mb-4">Secure Disclosure Protocol</h3>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              To guarantee constitutional privacy, the register operates under a strict binary disclosure system.
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium mt-3">
              Vetting requests return only <strong className="text-white bg-white/10 px-1 py-0.5 rounded">CLEARED</strong> (no match identified) or <strong className="text-white bg-white/10 px-1 py-0.5 rounded">REJECTED</strong> (held for senior DSP desk analysis). Offender registers are never public.
            </p>
          </div>
        </div>

        {/* Footer Info in Left Pane */}
        <div className="relative z-10 pt-8 border-t border-white/10 mt-8 space-y-4">
          <div className="flex gap-3 items-start text-white/70">
            <Info className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" />
            <p className="text-[10px] leading-relaxed font-medium">Standard background verifications are synced and resolved within 24-48 hours. Registers are strictly non-public.</p>
          </div>
        </div>
      </div>

      {/* Right Pane: Interactive Form Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12 flex flex-col items-center relative">
        <div className="w-full max-w-3xl">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden mb-8 text-center space-y-2">
            <h2 className="text-xl font-black text-slate-800 font-heading">Verify New Candidate</h2>
            <p className="text-xs text-slate-500">Submit Application</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 p-6 sm:p-10 transition-all duration-500 relative overflow-hidden">

            <FeedbackBanner type={alert?.type} message={alert?.message} />

            <form onSubmit={submit} className="space-y-8 animate-fadeIn">

              {/* Section 1: Demographics */}
              <div>
                <div className="border-b border-slate-100 pb-3 mb-5">
                  <h3 className="font-extrabold text-primary font-heading text-lg">Candidate Registry</h3>
                  <p className="text-xs text-slate-455 font-bold mt-1">Vetting credentials must match official state documents exactly.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Candidate Full Name" required>
                    <div className="relative">
                      <User className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input className={inputClass + ' pl-10'} value={form.candidate} onChange={set('candidate')} placeholder="e.g. John Doe" required />
                    </div>
                  </Field>

                  <Field label="Father's Name" hint="Optional. Including father's name improves background check accuracy.">
                    <div className="relative">
                      <User className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input className={inputClass + ' pl-10'} value={form.fatherName} onChange={set('fatherName')} placeholder="e.g. Richard Doe" />
                    </div>
                  </Field>

                  <Field label="Date of Birth" required hint="Used for cross-matching demographic records.">
                    <div className="relative">
                      <Calendar className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input className={inputClass + ' pl-10'} type="date" value={form.dob} onChange={set('dob')} required />
                    </div>
                  </Field>

                  <Field label="Sensitive Role Vetted" required hint="E.g. School Bus Driver, Auxiliary Ayah, Sports Coach.">
                    <input className={inputClass} value={form.role} onChange={set('role')} placeholder="e.g. Caregiver, School Bus Driver" required />
                  </Field>

                  <Field label="Contact Phone Number" required hint="Candidate direct mobile number.">
                    <div className="relative">
                      <Phone className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input className={inputClass + ' pl-10'} value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" required />
                    </div>
                  </Field>

                  <Field label="Vetting Institution Category">
                    <SearchableSelect
                      value={form.type}
                      onChange={(val) => setForm({ ...form, type: val })}
                      options={ORG_TYPES}
                      placeholder="Select Category"
                    />
                  </Field>
                </div>
              </div>

              {/* Section 2: Consent */}
              <div>
                <div className="border-b border-slate-100 pb-3 mb-5">
                  <h3 className="font-extrabold text-primary font-heading text-lg">Statutory Consent Declaration</h3>
                  <p className="text-xs text-slate-455 font-bold mt-1">Required compliance verification under Telangana State Acts.</p>
                </div>

                <div className="p-6 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-6 shadow-sm">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={form.consent}
                        onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                        className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-amber-300 bg-white transition-all checked:border-secondary checked:bg-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:ring-offset-1"
                      />
                      <CheckCircle2 className="pointer-events-none absolute h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">Mandatory Candidate Vetting Consent</span>
                      <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed font-medium">
                        I confirm that this institution holds a signed, explicit consent letter from <strong className="text-primary font-black bg-white px-1.5 py-0.5 rounded border border-slate-200">{form.candidate || 'the candidate'}</strong> authorizing the State Police to match their demographics against the conviction-based Sexual Offender Register.
                      </p>
                    </div>
                  </label>

                  <div className="text-[10px] sm:text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed font-semibold flex gap-3 items-start">
                    <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <p><strong>Notice under DPDP Act 2023:</strong> Performing background verifications without legal authorization or written consent of the data principal constitutes a severe breach, subject to compliance penalties.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button type="submit" className="btn-primary py-3.5 px-8 shadow-lg shadow-primary/20 text-sm w-full sm:w-auto justify-center" disabled={loading}>
                  {loading ? 'Submitting Application...' : 'Submit Verification Request'}
                  {!loading && <CheckCircle2 className="h-5 w-5 ml-2" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmitVerification;
