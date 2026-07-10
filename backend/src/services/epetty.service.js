import { env } from '../config/env.js';

/**
 * Normalizes API response data into a guaranteed array of objects.
 */
const normalizeApiResponse = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.results && Array.isArray(data.results)) return data.results;
  if (data.personDetails && Array.isArray(data.personDetails)) return data.personDetails;
  if (typeof data === 'object' && Object.keys(data).length > 0 && data.ecaseNo) {
    return [data];
  }
  return [];
};

/**
 * Maps the raw ePetty API schema (e-petty_schema.sql / live endpoint response)
 * into a standardized structure consumed by police controller and frontend UI.
 */
export const standardizeEpettyRecord = (r) => {
  if (!r) return null;
  const rawDate = r.createdDt || r.incidentDate || r.firDate || '';
  const cleanDate = typeof rawDate === 'string' ? rawDate.split(' ')[0] : '—';

  return {
    recordId: r.ecaseNo || r.caseNumber || r.id || '—',
    caseNumber: r.ecaseNo || r.caseNumber || '—',
    name: r.offdrName || r.offenderName || r.name || '—',
    offenderName: r.offdrName || r.offenderName || r.name || '—',
    alias: r.alias || '—',
    age: r.offdrAge || r.age || '—',
    fatherName: r.offrFName || r.fatherName || '—',
    phone: r.offdrMobileNo || r.phone || r.offdrMobile || '—',
    address: r.offenceLocation || r.address || '—',
    landmark: r.offenceLandmark || r.landmark || '—',
    occupation: r.offdrOccupation || r.occupation || '—',
    policeStation: r.psName || r.policeStation || '—',
    unitName: r.unitName || r.district || '—',
    incidentDate: cleanDate || '—',
    dob: cleanDate || '—',
    offence: r.sectionName || r.offenceType || r.offence || '—',
    offenceType: r.sectionName || r.offenceType || r.offence || '—',
    firNo: r.ecaseNo || r.firNo || '—',
    firDate: cleanDate || '—',
    courtName: r.psName ? `PS: ${r.psName}` : (r.courtName || '—'),
    convDate: cleanDate || '—',
    disposalStatus: r.caseStatus === 'C' ? 'Closed' : (r.caseStatus || 'Active'),
    riskTier: r.riskTier || 'Orange'
  };
};

/**
 * Fetches ePetty cases from the external live API using structured filters.
 * Endpoint: POST http://10.121.9.146:8083/api/epettyCase/personDetails
 */
export const fetchEpettyFromApi = async (filters = {}) => {
  const url = env.EPETTY_API_URL || 'http://10.121.9.146:8083/api/epettyCase/personDetails';
  let authHeader = env.EPETTY_BASIC_AUTH || '';

  if (authHeader && !authHeader.startsWith('Basic ')) {
    authHeader = `Basic ${authHeader}`;
  }

  const payload = {
    ecaseNo: filters.ecaseNo || "",
    offdrName: filters.offdrName || "",
    offdrMobileNo: filters.offdrMobileNo || "",
    offrOccupation: filters.offrOccupation || "",
    psName: filters.psName || ""
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  console.log(`\n🔍 [ePetty API Request] POST ${url}`);
  console.log(`🔍 [ePetty API Request] Headers:`, { ...headers, Authorization: authHeader ? '*** [REDACTED] ***' : 'None' });
  console.log(`🔍 [ePetty API Request] Body:`, JSON.stringify(payload, null, 2));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`📥 [ePetty API Response] Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.warn(`⚠️ [ePetty API] Request to ${url} returned status ${response.status}: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log(`📥 [ePetty API Response] Body:`, JSON.stringify(data, null, 2));

    const rawRecords = normalizeApiResponse(data);
    const standardized = rawRecords.map(standardizeEpettyRecord).filter(Boolean);
    console.log(`📊 [ePetty API Service] Standardized ${standardized.length} records.`);
    return standardized;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`❌ [ePetty API] Request to ${url} timed out after 8000ms.`);
    } else {
      console.warn(`❌ [ePetty API] Error connecting to live API (${url}):`, error.message);
    }
    return [];
  }
};

