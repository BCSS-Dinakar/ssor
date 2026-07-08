import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  SEED_OFFENDERS,
  SEED_CLEARANCES,
  SEED_DISCLOSURES,
  SEED_AUDIT,
  SEED_REPORTS,
  TIERS,
} from '../utils/data/portalData';

const DataContext = createContext(null);

function nowTime() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function pad(n, len) {
  return String(n).padStart(len, '0');
}

export function DataProvider({ children }) {
  const [offenders, setOffenders] = useState(SEED_OFFENDERS);
  const [clearances, setClearances] = useState(SEED_CLEARANCES);
  const [disclosures, setDisclosures] = useState(SEED_DISCLOSURES);
  const [audit, setAudit] = useState(SEED_AUDIT);
  const [reports, setReports] = useState(SEED_REPORTS);

  const logAudit = useCallback((action, who = 'Insp. R. Naidu') => {
    setAudit((prev) => [{ who, action, time: nowTime(), node: '10.22.4.11' }, ...prev]);
  }, []);

  const addOffender = useCallback((data) => {
    const id = `SOR-2026-${pad(700 + Math.floor(Math.random() * 299), 4)}`;
    const tier = TIERS[data.tier];
    const record = {
      id,
      name: data.name,
      age: data.age || '—',
      area: data.area,
      ps: data.ps || '—',
      tier: data.tier,
      offence: data.offence,
      cc: data.cc,
      conv: today(),
      retention: tier ? tier.retention : '—',
      legalStatus: data.legalStatus || 'Under-Trial',
      status: 'active',
      review: '2028-07',
    };
    setOffenders((prev) => [record, ...prev]);
    logAudit(`Registered new record ${id}`);
    return record;
  }, [logAudit]);

  const submitClearance = useCallback((data) => {
    const id = `CLR-2026-${pad(472 + Math.floor(Math.random() * 400), 5)}`;
    const record = {
      id,
      org: data.org,
      type: data.type,
      role: data.role,
      candidate: data.candidate,
      idNumber: data.idNumber || '',
      dob: data.dob || '',
      email: data.email || '',
      phone: data.phone || '',
      consent: data.consent ?? true,
      submitted: today(),
      decisionDate: '',
      status: 'pending',
    };
    setClearances((prev) => [record, ...prev]);
    return record;
  }, []);

  const decideClearance = useCallback((id, decision, matchedSuspect = null, reason = '') => {
    setClearances((prev) => prev.map((c) => (c.id === id ? { ...c, status: decision, decisionDate: today(), matchedSuspect, reason } : c)));
    logAudit(`${decision === 'cleared' ? 'Issued clearance' : 'Rejected clearance'} ${id}`);
  }, [logAudit]);

  const startVerifying = useCallback((id) => {
    setClearances((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'verifying' } : c)));
    logAudit(`Started database verification scan for ${id}`);
  }, [logAudit]);

  const submitDisclosure = useCallback((data) => {
    const id = `DIS-2026-${pad(34 + Math.floor(Math.random() * 400), 4)}`;
    const record = {
      id,
      by: data.by,
      concern: data.concern,
      risk: data.risk,
      submitted: today(),
      status: 'pending',
    };
    setDisclosures((prev) => [record, ...prev]);
    return record;
  }, []);

  const decideDisclosure = useCallback((id, ok) => {
    setDisclosures((prev) => prev.map((d) => (d.id === id ? { ...d, status: ok ? 'approved' : 'declined' } : d)));
    logAudit(`${ok ? 'Approved' : 'Declined'} disclosure ${id}`);
  }, [logAudit]);

  const submitReport = useCallback((data) => {
    const id = `RPT-2026-${pad(92 + Math.floor(Math.random() * 400), 4)}`;
    const record = {
      id,
      summary: data.summary,
      area: data.area,
      anonymous: data.anonymous,
      submitted: today(),
      status: 'new',
    };
    setReports((prev) => [record, ...prev]);
    return record;
  }, []);

  const markReportSeen = useCallback((id) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'reviewed' } : r)));
  }, []);

  const completeReview = useCallback((id) => {
    setOffenders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'active' } : o)));
    logAudit(`Completed retention review for ${id}`);
  }, [logAudit]);

  const counts = useMemo(() => ({
    clearPending: clearances.filter((c) => c.status === 'pending').length,
    discPending: disclosures.filter((d) => d.status === 'pending').length,
    reviewDue: offenders.filter((o) => o.status === 'review').length,
    reportsNew: reports.filter((r) => r.status === 'new').length,
    orgPending: clearances.filter((c) => c.status === 'pending').length,
  }), [clearances, disclosures, offenders, reports]);

  const value = useMemo(() => ({
    offenders,
    clearances,
    disclosures,
    audit,
    reports,
    counts,
    addOffender,
    submitClearance,
    decideClearance,
    startVerifying,
    submitDisclosure,
    decideDisclosure,
    submitReport,
    markReportSeen,
    completeReview,
    logAudit,
  }), [offenders, clearances, disclosures, audit, reports, counts, addOffender, submitClearance, decideClearance, startVerifying, submitDisclosure, decideDisclosure, submitReport, markReportSeen, completeReview, logAudit]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
