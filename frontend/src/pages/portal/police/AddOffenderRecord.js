import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import PageHeader from '../../../components/portal/PageHeader';
import SecurityBanner from '../../../components/portal/SecurityBanner';
import { Field, inputClass, FeedbackBanner } from '../../../components/portal/FormControls';
import { useData } from '../../../context/DataContext';
import { TIERS } from '../../../utils/data/portalData';

const empty = { name: '', age: '', area: '', ps: '', offence: '', tier: 'red', cc: '' };

function AddOffenderRecord() {
  const { addOffender } = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [alert, setAlert] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.area.trim() || !form.offence.trim()) {
      return setAlert({ type: 'error', message: 'Name, area and offence are required.' });
    }
    if (!form.cc.trim()) {
      return setAlert({ type: 'error', message: 'A record cannot be entered without a conviction order reference.' });
    }
    const rec = addOffender(form);
    setAlert({ type: 'success', message: `${rec.id} added under ${TIERS[form.tier].name} tier. Redirecting to register…` });
    setForm(empty);
    setTimeout(() => navigate('/portal/register'), 1200);
    return undefined;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <PageHeader
        crumb="Administration / New registration"
        title="Register a convicted offender"
        subtitle="Entry is permitted only after conviction. A conviction order reference is mandatory."
      />

      <SecurityBanner>
        Conviction-based entry only. Without a valid conviction order reference, this record cannot be saved to the disclosable register.
      </SecurityBanner>

      <form onSubmit={submit} className="card p-6 max-w-3xl bg-white border border-slate-200/80 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-primary to-secondary" />
        <FeedbackBanner type={alert?.type} message={alert?.message} />
        
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Offender name" required hint="Full official name.">
            <input className={inputClass} value={form.name} onChange={set('name')} placeholder="Full name" />
          </Field>
          <Field label="Age" hint="Years on registration date.">
            <input className={inputClass} type="number" value={form.age} onChange={set('age')} placeholder="e.g. 34" />
          </Field>
          <Field label="Area / jurisdiction" required hint="Current residence zone.">
            <input className={inputClass} value={form.area} onChange={set('area')} placeholder="e.g. Miyapur" />
          </Field>
          <Field label="Police station" hint="Local police jurisdiction.">
            <input className={inputClass} value={form.ps} onChange={set('ps')} placeholder="e.g. Miyapur PS" />
          </Field>
          <Field label="Offence of conviction" required className="sm:col-span-2" hint="Specific legal offence description.">
            <input className={inputClass} value={form.offence} onChange={set('offence')} placeholder="e.g. Aggravated penetrative sexual assault" />
          </Field>
          <Field label="Risk tier" required hint="Determines statutory retention.">
            <select className={inputClass} value={form.tier} onChange={set('tier')}>
              {Object.keys(TIERS).map((t) => (
                <option key={t} value={t}>{TIERS[t].name} — {TIERS[t].category}</option>
              ))}
            </select>
          </Field>
          <Field label="Conviction order reference" required hint="Retention is set automatically from the tier.">
            <input className={inputClass} value={form.cc} onChange={set('cc')} placeholder="e.g. CC 412/2024" />
          </Field>
        </div>
        
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button type="submit" className="btn-primary py-3 px-6 text-xs font-black rounded-xl uppercase tracking-wider shadow-lg">
            <Save className="h-4.5 w-4.5" />
            Save to register
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddOffenderRecord;
