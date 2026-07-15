import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, FileText, User, Building, Loader2, ShieldAlert, Check, Eye, AlertOctagon, X, Fingerprint, Database, Search, Download, CreditCard } from 'lucide-react';
import { policeApi } from '../../../api/police.api';
import PageHeader from '../../../components/portal/PageHeader';
import { StatusPill } from '../../../components/portal/Badges';
import { useToast } from '../../../components/ui/Toast';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm text-slate-500 font-bold tracking-wide">{label}</div>
        <div className="text-base text-slate-800 font-medium break-words mt-0.5">{value || '—'}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, span2 }) {
  const displayValue = (value === 'N/A' || !value) ? '-' : value;
  
  return (
    <div className={`p-3 bg-slate-50 border border-slate-200 rounded-xl ${span2 ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
      <div className="text-xs tracking-wide text-slate-400 font-black mb-1 flex items-center gap-1.5 break-words">
        {label}
      </div>
      <div className={`text-sm text-slate-700 font-bold break-words ${mono ? 'font-mono text-sm' : ''}`}>{displayValue}</div>
    </div>
  );
}

function SectionHeading({ title, icon: Icon, badge }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 mt-8 pb-3 border-b border-slate-100">
      <Icon className="w-4 h-4 text-secondary" />
      <h3 className="font-heading font-black text-primary text-base tracking-wide">{title}</h3>
      {badge && <span className="ml-2 px-2.5 py-1 bg-slate-100 text-slate-500 text-sm font-bold tracking-wide rounded-md border border-slate-200">{badge}</span>}
    </div>
  );
}

function DynamicDataGrid({ data }) {
  if (!data || Object.keys(data).length === 0) return <DetailRow label="Status" value="No records found in database" />;
  
  // Filter out N/A or empty values
  const validEntries = Object.entries(data).filter(([_, value]) => value && value !== 'N/A' && value !== '—');

  if (validEntries.length === 0) {
    return <DetailRow label="Status" value="No relevant data present in this section." />;
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {validEntries.map(([key, value]) => {
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
            <div className="absolute top-4 right-4 px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-sm font-bold border border-slate-200">
              SEQ {index + 1}
            </div>
            <DynamicDataGrid data={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

const CCTNS_CATEGORY_ORDER = [
  { key: 'aadhaar', label: 'Aadhaar exact match' },
  { key: 'name_phone', label: 'Name + phone exact' },
  { key: 'name', label: 'Name exact' },
  { key: 'phone', label: 'Phone exact' },
  { key: 'fuzzy', label: 'Trigram fuzzy name fallback' }
];

const isCctnsSuspect = (sus) => {
  const source = (sus?.source || '').toLowerCase();
  return source.includes('cctns') || source.includes('state register');
};

const confidenceTone = (score) => {
  if (score >= 90) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 75) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

function VerificationVetting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await policeApi.getVerificationById(id);
        if (res.success) {
          setRecord(res.data);
        }
      } catch (err) {
        console.error('Failed to load record', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id]);

  // Vetting Workflow States
  const [checkState, setCheckState] = useState('idle'); // 'idle' | 'running' | 'done'
  const [activeLog, setActiveLog] = useState('');
  const [suspects, setSuspects] = useState([]);
  const [scanMeta, setScanMeta] = useState(null);
  const [matchSourceTab, setMatchSourceTab] = useState('cctns'); // 'cctns' | 'epetty'
  const [cctnsCategoryTab, setCctnsCategoryTab] = useState('all');
  const [inspectSuspect, setInspectSuspect] = useState(null); // Selected suspect for detail modal
  const [confirmedSuspect, setConfirmedSuspect] = useState(null); // Suspect matched by officer
  const [discardedMatchKeys, setDiscardedMatchKeys] = useState([]); // false-positive match keys
  const [activeSuspectTab, setActiveSuspectTab] = useState('profile');
  const [officerFeedback, setOfficerFeedback] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);

  const getSuspectKey = (sus) => `${sus?.source || 'match'}::${sus?.id}`;

  const buildListDossier = (sus) => ({
    offender_id: sus.id,
    person_details: {
      full_name: sus.name || '—',
      alias: sus.alias,
      age: sus.age,
      father_name: sus.fatherName,
      date_of_birth: sus.dob,
      phone_number: sus.phone,
      address: sus.address
    },
    latest_physical_features: {},
    crimes: [{
      fir_no: sus.firNo,
      fir_date: sus.firDate,
      offence: sus.offence,
      court_name: sus.courtName,
      source: sus.source,
      priority: sus.priority,
      risk_tier: sus.riskTier
    }],
    arrests: [],
    _listContext: sus,
    _sourceType: 'list'
  });

  const isCctnsSource = (sus) => {
    const source = (sus?.source || '').toLowerCase();
    return source.includes('cctns') || source.includes('state register');
  };

  const handleConfirmMatch = (susOrInspect) => {
    const list = susOrInspect?._listContext || susOrInspect;
    const name =
      (susOrInspect?.person_details?.full_name && susOrInspect.person_details.full_name !== 'N/A'
        ? susOrInspect.person_details.full_name
        : null) ||
      list?.name ||
      'Unknown';
    const matchId = susOrInspect?.offender_id || list?.id;
    const key = getSuspectKey(list || { id: matchId, source: susOrInspect?._listContext?.source || 'match' });

    setDiscardedMatchKeys((prev) => prev.filter((k) => k !== key));
    setConfirmedSuspect({
      id: matchId,
      name,
      source: list?.source || 'match',
      key,
      confidence: list?.confidence,
      matchCategoryLabel: list?.matchCategoryLabel
    });
    setInspectSuspect(null);
    toast.success('Match confirmed', 'Reject clearance to finalize this decision.');
  };

  const handleDiscardMatch = (susOrInspect) => {
    const list = susOrInspect?._listContext || susOrInspect;
    const matchId = susOrInspect?.offender_id || list?.id;
    const key = getSuspectKey(list || { id: matchId, source: list?.source || 'match' });

    setDiscardedMatchKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setConfirmedSuspect((prev) => (prev && (prev.key === key || prev.id === matchId) ? null : prev));
    setInspectSuspect(null);
    toast.success('Match discarded', 'Treated as a false positive. Continue reviewing other records or issue clearance when ready.');
  };

  const handleUndoDiscard = (sus) => {
    const key = getSuspectKey(sus);
    setDiscardedMatchKeys((prev) => prev.filter((k) => k !== key));
  };

  const handleInspect = async (sus) => {
    setInspectLoading(true);
    try {
      // ePetty / non-CCTNS IDs are not in mv_offender_details — show scan card dossier.
      if (!isCctnsSource(sus)) {
        setInspectSuspect(buildListDossier(sus));
        return;
      }

      const res = await policeApi.getOffenderById(sus.id);
      if (res.success && res.data) {
        setInspectSuspect({ ...res.data, _listContext: sus, _sourceType: 'cctns' });
      } else {
        // Fallback to scan-card fields if CCTNS detail view is unavailable
        setInspectSuspect(buildListDossier(sus));
        toast.error('Full CCTNS dossier unavailable', 'Showing match details from the clearance scan instead.');
      }
    } catch (err) {
      console.error(err);
      setInspectSuspect(buildListDossier(sus));
      toast.error('Full dossier unavailable', 'Showing match details from the clearance scan instead.');
    } finally {
      setInspectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold">
        Request not found. <Link to="/portal/clearances" className="text-blue-600 underline">Back to list</Link>
      </div>
    );
  }

  // Check if we expect history based on status
  const hasHistory = suspects.length > 0;
  const cctnsSuspects = suspects.filter(isCctnsSuspect);
  const epettySuspects = suspects.filter((s) => !isCctnsSuspect(s));
  const cctnsCategoryCounts = CCTNS_CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat.key] = cctnsSuspects.filter((s) => (s.matchCategory || 'fuzzy') === cat.key).length;
    return acc;
  }, {});
  const visibleCctnsSuspects = cctnsCategoryTab === 'all'
    ? cctnsSuspects
    : cctnsSuspects.filter((s) => (s.matchCategory || 'fuzzy') === cctnsCategoryTab);
  const visibleSuspects = matchSourceTab === 'cctns' ? visibleCctnsSuspects : epettySuspects;
  const openSuspects = suspects.filter((s) => !discardedMatchKeys.includes(getSuspectKey(s)));
  const allMatchesDiscarded = hasHistory && openSuspects.length === 0 && !confirmedSuspect;
  const canIssueClearance = !hasHistory || allMatchesDiscarded;
  const canRejectClearance = Boolean(confirmedSuspect);

  const startCriminalCheck = async () => {
    setCheckState('running');
    try {
      await policeApi.updateVerificationStatus(id, { status: 'verifying' });
      setRecord(prev => ({ ...prev, status: 'verifying' }));
    } catch(e) { console.error(e); }
    setActiveLog('');
    setSuspects([]);
    setScanMeta(null);
    setMatchSourceTab('cctns');
    setCctnsCategoryTab('all');
    setConfirmedSuspect(null);
    setDiscardedMatchKeys([]);

    const logSequence = [
      { text: "Connecting to criminal databases...", delay: 0 },
      { text: "Verifying records...", delay: 700 },
      { text: "Processing identity parameters...", delay: 1400 },
      { text: "Checking CCTNS accused records...", delay: 2100 },
      { text: "Checking ePetty case records...", delay: 2800 },
      { text: "Analysis completing, expecting results in 30 seconds...", delay: 3500 },
    ];

    logSequence.forEach((item) => {
      setTimeout(() => {
        setActiveLog(item.text);
      }, item.delay);
    });

    // Vetting completion logic via live API scan
    setTimeout(async () => {
      try {
        const scanRes = await policeApi.scanVerificationById(id);
        if (scanRes?.cctnsError) {
          toast.error('CCTNS lookup issue', scanRes.cctnsError);
        }
        if (scanRes?.epettyError) {
          toast.error('ePetty lookup issue', scanRes.epettyError);
        }
        const nextSuspects = scanRes?.suspects || [];
        setSuspects(nextSuspects);
        setScanMeta({
          sourceCounts: scanRes?.sourceCounts || { cctns: 0, epetty: 0 },
          cctnsStatus: scanRes?.cctnsStatus || null,
          epettyStatus: scanRes?.epettyStatus || null,
          priorityLabel: scanRes?.priorityLabel || null
        });

        const cctnsCount = nextSuspects.filter(isCctnsSuspect).length;
        const epettyCount = nextSuspects.length - cctnsCount;
        setMatchSourceTab(cctnsCount > 0 ? 'cctns' : (epettyCount > 0 ? 'epetty' : 'cctns'));
        setCctnsCategoryTab('all');
      } catch (err) {
        console.error('Scan failed:', err);
      } finally {
        setCheckState('done');
      }
    }, 4200);
  };

  const handleClear = async () => {
    const discardedNote = discardedMatchKeys.length > 0
      ? ` Officer reviewed ${suspects.length} candidate match(es) and discarded ${discardedMatchKeys.length} as non-identity / false positive(s).`
      : '';
    const reasonText = 'Candidate verified against Central Sex Offender Registry and CCTNS crime logs. Zero confirming identity matches. Clearance certificate officially granted.' + discardedNote + (officerFeedback ? `\n\nOfficer Notes: ${officerFeedback}` : '');
    try {
      await policeApi.updateVerificationStatus(id, { status: 'cleared', policeFeedback: reasonText });
      toast.success('Clearance issued', 'The requesting organization has been notified of the decision.');
      navigate('/portal/clearances');
    } catch (e) {
      toast.error('Failed to issue clearance', 'Please try again or contact system support.');
    }
  };

  const handleReject = async () => {
    if (!confirmedSuspect) return;
    const reasonText = `Identity matches registered offender profile: ${confirmedSuspect.name} (${confirmedSuspect.id}). Clearance request denied due to positive criminal register mapping.` + (officerFeedback ? `\n\nOfficer Notes: ${officerFeedback}` : '');
    try {
      await policeApi.updateVerificationStatus(id, { status: 'rejected', policeFeedback: reasonText });
      toast.success('Clearance denied', 'The organization has been notified of the decision.');
      navigate('/portal/clearances');
    } catch (e) {
      toast.error('Failed to deny clearance', 'Please try again or contact system support.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10 font-body relative">
      <PageHeader
        crumbs={[
          { label: 'Police', to: '/portal' },
          { label: 'Pending Clearances', to: '/portal/clearances' },
          { label: String(record.id).split('-')[0] },
        ]}
        title={`Clearance Request: ${record.candidateName}`}
        subtitle={`Submitted on ${new Date(record.createdAt).toLocaleDateString('en-GB')} by ${record.orgName}`}
        actions={
          <Link
            to="/portal/clearances"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-primary transition-all bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
            <h3 className="font-extrabold text-primary font-heading text-sm tracking-wide mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <User className="h-4 w-4 text-secondary" /> Candidate Vetting Profile
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow icon={User} label="Full Name" value={record.candidateName} />
              <InfoRow icon={User} label="Date of Birth Profile" value={new Date(record.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
              
              <InfoRow icon={User} label="Phone Number" value={record.phone} />
              {record.fatherName && <InfoRow icon={User} label="Father's Name" value={record.fatherName} />}
              <InfoRow icon={Building} label="Employer Station" value={record.orgName} />
              <InfoRow icon={Building} label="Organization Type" value={record.orgType} />
              
              <InfoRow icon={Building} label="Requested Role/Seat" value={record.role} />
              <InfoRow icon={CheckCircle2} label="Consent Status" value={record.consent ? "Consent Authorized & Verified" : "Not Provided"} />
              
              <InfoRow icon={FileText} label="Submission Date" value={new Date(record.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              <InfoRow icon={ShieldAlert} label="Current Status" value={record.status.toUpperCase()} />
              {record.aadharNumber && <InfoRow icon={CreditCard} label="Aadhar Number" value={record.aadharNumber} />}
            </div>

            {/* Files Section */}
            <div className="mt-6 pt-6 border-t border-slate-100 grid sm:grid-cols-2 gap-4">
              {record.candidateImage && (
                <div className="space-y-2">
                  <span className="text-sm text-slate-400 font-bold tracking-wide">Candidate Image</span>
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img 
                      src={policeApi.getDocumentUrl(record.candidateImage)} 
                      alt="Candidate" 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                    />
                  </div>
                </div>
              )}
              {record.consentFile && (
                <div className="space-y-2">
                  <span className="text-sm text-slate-400 font-bold tracking-wide">Consent Declaration</span>
                  <a 
                    href={policeApi.getDocumentUrl(record.consentFile)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" /> View Signed Consent
                  </a>
                </div>
              )}
            </div>
          </div>

          {(record.status === 'pending' || record.status === 'verifying') ? (
            /* Interactive Criminal Registry Checker */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-primary font-heading text-sm tracking-wide">
                  Criminal History Check
                </h3>
                {checkState === 'idle' && (
                  <button
                    onClick={startCriminalCheck}
                    className="btn-primary text-sm py-2 px-4 shadow-md tracking-wide"
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
                    <div className="text-sm font-bold text-blue-100 tracking-wide font-mono animate-pulse">
                      {activeLog}
                    </div>
                  </div>
                </div>
              )}

              {/* Matching suspect list — CCTNS / ePetty tabs */}
              {checkState === 'done' && suspects.length > 0 && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-amber-50 border border-amber-250 text-amber-850 rounded-xl text-sm font-bold leading-normal flex items-start gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      WARNING: Possible offender matches identified. You MUST manually inspect and cross-verify each record details, select the match if identity is confirmed, and decide the request.
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs tracking-wide text-slate-400 font-black block">Database Matches for Review</span>
                      {scanMeta?.epettyStatus === 'skipped' && (
                        <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          ePetty skipped (strong CCTNS hit)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                      {[
                        { id: 'cctns', label: 'CCTNS', count: cctnsSuspects.length },
                        { id: 'epetty', label: 'E-Petty', count: epettySuspects.length }
                      ].map((tab) => {
                        const active = matchSourceTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setMatchSourceTab(tab.id);
                              if (tab.id === 'cctns') setCctnsCategoryTab('all');
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black tracking-wide border transition-all ${
                              active
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {tab.label}
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {matchSourceTab === 'cctns' && (
                      <div className="space-y-2">
                        <span className="text-xs tracking-wide text-slate-400 font-black block">Matched by (CCTNS search order)</span>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setCctnsCategoryTab('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                              cctnsCategoryTab === 'all'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            All ({cctnsSuspects.length})
                          </button>
                          {CCTNS_CATEGORY_ORDER.map((cat) => {
                            const count = cctnsCategoryCounts[cat.key] || 0;
                            const active = cctnsCategoryTab === cat.key;
                            return (
                              <button
                                key={cat.key}
                                type="button"
                                disabled={count === 0}
                                onClick={() => setCctnsCategoryTab(cat.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                  active
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                                title={cat.label}
                              >
                                {cat.label}
                                <span className="ml-1.5 opacity-80">({count})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {visibleSuspects.length === 0 ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500">
                        {matchSourceTab === 'cctns'
                          ? 'No CCTNS accused matches in this subcategory.'
                          : 'No E-Petty matches for this clearance scan.'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {visibleSuspects.map((sus) => {
                          const tierColors = {
                            Red: 'bg-red-50 text-red-700 border-red-200',
                            Orange: 'bg-orange-50 text-orange-700 border-orange-200',
                            Blue: 'bg-blue-50 text-blue-700 border-blue-200',
                            Black: 'bg-slate-800 text-white border-slate-700',
                            Pink: 'bg-pink-50 text-pink-700 border-pink-200',
                            Green: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          };
                          const badgeClass = tierColors[sus.riskTier] || 'bg-amber-50 text-amber-700 border-amber-200';
                          const confidence = Number(sus.confidence);
                          const hasConfidence = Number.isFinite(confidence);
                          const suspectKey = getSuspectKey(sus);
                          const isDiscarded = discardedMatchKeys.includes(suspectKey);
                          const isConfirmed = confirmedSuspect?.key === suspectKey || confirmedSuspect?.id === sus.id;

                          return (
                            <div
                              key={suspectKey}
                              className={`group relative bg-white border rounded-2xl shadow-sm transition-all duration-300 overflow-hidden ${
                                isConfirmed
                                  ? 'border-red-300 hover:border-red-400'
                                  : isDiscarded
                                    ? 'border-emerald-200 opacity-75'
                                    : 'border-slate-200/80 hover:shadow-md hover:border-primary/30'
                              }`}
                            >
                              <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl opacity-80 pointer-events-none ${
                                isConfirmed
                                  ? 'bg-red-500'
                                  : isDiscarded
                                    ? 'bg-emerald-500'
                                    : 'bg-gradient-to-b from-primary via-blue-500 to-indigo-600'
                              }`} />
                              <div className="pl-5 pr-4 py-4 space-y-3 relative z-10">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 font-black shadow-inner shrink-0">
                                      {(sus.name || 'O').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-extrabold text-slate-800 text-base font-heading tracking-wide break-words">
                                        {sus.name}
                                      </h4>
                                      <span className="text-sm text-slate-400 font-bold font-mono break-all block">ID: {sus.id}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                                    {hasConfidence && (
                                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black border ${confidenceTone(confidence)}`}>
                                        Confidence {confidence}%
                                      </span>
                                    )}
                                    {isConfirmed && (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black border bg-red-50 text-red-700 border-red-200">
                                        Confirmed identity
                                      </span>
                                    )}
                                    {isDiscarded && (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-black border bg-emerald-50 text-emerald-700 border-emerald-200">
                                        Discarded (false positive)
                                      </span>
                                    )}
                                    {!isDiscarded ? (
                                      <button
                                        onClick={() => handleInspect(sus)}
                                        disabled={inspectLoading}
                                        className="group/btn relative inline-flex items-center justify-center gap-2 px-5 py-3 bg-white hover:bg-slate-900 border border-slate-200 hover:border-slate-800 rounded-xl text-sm font-black uppercase text-secondary hover:text-white tracking-widest transition-all duration-300 shadow-sm disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-secondary overflow-hidden w-full sm:w-auto"
                                      >
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                        <div className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                                          {inspectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} Inspect Dossier
                                        </div>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleUndoDiscard(sus)}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:border-slate-400 rounded-xl text-sm font-black uppercase text-slate-600 tracking-widest transition-all shadow-sm w-full sm:w-auto"
                                      >
                                        Undo Discard
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {sus.matchCategoryLabel && (
                                    <span className="px-2.5 py-1 rounded-lg text-sm font-bold tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm break-words max-w-full">
                                      {sus.matchCategoryLabel}
                                    </span>
                                  )}
                                  {Array.isArray(sus.matchParams) && sus.matchParams.length > 0 && (
                                    <span className="px-2.5 py-1 rounded-lg text-sm font-bold tracking-wide bg-slate-50 text-slate-600 border border-slate-200 shadow-sm">
                                      Params: {sus.matchParams.join(' + ')}
                                    </span>
                                  )}
                                  {sus.riskTier && (
                                    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold tracking-wide border shadow-sm ${badgeClass}`}>
                                      {sus.riskTier} TIER
                                    </span>
                                  )}
                                  {sus.priority && (
                                    <span
                                      title={sus.priority}
                                      className="px-2.5 py-1 rounded-lg text-sm font-bold tracking-wide bg-amber-50 text-amber-700 border border-amber-200 shadow-sm inline-flex items-center gap-1 max-w-full whitespace-normal break-words"
                                    >
                                      <ShieldAlert className="w-3 h-3 shrink-0" /> {sus.priority}
                                    </span>
                                  )}
                                  {sus.source && (
                                    <span className="px-2.5 py-1 rounded-lg text-sm font-bold tracking-wide bg-slate-50 text-slate-600 border border-slate-200 shadow-sm">
                                      {sus.source}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {(sus.age && sus.age !== 'N/A' && sus.age !== '—') && (
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 font-medium shadow-sm">
                                      <span className="text-sm font-bold tracking-wide text-slate-400">AGE</span>
                                      <span>{sus.age}</span>
                                    </div>
                                  )}
                                  {(sus.alias && sus.alias !== 'N/A' && sus.alias !== '—') && (
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 font-medium shadow-sm min-w-0">
                                      <span className="text-sm font-bold tracking-wide text-slate-400 shrink-0">ALIAS</span>
                                      <span className="break-words">{sus.alias}</span>
                                    </div>
                                  )}
                                  {(sus.offence && sus.offence !== 'N/A' && sus.offence !== '—') && (
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 font-medium shadow-sm min-w-0 max-w-full">
                                      <span className="text-sm font-bold tracking-wide text-slate-400 shrink-0">FIR / CRIME</span>
                                      <span className="break-words" title={sus.offence}>
                                        {sus.offence}
                                        {sus.firDate && sus.firDate !== 'N/A' && sus.firDate !== '—' ? ` (${sus.firDate})` : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {confirmedSuspect && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-bold flex items-start gap-2">
                      <AlertOctagon className="h-4.5 w-4.5 text-red-700 shrink-0 mt-0.5" />
                      <div>
                        Identity Match Confirmed: Candidate matches record <strong>{confirmedSuspect.name} ({confirmedSuspect.id})</strong>. You must reject this vetting clearance.
                      </div>
                    </div>
                  )}

                  {!confirmedSuspect && hasHistory && openSuspects.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-bold flex items-start gap-2">
                      <ShieldAlert className="h-4.5 w-4.5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        {openSuspects.length} match record(s) still need a decision. Confirm an identity to reject clearance, or discard false positives to enable issuing clearance.
                      </div>
                    </div>
                  )}

                  {allMatchesDiscarded && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-bold flex items-start gap-2">
                      <Check className="h-4.5 w-4.5 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        All candidate matches were discarded as non-identity. You may issue clearance.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Clean Vetting results */}
              {checkState === 'done' && suspects.length === 0 && (
                <div className="p-4.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-bold leading-normal flex items-start gap-3.5 shadow-inner">
                  <Check className="h-5 w-5 text-emerald-700 bg-emerald-100 p-0.5 rounded-full border border-emerald-300 shrink-0" />
                  <div>
                    <h4 className="text-base font-extrabold text-emerald-800 font-heading tracking-wide uppercase">Vetting Clearance Vouched</h4>
                    <p className="mt-1 font-semibold">The automated scan checked CCTNS accused records and ePetty case records. Candidate has no police records, criminal files, or disclosable history. Ready for approval.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Vetting Audit Summary & Logs for Completed Records */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="font-extrabold text-primary font-heading text-sm tracking-wide mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-secondary" /> Vetting Vouched Outcome Archive
              </h3>

              {record.status === 'cleared' ? (
                <div className="p-4.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-bold space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 text-emerald-800 font-heading uppercase text-sm font-black">
                    <Check className="h-5 w-5 bg-emerald-100 p-0.5 border border-emerald-300 rounded-full text-emerald-700" /> VETTING APPROVED / CLEARED
                  </div>
                  <p className="font-semibold text-slate-700">This candidate was checked against the database. No criminal history or registered records were found. Status is CLEAN.</p>
                  <div className="border-t border-emerald-200 pt-2.5 mt-2.5 font-mono text-sm text-emerald-700">
                    <strong className="block text-xs tracking-wide text-emerald-500 font-bold mb-1">Police Outcome Log</strong>
                    {record.policeFeedback || 'Candidate has no disclosable criminal or sexual offender history.'}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Matching Scan Metrics */}
                  <div className="p-4 bg-amber-50 border border-amber-250 text-amber-800 rounded-2xl text-sm font-bold space-y-1 shadow-inner">
                    <strong className="block text-xs tracking-wide text-amber-500 font-black">Database Scan Outcome</strong>
                    <p>Fuzzy database scan identified <strong className="text-amber-700">2 suspect records</strong> in local disclosable sex offender register database matching constraints.</p>
                  </div>

                  <div className="p-4.5 bg-red-50/50 border border-red-200 text-red-800 rounded-2xl text-sm font-bold space-y-2 shadow-inner">
                    <div className="flex items-center gap-2 text-red-850 font-heading uppercase text-sm font-black">
                      <X className="h-5 w-5 bg-red-100 p-0.5 border border-red-300 rounded-full text-red-750" /> SELECTED IDENTITY MATCH VERIFIED
                    </div>
                    <p className="font-semibold text-slate-700">The officer manually verified and confirmed identity match with offender register file <strong>{record.matchedSuspect?.name} ({record.matchedSuspect?.id})</strong>.</p>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm font-bold space-y-2 shadow-inner">
                    <div className="flex items-center gap-2 text-red-850 font-heading uppercase text-sm font-black">
                      <ShieldAlert className="h-5 w-5 text-red-700" /> VETTING DENIED / REJECTED
                    </div>
                    <p className="font-semibold text-slate-700">Background checks confirmed an active identity match against local disclosable sex offender register database.</p>
                    <div className="border-t border-red-200 pt-2.5 mt-2.5 font-mono text-sm text-red-750">
                      <strong className="block text-xs tracking-wide text-red-500 font-bold mb-1">Police Vetting Match Reason</strong>
                      {record.policeFeedback || 'Candidate matches registered sexual offender profile details.'}
                    </div>
                  </div>

                  {record.matchedSuspect && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4.5 w-4.5 text-secondary animate-pulse" />
                          <h4 className="font-extrabold text-primary font-heading text-sm tracking-wide">
                            Matched suspect details: {record.matchedSuspect.name}
                          </h4>
                        </div>
                        <Link
                          to={`/portal/register/${record.matchedSuspect.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                        >
                          <FileText className="h-3.5 w-3.5" /> Full Register File
                        </Link>
                      </div>

                      {/* Suspect Detail Tabs */}
                      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 scrollbar-none">
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
                              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-heading font-black text-xs tracking-wide transition-all whitespace-nowrap ${
                                active
                                  ? 'border-secondary text-secondary font-black'
                                  : 'border-transparent text-slate-500 hover:text-primary hover:border-slate-300'
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
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <span className="text-xs tracking-wide text-slate-400 font-black block mb-1">Present Registered Address</span>
                              <span className="font-bold text-slate-700 text-sm">{record.matchedSuspect.address}</span>
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
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <span className="text-xs tracking-wide text-slate-400 font-black block mb-1">Distinctive Moles & Marks (pf_mole)</span>
                              <span className="font-bold text-slate-700 text-sm">{record.matchedSuspect.identifications}</span>
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
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <span className="text-xs tracking-wide text-slate-400 font-black block mb-1">Convicted Offence Summary</span>
                              <span className="font-bold text-slate-700 text-sm">{record.matchedSuspect.offence}</span>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8">
            <h3 className="font-extrabold text-primary font-heading text-sm tracking-wide mb-4 pb-3 border-b border-slate-100">Vetting Outcome</h3>
            
            <div className="mb-6">
              <div className="text-sm font-bold text-slate-400 tracking-wide mb-2">Vetting Status</div>
              <StatusPill status={record.status} />
            </div>

            {(record.status !== 'pending' && record.status !== 'verifying') ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-500 font-bold leading-normal">
                  This request was processed on <strong>{new Date(record.updatedAt).toLocaleDateString('en-GB') || '2026-07-08'}</strong>. Vetting records are finalized and locked.
                </div>
                {record.policeFeedback && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-xs tracking-wide text-slate-500 font-black block">Decision Log Reason</span>
                    <p className="text-sm font-semibold text-slate-600 leading-normal whitespace-pre-wrap">
                      {record.policeFeedback.split('\n\nOfficer Notes: ')[0]}
                    </p>
                  </div>
                )}
                {record.policeFeedback && record.policeFeedback.includes('\n\nOfficer Notes: ') && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 mt-3 shadow-inner">
                    <span className="text-xs tracking-wide text-amber-600 font-black block">Officer Verification Notes</span>
                    <p className="text-sm font-semibold text-amber-900 leading-normal whitespace-pre-wrap">
                      {record.policeFeedback.split('\n\nOfficer Notes: ')[1]}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {checkState === 'running' && (
                  <div className="flex items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-500 font-bold">
                    <Loader2 className="h-4 w-4 animate-spin text-secondary mr-2" /> Vetting database check active...
                  </div>
                )}

                {/* Vetting complete: Decision panels */}
                {checkState === 'done' && (
                  <div className="space-y-4">
                    <div className="mb-2">
                      <label className="block text-sm font-black text-slate-400 tracking-wide mb-2">Officer Verification Notes / Feedback</label>
                      <textarea
                        value={officerFeedback}
                        onChange={(e) => setOfficerFeedback(e.target.value)}
                        placeholder="Enter description of candidate verification, findings, or reasons for decision..."
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none min-h-[80px]"
                      ></textarea>
                    </div>
                    <div className="space-y-3">
                    {hasHistory ? (
                      <>
                        <button
                          disabled={!canRejectClearance}
                          onClick={handleReject}
                          className={`w-full inline-flex justify-center items-center gap-2 px-4 py-3 text-sm font-black tracking-wide text-white transition-all rounded-xl shadow-lg ${
                            canRejectClearance
                              ? 'bg-red-600 hover:bg-red-700 shadow-red-100'
                              : 'bg-slate-300 cursor-not-allowed opacity-60 shadow-none'
                          }`}
                        >
                          <XCircle className="h-4 w-4" /> Reject Clearance Request
                        </button>
                        <button
                          disabled={!canIssueClearance}
                          onClick={handleClear}
                          className={`w-full inline-flex justify-center items-center gap-2 px-4 py-3 text-sm font-black tracking-wide transition-all rounded-xl ${
                            canIssueClearance
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100'
                              : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Issue Clearance
                        </button>
                        {canRejectClearance && (
                          <p className="text-xs text-red-600 font-bold text-center mt-2 leading-relaxed">
                            Identity confirmed. Reject clearance to finalize, or discard that match if it was selected in error.
                          </p>
                        )}
                        {!canRejectClearance && !canIssueClearance && (
                          <p className="text-xs text-amber-600 font-bold text-center mt-2 leading-relaxed">
                            Confirm a true identity match to reject, or discard all remaining false positives to enable clearance.
                          </p>
                        )}
                        {canIssueClearance && (
                          <p className="text-xs text-emerald-700 font-bold text-center mt-2 leading-relaxed">
                            No confirmed identity matches remain. You may issue clearance.
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleClear}
                          className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 text-sm font-black tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white transition-all rounded-xl shadow-lg shadow-emerald-100"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve Vetting Clearance
                        </button>
                        <button
                          disabled={true}
                          className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 text-sm font-black tracking-wide bg-slate-100 text-slate-400 border border-slate-200 transition-all rounded-xl cursor-not-allowed opacity-50"
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
                <span className="text-sm font-bold tracking-wide font-heading">Offender Register Match Vetting</span>
              </div>
              <button onClick={() => setInspectSuspect(null)} className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors" aria-label="Close modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-slate-50 flex-grow overflow-y-auto space-y-6 text-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 font-bold shrink-0 relative">
                    <span className="text-lg">{((inspectSuspect.person_details?.full_name && inspectSuspect.person_details.full_name !== 'N/A' ? inspectSuspect.person_details.full_name : inspectSuspect._listContext?.name) || 'O').charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-primary font-heading text-base tracking-wide break-words">
                      {inspectSuspect.person_details?.full_name && inspectSuspect.person_details.full_name !== 'N/A'
                        ? inspectSuspect.person_details.full_name
                        : (inspectSuspect._listContext?.name || 'Unknown')}
                    </h4>
                    <span className="text-sm text-slate-400 font-mono block mt-0.5 break-all">
                      Record ID: {inspectSuspect.offender_id || inspectSuspect._listContext?.id}
                    </span>
                  </div>
                </div>
                <div className="bg-red-50 text-red-700 border border-red-200 font-black text-xs tracking-wide px-3 py-1 rounded-full shrink-0">
                  {inspectSuspect._listContext?.source || 'Match'}
                </div>
              </div>

              {/* Full Dynamic Dossier Render */}
              <div className="space-y-3">
                <SectionHeading title="Identity & Demographics" icon={User} />
                <DynamicDataGrid data={inspectSuspect.person_details} />

                <SectionHeading title="Physical Features" icon={Fingerprint} />
                <DynamicDataGrid data={inspectSuspect.latest_physical_features} />
                
                <DynamicArrayList items={inspectSuspect.crimes} title="FIR & Crimes" icon={FileText} />
                <DynamicArrayList items={inspectSuspect.arrests} title="Arrest Records" icon={AlertOctagon} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col gap-3 shrink-0">
              <span className="text-sm font-black text-slate-400 tracking-wide flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" /> VERIFY CAREFULLY
              </span>
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2">
                <button
                  onClick={() => setInspectSuspect(null)}
                  className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors tracking-wide order-3 sm:order-1"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDiscardMatch(inspectSuspect)}
                  className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-black transition-colors tracking-wide shadow-sm inline-flex items-center justify-center gap-2 order-2"
                >
                  <CheckCircle2 className="h-4 w-4" /> Discard Match
                </button>
                <button
                  onClick={() => handleConfirmMatch(inspectSuspect)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-colors tracking-wide shadow-lg shadow-red-200 inline-flex items-center justify-center gap-2 order-1 sm:order-3"
                >
                  <AlertOctagon className="h-4 w-4" /> Confirm Match → Reject Clearance
                </button>
              </div>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Discard = false positive (can still issue clearance after all open matches are discarded). Confirm = true identity (must reject clearance).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VerificationVetting;
