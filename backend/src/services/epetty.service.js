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

const normalizeEpettyText = (value = '') => (value || '').trim().toUpperCase();

const normalizePhone = (value = '') => {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
};

const getApiSearchName = (name) => {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  const coreWords = words.filter(w => w.length > 1);
  return coreWords.length > 0 ? coreWords.join(' ') : name;
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
    offdrName: normalizeEpettyText(filters.offdrName),
    offdrMobileNo: normalizePhone(filters.offdrMobileNo),
    offrFName: normalizeEpettyText(filters.offrFName),
    offrOccupation: normalizeEpettyText(filters.offrOccupation),
    psName: normalizeEpettyText(filters.psName)
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

const buildSearchSteps = ({ name, phone, father, occupation, customFilters = {} }) => {
  const steps = [];
  const seen = new Set();
  const add = (label, filters) => {
    const key = JSON.stringify(filters);
    if (seen.has(key)) return;
    seen.add(key);
    steps.push({ label, filters: { ...customFilters, ...filters } });
  };

  if (name && phone && father && occupation) {
    add('High Priority (Name, Phone, Father & Occupation Match)', {
      offdrName: name, offdrMobileNo: phone, offrFName: father, offrOccupation: occupation
    });
  }
  if (name && phone && father) {
    add('High Priority (Name, Phone & Father Match)', {
      offdrName: name, offdrMobileNo: phone, offrFName: father
    });
    add('High Priority (Dynamic Name, Phone & Father Match)', {
      offdrMobileNo: phone, offrFName: father, _dynamicName: name
    });
  }
  if (name && phone) {
    add('High Priority (Exact Name & Phone Match)', { offdrName: name, offdrMobileNo: phone });
    add('High Priority (Dynamic Name & Phone Match)', { offdrMobileNo: phone, _dynamicName: name });
  }
  if (phone && phone.length >= 7 && father) {
    add('High Priority (Phone & Father Match)', { offdrMobileNo: phone, offrFName: father });
  }
  if (phone && phone.length >= 7) {
    add('High Priority (Exact Phone Match)', { offdrMobileNo: phone });
  }
  if (name && father) {
    add('Medium Priority (Name & Father Match)', { offdrName: name, offrFName: father });
  }
  if (name && occupation) {
    add('Medium Priority (Name & Occupation Match)', { offdrName: name, offrOccupation: occupation });
  }
  if (father && !name && !phone) {
    add('Medium Priority (Father Name Match)', { offrFName: father });
  }
  if (name) {
    add('Low Priority (Exact Name Match)', { offdrName: name });
  }
  if (occupation && !name && !phone && !father) {
    add('Custom Filter Match', { offrOccupation: occupation });
  }

  const validCustomFilters = Object.fromEntries(
    Object.entries(customFilters).filter(([_, v]) => v)
  );

  if (Object.keys(validCustomFilters).length > 0) {
    add('Custom Filter Match', validCustomFilters);
  }

  return steps;
};

const isNameMatch = (searchStr, recordStr) => {
  const cleanSearch = (searchStr || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanRecord = (recordStr || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  if (!cleanSearch) return true; // If no valid search string, count as match

  const searchParts = cleanSearch.split(/\s+/).map(part => {
    if (part.length === 1) {
      return part + '[a-z0-9]*';
    }
    return part;
  }).filter(Boolean);

  if (searchParts.length > 0) {
    const regexStr = searchParts.join('\\s+');
    const regex = new RegExp(regexStr);
    return regex.test(cleanRecord);
  }

  return true;
};

const postFilterMatches = (matches, filters) => {
  return matches.filter(record => {
    // Ensure the record name strictly includes the requested search name, allowing initials to match full words
    if (filters.offdrName && !isNameMatch(filters.offdrName, record.name)) {
      return false;
    }

    if (filters._dynamicName && !isNameMatch(filters._dynamicName, record.name)) {
      return false;
    }

    // Ensure the record phone strictly includes the requested phone number
    if (filters.offdrMobileNo) {
      const searchPhone = filters.offdrMobileNo;
      const recordPhone = record.phone || '';
      if (!recordPhone.includes(searchPhone)) {
        return false;
      }
    }

    // Ensure the record father's name strictly includes the requested father's name, allowing initials to match full words
    if (filters.offrFName && !isNameMatch(filters.offrFName, record.fatherName)) {
      return false;
    }

    return true;
  });
};

export async function searchEpettyCandidate(input = {}, legacyPhone = '', legacyCustom = {}) {
  const options = typeof input === 'string'
    ? { candidateName: input, candidatePhone: legacyPhone, ...legacyCustom }
    : input;

  const {
    candidateName = '',
    candidatePhone = '',
    fatherName = '',
    occupation = '',
    ecaseNo = '',
    offdrName = '',
    offdrMobileNo = '',
    offrFName = '',
    offrOccupation = '',
    psName = '',
  } = options;

  const name = (candidateName || offdrName || '').trim();
  const phone = normalizePhone(candidatePhone || offdrMobileNo);
  const father = (fatherName || offrFName || '').trim();
  const role = (occupation || offrOccupation || '').trim();
  const extraFilters = { ecaseNo, psName };

  const hasSearchInput = name || phone || father || role || ecaseNo || psName;
  if (!hasSearchInput) {
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
      let errMsg = error.message;
      const lowerMsg = errMsg.toLowerCase();
      if (lowerMsg.includes('timeout') || lowerMsg.includes('fetch failed') || lowerMsg.includes('und_err') || lowerMsg.includes('econnrefused')) {
        errMsg = "ePetty server is currently down or not responding.";
      }
      return { matches: [], lookupError: errMsg };
    }
  };

  const unavailable = (lookupError) => ({
    matches: [],
    priorityLabel: null,
    matchedSource: null,
    lookupError
  });

  const steps = buildSearchSteps({ name, phone, father, occupation: role, customFilters: extraFilters });

  for (const step of steps) {
    const { matches, lookupError } = await runLookup(step.filters);
    if (lookupError) return unavailable(lookupError);
    
    // The external API often returns very broad matches.
    // We post-filter locally to ensure the records strictly match the requested criteria (e.g. exactly 'sai kiran').
    const strictMatches = postFilterMatches(matches, step.filters);

    if (strictMatches.length > 0) {
      return { matches: strictMatches, priorityLabel: step.label, matchedSource: 'ePetty Case' };
    }
  }

  return { matches: [], priorityLabel: null, matchedSource: null };
};
