import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Shield, FileText, Fingerprint, Loader2, Info, CheckCircle2, Activity, Users, Home, Database } from 'lucide-react';
import { TIERS } from '../../../utils/data/portalData';
import { TierChip } from '../../../components/portal/Badges';
import PageHeader from '../../../components/portal/PageHeader';
import { policeApi } from '../../../api/police.api';

function DetailRow({ label, value, mono, span2 }) {
  const displayValue = (value === 'N/A' || !value) ? '-' : value;

  return (
    <div className={`p-3 bg-slate-50 border border-slate-150 rounded-xl ${span2 ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1 flex items-center gap-1.5 break-words">
        {label}
      </div>
      <div className={`text-xs text-slate-700 font-bold break-words ${mono ? 'font-mono text-[10px]' : ''}`}>{displayValue}</div>
    </div>
  );
}

function SectionHeading({ title, icon: Icon, badge }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 mt-8 pb-3 border-b border-slate-100">
      <Icon className="w-4 h-4 text-secondary" />
      <h3 className="font-heading font-black text-primary text-base uppercase tracking-wider">{title}</h3>
      {badge && <span className="ml-2 px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-wider rounded-md border border-slate-200">{badge}</span>}
    </div>
  );
}

function DynamicDataGrid({ data }) {
  if (!data || Object.keys(data).length === 0) return <DetailRow label="Status" value="No records found in database" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Object.entries(data).map(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').toUpperCase();
        const stringValue = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : String(value);
        const isLongText = stringValue.length > 50;

        return <DetailRow key={key} label={formattedKey} value={stringValue} span2={isLongText} />;
      })}
    </div>
  );
}

function DynamicArrayList({ items, title, icon }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <SectionHeading title={title} icon={icon} badge="0 RECORDS" />
        <DetailRow label="Database Check" value="No entries found in this table." />
      </div>
    );
  }

  return (
    <div>
      <SectionHeading title={title} icon={icon} badge={`${items.length} RECORD(S)`} />
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="p-4 bg-white border border-slate-200 rounded-xl relative shadow-sm">
            <div className="absolute top-4 right-4 px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[9px] font-black border border-slate-200">
              SEQ {index + 1}
            </div>
            <DynamicDataGrid data={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

function OffenderDetail() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('demographics');

  const fetchRecord = useCallback(async () => {
    try {
      setLoading(true);
      const res = await policeApi.getOffenderById(id);
      if (res && res.success) {
        setRecord(res.data);
      } else {
        setRecord(null);
      }
    } catch (error) {
      console.error('Failed to fetch offender details:', error);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 animate-fadeIn">
        <Loader2 className="w-12 h-12 text-secondary animate-spin mb-4" />
        <span className="text-slate-500 font-bold tracking-widest uppercase text-sm animate-pulse">Fetching Classified Dossier...</span>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold animate-fadeIn">
        <div className="mb-4">No matching record found in the materialized database.</div>
        <Link to="/portal/register" className="text-blue-600 underline hover:text-blue-800 transition-colors">Back to Registry Database</Link>
      </div>
    );
  }

  const p = record.person_details || {};
  const fName = p.full_name && p.full_name !== 'N/A'
    ? p.full_name
    : `${p.name !== 'N/A' ? p.name : ''} ${p.surname !== 'N/A' ? p.surname : ''}`.trim() || 'UNKNOWN';

  const tier = TIERS[record.highest_risk_tier?.toLowerCase()] || TIERS['orange'];

  const tabs = [
    { id: 'demographics', label: 'Person Details', icon: User },
    { id: 'physical', label: 'Physical Features', icon: Fingerprint },
    { id: 'fpb', label: 'Fingerprint Bureau', icon: Database },
    { id: 'legal', label: 'Legal History', icon: FileText },
    { id: 'intel', label: 'Intel & Interrogation', icon: Activity },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10 font-body">
      <PageHeader
        crumb={`Administration / Register / ${record.offender_id}`}
        title="Offender Dossier"
        actions={
          <Link
            to="/portal/register"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-primary transition-all bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Register
          </Link>
        }
      />

      <div className="card p-6 bg-white border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden rounded-2xl">
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-200 to-slate-200`} style={{ backgroundImage: `linear-gradient(to right, ${tier.color ? tier.color.replace('text-', '') : '#1e3a8a'}, #1e3a8a, #4f46e5)` }} />

        {/* Dossier Header Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 mt-2 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold shrink-0 shadow-inner relative">
              <span className="text-2xl text-slate-600">{(fName || 'O').charAt(0).toUpperCase()}</span>
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-lg bg-slate-800 text-[8px] font-mono text-white shadow-md border border-slate-600">MUGSHOT</span>
            </div>
            <div>
              <h4 className="font-black text-primary font-heading text-lg uppercase tracking-wider">{fName}</h4>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <p className="text-[11px] text-slate-400 font-bold tracking-wide flex items-center gap-1.5">ID: <span className="font-mono text-secondary">{record.offender_id}</span></p>
                <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></span>
                <p className="text-[11px] text-slate-400 font-bold tracking-wide">Alias: {(p.alias === 'N/A' || !p.alias) ? '-' : p.alias}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TierChip tier={record.highest_risk_tier?.toLowerCase()} />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-wider">Verified DB Sync</span>
            </div>
          </div>
        </div>

        {/* Dossier Tabs */}
        <div className="flex border-b border-slate-100 mb-8 overflow-x-auto gap-2 scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3.5 border-b-2 font-heading font-black text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${active
                    ? 'border-secondary text-secondary font-black bg-slate-50/50 rounded-t-xl'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200 hover:bg-slate-50/30 rounded-t-xl'
                  }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-secondary' : 'text-slate-400'}`} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content Panels */}
        <div className="min-h-[400px]">

          {/* Demographics Tab */}
          {activeTab === 'demographics' && (
            <div className="space-y-6 animate-fadeIn">
              <SectionHeading title="Complete Person Details Table" icon={User} badge="RAW JSON" />
              <DynamicDataGrid data={record.person_details} />
            </div>
          )}

          {/* Physical Features Tab */}
          {activeTab === 'physical' && (
            <div className="space-y-6 animate-fadeIn">
              <SectionHeading title="Latest Physical Features Table" icon={Fingerprint} badge="RAW JSON" />
              <DynamicDataGrid data={record.latest_physical_features} />
            </div>
          )}

          {/* Fingerprint Bureau Tab */}
          {activeTab === 'fpb' && (
            <div className="space-y-6 animate-fadeIn">
              <DynamicArrayList items={record.fingerprint_bureau_records} title="Fingerprint Bureau Records" icon={Database} />
            </div>
          )}

          {/* Legal History Tab */}
          {activeTab === 'legal' && (
            <div className="space-y-12 animate-fadeIn">
              <DynamicArrayList items={record.crimes} title="Crimes Table" icon={FileText} />
              <hr className="border-slate-100" />
              <DynamicArrayList items={record.arrests} title="Arrests Table" icon={Shield} />
              <hr className="border-slate-100" />
              <DynamicArrayList items={record.chargesheets} title="Chargesheets Table" icon={FileText} />
            </div>
          )}

          {/* Intel & Interrogation Tab */}
          {activeTab === 'intel' && (
            <div className="space-y-12 animate-fadeIn">
              <DynamicArrayList items={record.interrogation_reports} title="Interrogation Reports Table" icon={Info} />
              <hr className="border-slate-100" />
              <DynamicArrayList items={record.modus_operandi} title="Modus Operandi Table" icon={Activity} />
              <hr className="border-slate-100" />
              <DynamicArrayList items={record.family_history} title="Family History Table" icon={Users} />
              <hr className="border-slate-100" />
              <DynamicArrayList items={record.local_contacts} title="Local Contacts Table" icon={Home} />
              <hr className="border-slate-100" />
              <DynamicArrayList items={record.regular_habits} title="Regular Habits Table" icon={Activity} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default OffenderDetail;
