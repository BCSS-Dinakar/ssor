import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, ArrowRight, DownloadCloud } from 'lucide-react';
import { Field, inputClass, FeedbackBanner } from '../../../components/portal/FormControls';
import { organizationApi } from '../../../api/organization.api';
import { ORG_TYPES } from '../../../utils/data/authData';
import SearchableSelect from '../../../components/SearchableSelect';
import { useToast } from '../../../components/ui/Toast';

const empty = { candidate: '', fatherName: '', dob: '', phone: '', role: '', type: 'School', consent: false, aadharNumber: '', candidateImage: null, consentFile: null };

function SubmitVerification() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(empty);
  const [alert, setAlert] = useState(null);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.candidate.trim() || !form.dob || !form.phone.trim() || !form.role.trim() || !form.aadharNumber.trim()) {
      return setAlert({ type: 'error', message: 'Candidate name, DOB, Phone Number, Aadhar, and designated role are required.' });
    }
    if (!form.consent) {
      return setAlert({ type: 'error', message: 'Candidate explicit consent must be confirmed before submitting.' });
    }
    if (!form.consentFile) {
      return setAlert({ type: 'error', message: 'Signed consent document must be uploaded.' });
    }

    setLoading(true);
    setAlert(null);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null) {
          formData.append(key, form[key]);
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
      const data = {
        candidate: form.candidate,
        fatherName: form.fatherName,
        dob: form.dob,
        aadharNumber: form.aadharNumber,
        phone: form.phone,
        role: form.role
      };

      const blob = await organizationApi.generateConsentTemplate(data);
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
            <p className="text-base text-slate-500 max-w-sm mx-auto leading-relaxed font-semibold">
              Your application has been securely logged into the state police registry for active investigation.
            </p>
          </div>

          {/* Receipt Panel */}
          <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-slate-50/50 overflow-hidden shadow-inner text-base">
            {[
              ['Reference ID', submittedRecord.id, 'font-mono text-secondary font-bold text-sm'],
              ['Candidate Name', submittedRecord.candidateName, 'text-slate-800 font-bold'],
              ['Designated Role', submittedRecord.role, 'text-slate-800 font-bold'],
              ['Vetting Queue Status', 'Under Police Review', 'text-amber-600 font-black animate-pulse'],
              ['Estimated Vetting Window', 'Within 24-48 Hours', 'text-slate-600 font-medium'],
            ].map(([label, value, cls]) => (
              <div key={label} className="flex justify-between p-4 items-center">
                <span className="text-slate-400 font-bold tracking-wide text-sm">{label}</span>
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
  return (
    <div className="space-y-6 w-full animate-fadeIn pb-10">

      {/* Header Section */}
      <div className="mb-6 border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-800 font-heading">Verify New Candidate</h2>
        <p className="text-base text-slate-500 mt-1">
          Submit candidate details for formal background vetting against the State Sexual Offender Register.
        </p>
      </div>

      <FeedbackBanner type={alert?.type} message={alert?.message} />

      <form onSubmit={submit} className="space-y-10">

        {/* Section 1: Demographics */}
        <div>
          <h3 className="font-bold text-slate-800 text-lg mb-4">Candidate Registry</h3>
          <p className="text-sm text-slate-500 mb-6 -mt-3">Credentials must match official state documents exactly.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-6">
            <Field label="Candidate Full Name" required>
              <input className={inputClass} value={form.candidate} onChange={set('candidate')} placeholder="e.g. John Doe" required />
            </Field>

            <Field label="Father's Name" hint="Optional but improves check accuracy.">
              <input className={inputClass} value={form.fatherName} onChange={set('fatherName')} placeholder="e.g. Richard Doe" />
            </Field>

            <Field label="Date of Birth" required hint="Used for cross-matching records.">
              <input className={inputClass} type="date" value={form.dob} onChange={set('dob')} required />
            </Field>

            <Field label="Sensitive Role Vetted" required hint="E.g. School Bus Driver.">
              <input className={inputClass} value={form.role} onChange={set('role')} placeholder="e.g. Caregiver" required />
            </Field>

            <Field label="Contact Phone Number" required hint="10-digit mobile number.">
              <input className={inputClass} value={form.phone} onChange={set('phone')} placeholder="e.g. 9876543210" required />
            </Field>

            <Field label="Institution Category">
              <SearchableSelect
                value={form.type}
                onChange={(val) => setForm({ ...form, type: val })}
                options={ORG_TYPES}
                placeholder="Select Category"
              />
            </Field>

            <Field label="Aadhar Number" required hint="12-digit UIDAI Number.">
              <input className={inputClass} value={form.aadharNumber} onChange={set('aadharNumber')} placeholder="1234 5678 9012" required />
            </Field>

            <Field label="Candidate Image" required hint="Recent passport size photograph.">
              <input
                id="candidateImageInput"
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, candidateImage: e.target.files[0] })}
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all cursor-pointer border border-slate-200 rounded-lg p-1"
                required
              />
            </Field>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Section 2: Consent */}
        <div>
          <h3 className="font-bold text-slate-800 text-lg mb-4">Statutory Consent Declaration</h3>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-6 max-w-4xl">

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 bg-white transition-all checked:border-primary checked:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <CheckCircle2 className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
              </div>
              <div className="space-y-1">
                <span className="text-base font-bold text-slate-800">I Agree to the Mandatory Candidate Vetting Consent</span>
                <p className="text-sm text-slate-600 leading-relaxed">
                  I confirm that this institution holds a signed, explicit consent letter from the candidate authorizing the Telangana State Police to match their demographics against the conviction-based Sexual Offender Register.
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
                  className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all cursor-pointer border border-slate-200 rounded-lg p-1 bg-white"
                  required
                />
              </div>

              <div className="flex-1 flex flex-col items-start justify-center">
                <span className="block text-sm font-bold text-slate-700 mb-2">Download Consent form</span>
                <button type="button" onClick={generateConsentForm} className="inline-flex justify-center items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg border border-slate-300 transition-all shadow-sm">
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
