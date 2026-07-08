import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Shield, FileText, Fingerprint, MapPin } from 'lucide-react';
import { TIERS, SEED_OFFENDERS } from '../../../utils/data/portalData';
import { TierChip, StatusPill } from '../../../components/portal/Badges';
import PageHeader from '../../../components/portal/PageHeader';

function DetailRow({ label, value, mono }) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1">{label}</div>
      <div className={`text-xs text-slate-700 font-bold ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}

function OffenderDetail() {
  const { id } = useParams();
  const record = SEED_OFFENDERS.find(r => r.id === id);
  const [activeTab, setActiveTab] = useState('profile');

  if (!record) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold">
        Record not found. <Link to="/portal/register" className="text-blue-600 underline">Back to register</Link>
      </div>
    );
  }

  const tier = TIERS[record.tier];

  const tabs = [
    { id: 'profile', label: 'Demographics & Address', icon: User },
    { id: 'physical', label: 'Physical Traits & Moles', icon: Fingerprint },
    { id: 'case', label: 'Case Vetting Details', icon: FileText },
    { id: 'system', label: 'Registry Parameters', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10 font-body">
      <PageHeader
        crumb={`Administration / Register / ${record.id}`}
        title={record.name}
        subtitle={`${record.id} · CCTNS Case Ref: ${record.cc} · PS: ${record.ps}`}
        actions={
          <Link
            to="/portal/register"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-primary transition-all bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Register
          </Link>
        }
      />

      <div className="card p-6 bg-white border border-slate-200/80 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-primary to-secondary" />

        {/* Dossier Header Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-150 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold shrink-0 shadow-inner relative">
              <span className="text-xl text-slate-600">{(record.name || 'O').charAt(0)}</span>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-md bg-primary text-[8px] font-mono text-white">MUGSHOT</span>
            </div>
            <div>
              <h4 className="font-extrabold text-primary font-heading text-base uppercase tracking-wider">{record.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold">Telangana State Convicted Offenders Registry DB</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TierChip tier={record.tier} />
            <span className={`inline-flex px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${record.legalStatus === 'Convicted' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {record.legalStatus || 'Convicted'}
            </span>
            <StatusPill status={record.status} />
          </div>
        </div>

        {/* Dossier Tabs */}
        <div className="flex border-b border-slate-150 mb-6 overflow-x-auto gap-2 scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4.5 py-3 border-b-2 font-heading font-black text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${
                  active
                    ? 'border-secondary text-secondary font-black'
                    : 'border-transparent text-slate-455 hover:text-primary hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[250px]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailRow label="First Name / Given Name" value={record.name.split(' ').slice(1).join(' ')} />
                <DetailRow label="Surname" value={record.name.split(' ')[0]} />
                <DetailRow label="Alias Name (alias)" value={record.alias} />
                <DetailRow label="Current Age (age)" value={`${record.age} Years`} />
                <DetailRow label="Caste (caste)" value={record.caste} />
                <DetailRow label="Sub-Caste (sub_caste)" value={record.subCaste} />
                <DetailRow label="Nationality (nationality)" value={record.nationality} />
                <DetailRow label="Religion (religion)" value={record.religion} />
                <DetailRow label="Education (education_qualification)" value={record.education} />
                <DetailRow label="Occupation (occupation)" value={record.occupation} />
                <DetailRow label="Place of Work (place_of_work)" value={record.placeOfWork} />
                <DetailRow label="Relative Name (relative_name)" value={record.relativeName} />
                <DetailRow label="Relation Type (relation_type)" value={record.relationType} />
                <DetailRow label="Email ID (contact_email_id)" value={record.email} mono />
                <DetailRow label="Phone Number (contact_phone_number)" value={record.phone} mono />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Present Address (pa_*)
                </div>
                <div className="text-xs font-bold text-slate-700 leading-relaxed">
                  {record.address}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'physical' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailRow label="Height Profile (pf_height)" value={record.height} />
                <DetailRow label="Body Build (pf_build)" value={record.build} />
                <DetailRow label="Complexion / Color (pf_color)" value={record.complexion} />
                <DetailRow label="Iris Color (pf_eyes)" value={record.eyes} />
                <DetailRow label="Hair Type (pf_hair)" value={record.hair} />
                <DetailRow label="Beard Profile (pf_beard)" value={record.beard} />
                <DetailRow label="Mustache Profile (pf_mustache)" value={record.mustache} />
                <DetailRow label="Face Shape (pf_face)" value={record.face} />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1.5">
                  Distinctive Marks & Moles (pf_mole / pf_leucoderma)
                </div>
                <div className="text-xs font-bold text-slate-700 leading-relaxed">
                  {record.identifications}
                </div>
              </div>
              <div className="p-4 bg-emerald-50/50 border border-emerald-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs font-bold text-slate-650">
                  <strong className="text-emerald-700 block text-[9px] uppercase tracking-widest mb-0.5">Biometric Status</strong>
                  Digital fingerprints class, DNA registry file, and iris mapping verified. PCN sync completed.
                </div>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shrink-0">BIOMETRICS SECURED</span>
              </div>
            </div>
          )}

          {activeTab === 'case' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailRow label="CCTNS Case Ref (cc)" value={record.cc} />
                <DetailRow label="FIR Reference (firNo)" value={record.firNo} />
                <DetailRow label="FIR Registration Date" value={record.firDate} mono />
                <DetailRow label="Crime ID Vetting Ref" value={`CRM-${record.id.split('-')[2]}`} mono />
                <DetailRow label="Jurisdiction PS (ps)" value={record.ps} />
                <DetailRow label="Date of Conviction (conv)" value={record.conv} mono />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1">
                  Court of Conviction
                </div>
                <div className="text-xs font-bold text-slate-700 font-heading">
                  {record.courtName || 'Sessions & POCSO Special Court, Cyberabad'}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1">
                  Modus Operandi & Case History Brief (ir_modus_operandi)
                </div>
                <div className="text-xs font-medium text-slate-600 leading-relaxed font-body">
                  {record.briefFacts || 'The accused was convicted under statutory child safety guidelines. Details include verified physical forensics, digital communication evidence logs, and chargesheet sections.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailRow label="Registry Retention Period" value={record.retention} />
                <DetailRow label="Next Audit Checkpoint" value={record.review} mono />
                <DetailRow label="Clearance Level Tier" value={`${tier.name} Tier (${tier.category})`} />
                <DetailRow label="Legal Record Status" value={record.status.toUpperCase()} />
                <DetailRow label="Last CCTNS Sync" value="2026-07-06 04:30 AM" mono />
                <DetailRow label="System Registry ID" value={record.id} mono />
              </div>

              {/* Statutory sections */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-2">Statutory Legal Penal Sections</div>
                <div className="flex flex-wrap gap-1.5">
                  {tier.sections.map((s) => (
                    <span key={s} className="font-mono text-[9px] font-bold text-secondary bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-xl uppercase">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Operational Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-8">
          <button
            onClick={() => alert('Disclosure Request initiated: Manual case routing to DSP desk for formal approval details.')}
            className="text-[10px] font-black px-4.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all uppercase tracking-wider"
          >
            Initiate Disclosure File
          </button>
          <button 
            onClick={() => alert('Dossier flagged for retention review board.')}
            className="btn-primary py-2.5 px-5 text-[10px] font-black rounded-xl uppercase tracking-wider shadow-lg"
          >
            Flag for Review
          </button>
        </div>
      </div>
    </div>
  );
}

export default OffenderDetail;
