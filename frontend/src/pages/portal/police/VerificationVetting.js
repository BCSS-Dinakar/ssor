import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, FileText, User, Building, Loader2, ShieldAlert, Check, Eye, AlertOctagon, X, Fingerprint, Database, Search } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import PageHeader from '../../../components/portal/PageHeader';
import { StatusPill } from '../../../components/portal/Badges';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</div>
        <div className="text-sm text-slate-800 font-medium break-words mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-1">{label}</div>
      <div className={`text-xs text-slate-700 font-bold ${mono ? 'font-mono' : ''}`}>{value || '—'}</div>
    </div>
  );
}

function VerificationVetting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clearances, decideClearance, startVerifying } = useData();
  const record = clearances.find(c => c.id === id);

  // Vetting Workflow States
  const [checkState, setCheckState] = useState('idle'); // 'idle' | 'running' | 'done'
  const [activeLog, setActiveLog] = useState('');
  const [suspects, setSuspects] = useState([]);
  const [inspectSuspect, setInspectSuspect] = useState(null); // Selected suspect for detail modal
  const [confirmedSuspect, setConfirmedSuspect] = useState(null); // Suspect matched by officer
  const [activeSuspectTab, setActiveSuspectTab] = useState('profile');
  const [officerFeedback, setOfficerFeedback] = useState('');

  if (!record) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold">
        Request not found. <Link to="/portal/clearances" className="text-blue-600 underline">Back to list</Link>
      </div>
    );
  }

  // Check if we expect history based on status
  const hasHistory = record.status === 'rejected' || record.candidate.includes('Reddy') || record.candidate.includes('Bai');

  const startCriminalCheck = () => {
    setCheckState('running');
    startVerifying(record.id);
    setActiveLog('');
    setSuspects([]);
    setConfirmedSuspect(null);

    const logSequence = [
      { text: "Connecting to criminal databases...", delay: 0 },
      { text: "Verifying records...", delay: 700 },
      { text: "Processing identity parameters...", delay: 1400 },
      { text: "Connecting to active FIR cases...", delay: 2100 },
      { text: "Verifying and processing data...", delay: 2800 },
      { text: "Analysis completing, expecting results in 30 seconds...", delay: 3500 },
    ];

    logSequence.forEach((item) => {
      setTimeout(() => {
        setActiveLog(item.text);
      }, item.delay);
    });

    // Vetting completion logic
    setTimeout(() => {
      if (hasHistory) {
        setSuspects([
          {
            id: 'SOR-2024-0417',
            name: 'K. Surender Reddy',
            alias: 'Suri',
            age: 41,
            fatherName: 'K. Ramachandra Reddy',
            dob: '1983-05-12',
            caste: 'Reddy',
            subCaste: 'Goud-Reddy',
            religion: 'Hindu',
            nationality: 'Indian',
            education: 'Graduate (B.Com)',
            occupation: 'Real Estate Broker',
            placeOfWork: 'Hyderabad Metro Area',
            email: 'k.suri@example.com',
            phone: '+91 98480 22319',
            address: 'H.No: 8-2-310/A, Road No. 3, Banjara Hills, Hyderabad, Telangana - 500034',
            height: "5'9\"",
            build: 'Medium / Athletic',
            complexion: 'Wheatish',
            eyes: 'Dark Brown',
            hair: 'Short / Black',
            beard: 'Clean shaven',
            mustache: 'Thick',
            face: 'Oval',
            identifications: 'Scar on the right forearm, mole near the left cheekbone',
            firNo: 'FIR-104/2024 (Banjara Hills PS)',
            firDate: '2024-05-12',
            courtName: 'I Addl. District & Sessions Judge (POCSO Court), Cyberabad',
            offence: 'Aggravated penetrative assault on a minor',
            convDate: '2024-09-18'
          },
          {
            id: 'SOR-2023-0112',
            name: 'Ashok Reddy Goud',
            alias: 'Rao',
            age: 44,
            fatherName: 'A. Gopal Goud',
            dob: '1982-08-14',
            caste: 'Goud',
            subCaste: 'Goud-Shetty',
            religion: 'Hindu',
            nationality: 'Indian',
            education: 'Intermediate (12th)',
            occupation: 'Contractor',
            placeOfWork: 'Cyberabad Limits',
            email: 'ashok.goud@example.com',
            phone: '+91 94401 12388',
            address: 'H.No: 12-4/A, Kondapur Road, Serilingampally, Cyberabad, Telangana - 500084',
            height: "5'7\"",
            build: 'Heavyset',
            complexion: 'Dark',
            eyes: 'Black',
            hair: 'Bald patch / Black',
            beard: 'Beard trimmed',
            mustache: 'Thick',
            face: 'Round',
            identifications: 'Burn mark on left thigh, deep scar near forehead',
            firNo: 'FIR-88/2023 (Kondapur PS)',
            firDate: '2023-03-20',
            courtName: 'Special Sessions Judge (POCSO Act), Ranga Reddy',
            offence: 'Sexual harassment and stalking of minors',
            convDate: '2023-08-11'
          }
        ]);
        setCheckState('done');
      } else {
        setCheckState('done');
      }
    }, 4200);
  };

  const handleClear = () => {
    const reasonText = 'Candidate verified against Central Sex Offender Registry and CCTNS crime logs. Zero matching records identified. Clearance certificate officially granted.' + (officerFeedback ? `\n\nOfficer Notes: ${officerFeedback}` : '');
    decideClearance(
      record.id, 
      'cleared', 
      null, 
      reasonText
    );
    alert(`Clearance Issued. The requesting organization has been sent the digital certificate.`);
    navigate('/portal/clearances');
  };

  const handleReject = () => {
    if (!confirmedSuspect) return;
    const reasonText = `Identity matches registered offender profile: ${confirmedSuspect.name} (${confirmedSuspect.id}). Clearance request denied due to positive criminal register mapping.` + (officerFeedback ? `\n\nOfficer Notes: ${officerFeedback}` : '');
    decideClearance(
      record.id, 
      'rejected', 
      confirmedSuspect, 
      reasonText
    );
    alert(`Clearance Denied. The organization has been notified.`);
    navigate('/portal/clearances');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10 font-body relative">
      <PageHeader
        crumb={`Administration / Requests / Clearances / ${record.id}`}
        title={`Vetting Request: ${record.candidate}`}
        subtitle={`Submitted on ${record.submitted} by ${record.org}`}
        actions={
          <Link
            to="/portal/clearances"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-primary transition-all bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Link>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main workflow block */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Candidate Profile Details */}
          <div className="card p-6 bg-white border border-slate-200/80 shadow-md">
            <h3 className="font-extrabold text-primary font-heading text-xs uppercase tracking-wider mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" /> Candidate Vetting Profile
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              <InfoRow icon={User} label="Full Name" value={record.candidate} />
              <InfoRow icon={FileText} label="Identity Doc Reference" value="Aadhaar ID: xxxx-xxxx-4921 (Vetted)" />
              <InfoRow icon={User} label="Date of Birth Profile" value="1992-08-14" />
              <InfoRow icon={User} label="Gender" value="Male" />
              <InfoRow icon={Building} label="Requested Role/Seat" value={record.role} />
              <InfoRow icon={Building} label="Employer Station" value={record.org} />
            </div>
          </div>

          {(record.status === 'pending' || record.status === 'verifying') ? (
            /* Interactive Criminal Registry Checker */
            <div className="card p-6 bg-white border border-slate-200/80 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-primary font-heading text-xs uppercase tracking-wider">
                  Criminal History Check
                </h3>
                {checkState === 'idle' && (
                  <button
                    onClick={startCriminalCheck}
                    className="btn-primary text-xs py-2 px-4 shadow-md uppercase tracking-wider"
                  >
                    Run Registry Database Scan
                  </button>
                )}
              </div>

              {/* Active Verification Status Box */}
              {checkState === 'running' && (
                <div className="relative bg-slate-900 border border-slate-800 h-[140px] rounded-xl flex flex-col items-center justify-center p-4 text-center overflow-hidden shadow-inner">
                  {/* Animated Background Sweep */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent animate-[spin_3s_linear_infinite] opacity-50"></div>
                  </div>
                  
                  <div className="relative z-10 flex items-center justify-center mb-4">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                    <Database className="h-7 w-7 text-blue-400 absolute animate-pulse" />
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500/50" />
                  </div>
                  
                  <div className="relative z-10 flex items-center gap-2">
                    <Search className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                    <div className="text-[11px] font-bold text-blue-100 uppercase tracking-widest font-mono animate-pulse">
                      {activeLog}
                    </div>
                  </div>
                </div>
              )}

              {/* Matching подозреваемые list */}
              {checkState === 'done' && hasHistory && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50 border border-amber-250 text-amber-850 rounded-xl text-xs font-bold leading-normal flex items-start gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      WARNING: Possible offender matches identified. You MUST manually inspect and cross-verify each record details, select the match if identity is confirmed, and decide the request.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black block">Database Matches for Review</span>
                    {suspects.map((sus) => (
                      <div key={sus.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-100/50 transition-colors">
                        <div>
                          <div className="font-extrabold text-slate-800 text-sm">{sus.name} <span className="text-xs text-slate-400 font-bold font-mono">({sus.id})</span></div>
                          <div className="text-[10px] text-slate-455 mt-1 font-bold">
                            Age: {sus.age} · Father: {sus.fatherName} · Alias: {sus.alias}
                          </div>
                        </div>
                        <button
                          onClick={() => setInspectSuspect(sus)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-secondary tracking-widest transition-colors shrink-0 shadow-sm"
                        >
                          <Eye className="h-3.5 w-3.5" /> Inspect Record Dossier
                        </button>
                      </div>
                    ))}
                  </div>

                  {confirmedSuspect && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-start gap-2">
                      <AlertOctagon className="h-4.5 w-4.5 text-red-650 shrink-0 mt-0.5" />
                      <div>
                        Identity Match Confirmed: Candidate matches record <strong>{confirmedSuspect.name} ({confirmedSuspect.id})</strong>. You must reject this vetting clearance.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Clean Vetting results */}
              {checkState === 'done' && !hasHistory && (
                <div className="p-4.5 bg-emerald-50 border border-emerald-250 text-emerald-850 rounded-2xl text-xs font-bold leading-normal flex items-start gap-3.5 shadow-inner">
                  <Check className="h-5 w-5 text-emerald-700 bg-emerald-100 p-0.5 rounded-full border border-emerald-300 shrink-0" />
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-800 font-heading tracking-wide uppercase">Vetting Clearance Vouched</h4>
                    <p className="mt-1 font-semibold">The automated scan checked all police register parameters. Candidate has no police records, criminal files, or disclosable history. Ready for approval.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Vetting Audit Summary & Logs for Completed Records */
            <div className="card p-6 bg-white border border-slate-200/80 shadow-md space-y-6">
              <h3 className="font-extrabold text-primary font-heading text-xs uppercase tracking-wider mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-secondary" /> Vetting Vouched Outcome Archive
              </h3>

              {record.status === 'cleared' ? (
                <div className="p-4.5 bg-emerald-50 border border-emerald-250 text-emerald-850 rounded-2xl text-xs font-bold space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 text-emerald-850 font-heading uppercase text-xs font-black">
                    <Check className="h-5 w-5 bg-emerald-100 p-0.5 border border-emerald-300 rounded-full text-emerald-700" /> VETTING APPROVED / CLEARED
                  </div>
                  <p className="font-semibold text-slate-700">This candidate was checked against the database. No criminal history or registered records were found. Status is CLEAN.</p>
                  <div className="border-t border-emerald-200 pt-2.5 mt-2.5 font-mono text-[10px] text-emerald-700">
                    <strong className="block text-[8px] uppercase tracking-widest text-emerald-500 font-bold mb-1">Police Outcome Log</strong>
                    {record.reason || 'Candidate has no disclosable criminal or sexual offender history.'}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Matching Scan Metrics */}
                  <div className="p-4 bg-amber-50 border border-amber-250 text-amber-800 rounded-2xl text-xs font-bold space-y-1 shadow-inner">
                    <strong className="block text-[8px] uppercase tracking-widest text-amber-500 font-black">Database Scan Outcome</strong>
                    <p>Fuzzy database scan identified <strong className="text-amber-700">2 suspect records</strong> in local disclosable sex offender register database matching constraints.</p>
                  </div>

                  <div className="p-4.5 bg-red-50/50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold space-y-2 shadow-inner">
                    <div className="flex items-center gap-2 text-red-850 font-heading uppercase text-xs font-black">
                      <X className="h-5 w-5 bg-red-100 p-0.5 border border-red-300 rounded-full text-red-750" /> SELECTED IDENTITY MATCH VERIFIED
                    </div>
                    <p className="font-semibold text-slate-700">The officer manually verified and confirmed identity match with offender register file <strong>{record.matchedSuspect?.name} ({record.matchedSuspect?.id})</strong>.</p>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold space-y-2 shadow-inner">
                    <div className="flex items-center gap-2 text-red-850 font-heading uppercase text-xs font-black">
                      <ShieldAlert className="h-5 w-5 text-red-700" /> VETTING DENIED / REJECTED
                    </div>
                    <p className="font-semibold text-slate-700">Background checks confirmed an active identity match against local disclosable sex offender register database.</p>
                    <div className="border-t border-red-200 pt-2.5 mt-2.5 font-mono text-[10px] text-red-750">
                      <strong className="block text-[8px] uppercase tracking-widest text-red-500 font-bold mb-1">Police Vetting Match Reason</strong>
                      {record.reason || 'Candidate matches registered sexual offender profile details.'}
                    </div>
                  </div>

                  {record.matchedSuspect && (
                    <div className="card p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4.5 w-4.5 text-secondary animate-pulse" />
                          <h4 className="font-extrabold text-primary font-heading text-xs uppercase tracking-wider">
                            Matched suspect details: {record.matchedSuspect.name}
                          </h4>
                        </div>
                        <Link
                          to={`/portal/register/${record.matchedSuspect.id}`}
                          className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-secondary bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                        >
                          <FileText className="h-3.5 w-3.5" /> Full Register File
                        </Link>
                      </div>

                      {/* Suspect Detail Tabs */}
                      <div className="flex border-b border-slate-150 overflow-x-auto gap-2 scrollbar-none">
                        {[
                          { id: 'profile', label: 'Demographics & Address', icon: User },
                          { id: 'physical', label: 'Physical Traits & Moles', icon: Fingerprint },
                          { id: 'case', label: 'Case Vetting Details', icon: FileText }
                        ].map((t) => {
                          const Icon = t.icon;
                          const active = activeSuspectTab === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setActiveSuspectTab(t.id)}
                              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-heading font-black text-[9px] uppercase tracking-wider transition-all whitespace-nowrap ${
                                active
                                  ? 'border-secondary text-secondary font-black'
                                  : 'border-transparent text-slate-455 hover:text-primary hover:border-slate-300'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" /> {t.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tabs Content */}
                      <div className="min-h-[160px] pt-2">
                        {activeSuspectTab === 'profile' && (
                          <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <DetailRow label="Record suspect ID" value={record.matchedSuspect.id} mono />
                              <DetailRow label="Full Name" value={record.matchedSuspect.name} />
                              <DetailRow label="Alias (alias)" value={record.matchedSuspect.alias} />
                              <DetailRow label="Father Name (relative_name)" value={record.matchedSuspect.fatherName} />
                              <DetailRow label="Date of Birth" value={record.matchedSuspect.dob} mono />
                              <DetailRow label="Age Profile" value={`${record.matchedSuspect.age} Years`} />
                              <DetailRow label="Caste" value={record.matchedSuspect.caste} />
                              <DetailRow label="Sub-Caste (sub_caste)" value={record.matchedSuspect.subCaste} />
                              <DetailRow label="Religion / Nation" value={`${record.matchedSuspect.religion} / ${record.matchedSuspect.nationality}`} />
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black block mb-1">Present Registered Address</span>
                              <span className="font-bold text-slate-700 text-xs">{record.matchedSuspect.address}</span>
                            </div>
                          </div>
                        )}

                        {activeSuspectTab === 'physical' && (
                          <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <DetailRow label="Height Profile" value={record.matchedSuspect.height} />
                              <DetailRow label="Body Build" value={record.matchedSuspect.build} />
                              <DetailRow label="Complexion / Color" value={record.matchedSuspect.complexion} />
                              <DetailRow label="Iris Color" value={record.matchedSuspect.eyes} />
                              <DetailRow label="Hair Type" value={record.matchedSuspect.hair} />
                              <DetailRow label="Beard Profile" value={record.matchedSuspect.beard} />
                              <DetailRow label="Mustache Profile" value={record.matchedSuspect.mustache} />
                              <DetailRow label="Face Shape" value={record.matchedSuspect.face} />
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black block mb-1">Distinctive Moles & Marks (pf_mole)</span>
                              <span className="font-bold text-slate-700 text-xs">{record.matchedSuspect.identifications}</span>
                            </div>
                          </div>
                        )}

                        {activeSuspectTab === 'case' && (
                          <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <DetailRow label="FIR Reference" value={record.matchedSuspect.firNo} />
                              <DetailRow label="FIR Date Vetted" value={record.matchedSuspect.firDate} mono />
                              <DetailRow label="Date of Conviction" value={record.matchedSuspect.convDate} mono />
                              <DetailRow label="Court Name" value={record.matchedSuspect.courtName} />
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black block mb-1">Convicted Offence Summary</span>
                              <span className="font-bold text-slate-700 text-xs">{record.matchedSuspect.offence}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Decision Dashboard Column */}
        <div className="space-y-6">
          <div className="card p-6 bg-white border border-slate-200/80 shadow-md">
            <h3 className="font-extrabold text-primary font-heading text-xs uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">Vetting Outcome</h3>
            
            <div className="mb-6">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Vetting Status</div>
              <StatusPill status={record.status} />
            </div>

            {(record.status !== 'pending' && record.status !== 'verifying') ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs text-slate-500 font-bold leading-normal">
                  This request was processed on <strong>{record.decisionDate || '2026-07-08'}</strong>. Vetting records are finalized and locked.
                </div>
                {record.reason && (
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-slate-455 font-black block">Decision Log Reason</span>
                    <p className="text-xs font-semibold text-slate-655 leading-normal whitespace-pre-wrap">
                      {record.reason.split('\n\nOfficer Notes: ')[0]}
                    </p>
                  </div>
                )}
                {record.reason && record.reason.includes('\n\nOfficer Notes: ') && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 mt-3 shadow-inner">
                    <span className="text-[9px] uppercase tracking-widest text-amber-600 font-black block">Officer Verification Notes</span>
                    <p className="text-xs font-semibold text-amber-900 leading-normal whitespace-pre-wrap">
                      {record.reason.split('\n\nOfficer Notes: ')[1]}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {checkState === 'running' && (
                  <div className="flex items-center justify-center p-6 bg-slate-50 border border-slate-150 rounded-2xl text-xs text-slate-455 font-bold">
                    <Loader2 className="h-4 w-4 animate-spin text-secondary mr-2" /> Vetting database check active...
                  </div>
                )}

                {/* Vetting complete: Decision panels */}
                {checkState === 'done' && (
                  <div className="space-y-4">
                    <div className="mb-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Officer Verification Notes / Feedback</label>
                      <textarea
                        value={officerFeedback}
                        onChange={(e) => setOfficerFeedback(e.target.value)}
                        placeholder="Enter description of candidate verification, findings, or reasons for decision..."
                        className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none min-h-[80px]"
                      ></textarea>
                    </div>
                    <div className="space-y-3">
                    {hasHistory ? (
                      <>
                        <button
                          disabled={!confirmedSuspect}
                          onClick={handleReject}
                          className={`w-full inline-flex justify-center items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white transition-all rounded-xl shadow-lg ${
                            confirmedSuspect
                              ? 'bg-red-600 hover:bg-red-700 shadow-red-100'
                              : 'bg-slate-300 cursor-not-allowed opacity-60 shadow-none'
                          }`}
                        >
                          <XCircle className="h-4 w-4" /> Reject Clearance Request
                        </button>
                        <button
                          disabled={true}
                          className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200 transition-all rounded-xl cursor-not-allowed opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Issue Clearance (Disabled)
                        </button>
                        {!confirmedSuspect && (
                          <p className="text-[9px] text-amber-600 font-bold text-center mt-2 leading-relaxed">
                            Verify suspect details and confirm match identity to reject candidate.
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleClear}
                          className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-all rounded-xl shadow-lg shadow-emerald-100"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve Vetting Clearance
                        </button>
                        <button
                          disabled={true}
                          className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-400 border border-slate-200 transition-all rounded-xl cursor-not-allowed opacity-50"
                        >
                          <XCircle className="h-4 w-4" /> Reject Request (Clean)
                        </button>
                      </>
                    )}
                  </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Suspect Detail Verification Modal */}
      {inspectSuspect && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-4" onClick={() => setInspectSuspect(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-[90vw] md:w-[70vw] flex flex-col shadow-2xl overflow-hidden border border-slate-200 h-[85vh]" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary to-[#0f2a4a] text-white border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4.5 w-4.5 text-accent animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider font-heading">Offender Register Match Vetting</span>
              </div>
              <button onClick={() => setInspectSuspect(null)} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors" aria-label="Close modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-slate-50 flex-grow overflow-y-auto space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-150 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 font-bold shrink-0 relative">
                    <span className="text-lg">{(inspectSuspect.name).charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-primary font-heading text-sm uppercase tracking-wider">{inspectSuspect.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">SOR Record ID: {inspectSuspect.id}</span>
                  </div>
                </div>
                <div className="bg-red-50 text-red-700 border border-red-200 font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-full">
                  Convicted Offender
                </div>
              </div>

              {/* Physical Details */}
              <div className="space-y-3">
                <h5 className="font-black text-slate-800 font-heading text-[10px] uppercase tracking-wider border-b border-slate-200 pb-1.5">1. Demographics & Address</h5>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <DetailRow label="Father Name" value={inspectSuspect.fatherName} />
                  <DetailRow label="Date of Birth" value={inspectSuspect.dob} mono />
                  <DetailRow label="Age Profile" value={`${inspectSuspect.age} Years`} />
                  <DetailRow label="Caste" value={inspectSuspect.caste} />
                  <DetailRow label="Religion / Nation" value={`${inspectSuspect.religion} / ${inspectSuspect.nationality}`} />
                  <DetailRow label="Educational/Work" value={`${inspectSuspect.education} (${inspectSuspect.occupation})`} />
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl mt-2">
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black block mb-1">Present Registered Address</span>
                  <span className="font-bold text-slate-700">{inspectSuspect.address}</span>
                </div>
              </div>

              {/* Physical Features */}
              <div className="space-y-3">
                <h5 className="font-black text-slate-800 font-heading text-[10px] uppercase tracking-wider border-b border-slate-200 pb-1.5">2. Physical Markings & Identifications</h5>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <DetailRow label="Height Profile" value={inspectSuspect.height} />
                  <DetailRow label="Build Profile" value={inspectSuspect.build} />
                  <DetailRow label="Complexion / Color" value={inspectSuspect.complexion} />
                  <DetailRow label="Eyes / Hair" value={`${inspectSuspect.eyes} / ${inspectSuspect.hair}`} />
                  <DetailRow label="Beard / Mustache" value={`${inspectSuspect.beard} / ${inspectSuspect.mustache}`} />
                  <DetailRow label="Face Shape" value={inspectSuspect.face} />
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl mt-2">
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black block mb-1">Special Moles & Scars (pf_mole)</span>
                  <span className="font-bold text-slate-700">{inspectSuspect.identifications}</span>
                </div>
              </div>

              {/* Crime details */}
              <div className="space-y-3">
                <h5 className="font-black text-slate-800 font-heading text-[10px] uppercase tracking-wider border-b border-slate-200 pb-1.5">3. Conviction Case Record</h5>
                <div className="grid sm:grid-cols-2 gap-3">
                  <DetailRow label="FIR Reference" value={inspectSuspect.firNo} />
                  <DetailRow label="FIR Date Vetted" value={inspectSuspect.firDate} mono />
                  <DetailRow label="Date of Conviction" value={inspectSuspect.convDate} mono />
                  <DetailRow label="Sessions Court" value={inspectSuspect.courtName} />
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl mt-2">
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-black block mb-1">Assigned Conviction Offence</span>
                  <span className="font-bold text-slate-700">{inspectSuspect.offence}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <span className="text-[10px] text-slate-455 font-bold">
                Does candidate match this record?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setConfirmedSuspect(inspectSuspect);
                    setInspectSuspect(null);
                  }}
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-xs font-black uppercase text-white tracking-widest transition-all shadow-md"
                >
                  <Check className="h-4 w-4" /> Confirm Match Vetting
                </button>
                <button
                  onClick={() => setInspectSuspect(null)}
                  className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default VerificationVetting;
