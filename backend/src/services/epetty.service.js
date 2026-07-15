import { env } from '../config/env.js';

const normalizeApiResponse = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.personDetails)) return data.personDetails;
  if (typeof data === 'object' && Object.keys(data).length > 0 && data.ecaseNo) return [data];
  return [];
};

export const standardizeEpettyRecord = (record) => {
  if (!record) return null;
  const rawDate = record.createdDt || record.incidentDate || record.firDate || '';
  const cleanDate = typeof rawDate === 'string' ? rawDate.split(' ')[0] : null;

  return {
    recordId: record.ecaseNo || record.caseNumber || record.id || null,
    caseNumber: record.ecaseNo || record.caseNumber || null,
    name: record.offdrName || record.offenderName || record.name || null,
    offenderName: record.offdrName || record.offenderName || record.name || null,
    alias: record.alias || null,
    age: record.offdrAge || record.age || null,
    fatherName: record.offrFName || record.fatherName || null,
    phone: record.offdrMobileNo || record.phone || record.offdrMobile || null,
    address: record.offenceLocation || record.address || null,
    landmark: record.offenceLandmark || record.landmark || null,
    occupation: record.offdrOccupation || record.occupation || null,
    policeStation: record.psName || record.policeStation || null,
    unitName: record.unitName || record.district || null,
    incidentDate: cleanDate,
    dob: cleanDate,
    offence: record.sectionName || record.offenceType || record.offence || null,
    offenceType: record.sectionName || record.offenceType || record.offence || null,
    firNo: record.ecaseNo || record.firNo || null,
    firDate: cleanDate,
    courtName: record.psName ? `PS: ${record.psName}` : (record.courtName || null),
    convDate: cleanDate,
    disposalStatus: record.caseStatus === 'C' ? 'Closed' : (record.caseStatus || null),
    riskTier: record.riskTier || 'Orange',
    source: 'ePetty Case'
  };
};

const describeLookupError = (error) => {
  const cause = error.cause;
  const details = [
    error.message,
    cause?.code,
    cause?.address && cause?.port ? `${cause.address}:${cause.port}` : null,
    cause?.message && cause.message !== error.message ? cause.message : null
  ].filter(Boolean);

  return [...new Set(details)].join(' | ');
};

export const fetchEpettyFromApi = async (filters = {}, options = {}) => {
  if (!env.EPETTY_API_URL) {
    console.warn('[ePetty] EPETTY_API_URL is not configured. Skipping live ePetty lookup.');
    return [];
  }

  let authHeader = env.EPETTY_BASIC_AUTH || '';
  if (authHeader && !authHeader.startsWith('Basic ')) {
    authHeader = `Basic ${authHeader}`;
  }

  const payload = {
    ecaseNo: filters.ecaseNo || '',
    offdrName: filters.offdrName || '',
    offdrMobileNo: filters.offdrMobileNo || '',
    offrOccupation: filters.offrOccupation || '',
    psName: filters.psName || ''
  };

  const headers = { 'Content-Type': 'application/json' };
  if (authHeader) headers.Authorization = authHeader;

  try {
    const response = await fetch(env.EPETTY_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`[ePetty] API returned ${response.status} ${response.statusText}.`);
      return [];
    }

    const data = await response.json();
    return normalizeApiResponse(data).map(standardizeEpettyRecord).filter(Boolean);
  } catch (error) {
    const message = describeLookupError(error);
    if (options.throwOnFailure) {
      throw new Error(message);
    }

    console.warn(`[ePetty] API lookup failed (${env.EPETTY_API_URL}): ${message}`);
    return [];
  }
};

export const searchEpettyCandidate = async (candidateName = '', candidatePhone = '', customFilters = {}) => {
  const cleanName = (candidateName || '').trim();
  let cleanPhone = (candidatePhone || '').replace(/\D/g, '');

  if (cleanPhone.length > 10) {
    cleanPhone = cleanPhone.slice(-10);
  }

  const buildPayload = (stepFilters = {}) => ({
    ecaseNo: customFilters.ecaseNo || stepFilters.ecaseNo || '',
    offdrName: stepFilters.offdrName || customFilters.offdrName || '',
    offdrMobileNo: stepFilters.offdrMobileNo || customFilters.offdrMobileNo || '',
    offrOccupation: customFilters.offrOccupation || stepFilters.offrOccupation || '',
    psName: customFilters.psName || stepFilters.psName || ''
  });

  if (!cleanName && !cleanPhone && Object.keys(customFilters).length === 0) {
    return { matches: [], priorityLabel: null, matchedSource: null };
  }

  const runLookup = async (filters) => {
    try {
      return {
        matches: await fetchEpettyFromApi(filters, { throwOnFailure: true }),
        lookupError: null
      };
    } catch (error) {
      console.warn(`[ePetty] API lookup failed (${env.EPETTY_API_URL}): ${error.message}`);
      return { matches: [], lookupError: error.message };
    }
  };

  const unavailable = (lookupError) => ({
    matches: [],
    priorityLabel: null,
    matchedSource: null,
    lookupError
  });

  if (cleanName && cleanPhone) {
    const { matches, lookupError } = await runLookup(buildPayload({ offdrName: cleanName, offdrMobileNo: cleanPhone }));
    if (lookupError) return unavailable(lookupError);
    if (matches.length > 0) {
      return { matches, priorityLabel: 'High Priority (Exact Name & Phone Match)', matchedSource: 'ePetty Case' };
    }
  }

  if (cleanName) {
    const { matches, lookupError } = await runLookup(buildPayload({ offdrName: cleanName }));
    if (lookupError) return unavailable(lookupError);
    if (matches.length > 0) {
      return { matches, priorityLabel: 'Medium Priority (Exact Name Match)', matchedSource: 'ePetty Case' };
    }
  }

  if (cleanPhone && cleanPhone.length >= 7) {
    const { matches, lookupError } = await runLookup(buildPayload({ offdrMobileNo: cleanPhone }));
    if (lookupError) return unavailable(lookupError);
    if (matches.length > 0) {
      return { matches, priorityLabel: 'Low Priority (Exact Phone Match)', matchedSource: 'ePetty Case' };
    }
  }

  if (Object.keys(customFilters).length > 0) {
    const { matches, lookupError } = await runLookup(buildPayload());
    if (lookupError) return unavailable(lookupError);
    if (matches.length > 0) {
      return { matches, priorityLabel: 'Custom Filter Match', matchedSource: 'ePetty Case' };
    }
  }

  return { matches: [], priorityLabel: null, matchedSource: null };
};