export const searchEpettyCandidate = async (candidateName = '', candidatePhone = '', customFilters = {}) => {
  const cleanName = (candidateName || '').trim();
  let cleanPhone = (candidatePhone || '').replace(/\D/g, '');

  // Normalize: If phone includes country code (e.g. 919848828335), extract last 10 digits
  if (cleanPhone.length > 10) {
    console.log(`ℹ️ [ePetty Search] Truncating phone number ${cleanPhone} to last 10 digits for Indian standard matching.`);
    cleanPhone = cleanPhone.slice(-10);
  }

  // Merge candidate info with custom search filters (fatherName, occupation, psName, ecaseNo, etc.)
  const buildPayload = (stepFilters) => {
    return {
      ecaseNo: customFilters.ecaseNo || stepFilters.ecaseNo || "",
      offdrName: stepFilters.offdrName || customFilters.offdrName || "",
      offdrMobileNo: stepFilters.offdrMobileNo || customFilters.offdrMobileNo || "",
      offrOccupation: customFilters.offrOccupation || stepFilters.offrOccupation || "",
      psName: customFilters.psName || stepFilters.psName || ""
    };
  };

  console.log(`\n🕵️ [ePetty Search] Searching candidate: "${cleanName}" | Phone: "${cleanPhone}" | Custom Filters:`, customFilters);

  if (!cleanName && !cleanPhone && Object.keys(customFilters).length === 0) {
    return { matches: [], priorityLabel: null, matchedSource: null };
  }

  // 1. Try High Priority: Both Name and Mobile number (plus any custom filters)
  if (cleanName && cleanPhone) {
    console.log(`🕵️ [ePetty Search Step 1] Querying High Priority (Exact Name & Phone)...`);
    const highResults = await fetchEpettyFromApi(buildPayload({
      offdrName: cleanName,
      offdrMobileNo: cleanPhone
    }));
    if (highResults.length > 0) {
      console.log(`✅ [ePetty Search] Found High Priority match!`);
      return {
        matches: highResults,
        priorityLabel: 'High Priority (Exact Name & Phone Match)',
        matchedSource: 'ePetty Case'
      };
    }
  }

  // 2. Try Medium Priority: Exact Name only (plus any custom filters)
  if (cleanName) {
    console.log(`🕵️ [ePetty Search Step 2] Querying Medium Priority (Exact Name)...`);
    const medResults = await fetchEpettyFromApi(buildPayload({
      offdrName: cleanName,
      offdrMobileNo: ""
    }));
    if (medResults.length > 0) {
      console.log(`✅ [ePetty Search] Found Medium Priority match!`);
      return {
        matches: medResults,
        priorityLabel: 'Medium Priority (Exact Name Match)',
        matchedSource: 'ePetty Case'
      };
    }
  }

  // 3. Try Low Priority: Exact Phone only (plus any custom filters)
  if (cleanPhone && cleanPhone.length >= 7) {
    console.log(`🕵️ [ePetty Search Step 3] Querying Low Priority (Exact Phone)...`);
    const lowResults = await fetchEpettyFromApi(buildPayload({
      offdrName: "",
      offdrMobileNo: cleanPhone
    }));
    if (lowResults.length > 0) {
      console.log(`✅ [ePetty Search] Found Low Priority match!`);
      return {
        matches: lowResults,
        priorityLabel: 'Low Priority (Exact Phone Match)',
        matchedSource: 'ePetty Case'
      };
    }
  }

  // 4. Try custom filters search directly if candidate details didn't match but custom filters were provided
  if (Object.keys(customFilters).length > 0) {
    console.log(`🕵️ [ePetty Search Step 4] Querying using Custom Filters directly...`);
    const customResults = await fetchEpettyFromApi(buildPayload({}));
    if (customResults.length > 0) {
      console.log(`✅ [ePetty Search] Found Custom Filters match!`);
      return {
        matches: customResults,
        priorityLabel: 'Custom Filter Match',
        matchedSource: 'ePetty Case'
      };
    }
  }

  console.log(`❌ [ePetty Search] No matches found for candidate in ePetty live database.`);
  return { matches: [], priorityLabel: null, matchedSource: null };
};

