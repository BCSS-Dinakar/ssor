import { X, Link as LinkIcon } from 'lucide-react';
import { TIERS } from '../../utils/data/portalData';
import { TierChip, StatusPill } from './Badges';

function Detail({ label, value, mono }) {
  return (
    <div>
      <div className="text-sm uppercase tracking-wider text-muted mb-1">{label}</div>
      <div className={`text-base text-primary font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

function RecordModal({ record, onClose, onFlag }) {
  if (!record) return null;
  const tier = TIERS[record.tier];

  return (
    <div
      className="fixed inset-0 z-[100] bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-none max-w-2xl w-full max-h-[88vh] overflow-auto shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-primary font-heading">{record.name}</h3>
              <TierChip tier={record.tier} />
            </div>
            <div className="text-sm font-bold font-mono text-slate-400 mt-1 uppercase">{record.id} · {record.cc} · {record.ps}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-none border border-gray-200 flex items-center justify-center text-muted hover:bg-gray-50 transition-colors" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid sm:grid-cols-2 gap-5 mb-6">
            <Detail label="Risk classification" value={`${tier.name} — ${tier.category}`} />
            
            <Detail label="Legal Status" value={
              <span className={`inline-flex items-center px-2 py-0.5 rounded-none border text-xs font-bold uppercase tracking-wider ${record.legalStatus === 'Convicted' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {record.legalStatus || 'Convicted'}
              </span>
            } />
            <Detail label="Status" value={<StatusPill status={record.status} />} />

            <Detail label="Offence of conviction" value={record.offence} />
            <Detail label="Age" value={record.age} />
            <Detail label="Area / jurisdiction" value={`${record.area} · ${record.ps}`} />
            <Detail label="Date of conviction" value={record.conv} mono />
            <Detail label="Retention period" value={record.retention} />
            <Detail label="Next review" value={record.review} mono />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-none p-4 mb-5">
            <div className="text-sm uppercase tracking-wider text-slate-500 font-bold mb-2">Statutory basis</div>
            <div className="flex flex-wrap gap-2">
              {tier.sections.map((s) => (
                <span key={s} className="font-mono text-xs font-bold text-secondary bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-none uppercase">{s}</span>
              ))}
            </div>
          </div>

          <Detail label="Biometric identification" value="Fingerprints on file · positive ID required for any operational action" />

          {/* Linked Offenders (MoM Requirement 3.3) */}
          <div className="bg-slate-50 border border-slate-200 rounded-none p-4 mb-5 mt-5">
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="h-4 w-4 text-slate-500" />
              <h4 className="text-sm font-bold font-heading text-slate-800 uppercase tracking-wider">Linked Offenders / Network</h4>
            </div>
            {record.legalStatus === 'Convicted' ? (
              <div className="text-base text-slate-600 italic">No identified accomplices in this case.</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white p-2.5 border border-slate-200 rounded-none text-base">
                  <span className="font-semibold text-primary">T. Suresh Kumar (Co-accused)</span>
                  <span className="text-sm font-mono font-bold text-slate-400">SOR-2026-0922</span>
                </div>
                <div className="flex items-center justify-between bg-white p-2.5 border border-slate-200 rounded-none text-base">
                  <span className="font-semibold text-primary">IP: 182.44.X.X (Cyber Link)</span>
                  <span className="text-sm font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 border border-amber-200">Pending</span>
                </div>
              </div>
            )}
          </div>

        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={() => alert('Disclosure Request initiated: Disclosure of offender details to a named guardian requires formal DSP-level approval under Section 8 of the Concept Note.')}
            className="text-sm font-bold px-4 py-2.5 rounded-none border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors uppercase tracking-wider"
          >
            Raise disclosure
          </button>
          <button onClick={onClose} className="btn-secondary py-2.5 px-5 text-sm font-bold rounded-none uppercase tracking-wider border-slate-300">Close</button>
          {onFlag && (
            <button onClick={() => onFlag(record)} className="btn-primary py-2.5 px-5 text-sm font-bold rounded-none uppercase tracking-wider">Flag for review</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecordModal;
