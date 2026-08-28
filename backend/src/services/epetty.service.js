
import prisma from '../config/db.js';

// Use the details view (has father_name, sex, full address); list view lacks those columns.
let epettyMvReady = false;
async function getEpettyView() {
  if (epettyMvReady) return 'public.mv_e_cases_details';
  try {
    const res = await prisma.$queryRaw`SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_e_cases_details'`;
    if (res && res.length > 0) {
      epettyMvReady = true;
      return 'public.mv_e_cases_details';
    }
  } catch (e) {}
  return 'public.v_e_cases_details';
}

export const fetchEpettyFromDb = async (filters) => {
  const viewName = await getEpettyView();

  let whereClauses = [];
  let params = [];

  if (filters.offdrName) {
    whereClauses.push(`offender_name ILIKE $${params.length + 1}`);
    params.push(`%${filters.offdrName}%`);
  }
  if (filters.offdrMobileNo) {
    whereClauses.push(`offender_mobile LIKE $${params.length + 1}`);
    params.push(`%${filters.offdrMobileNo}%`);
  }
  if (filters.offrFName) {
    whereClauses.push(`father_name ILIKE $${params.length + 1}`);
    params.push(`%${filters.offrFName}%`);
  }
  if (filters.offrOccupation) {
    whereClauses.push(`offender_occupation ILIKE $${params.length + 1}`);
    params.push(`%${filters.offrOccupation}%`);
  }
  if (filters.psName) {
    whereClauses.push(`ps_name ILIKE $${params.length + 1}`);
    params.push(`%${filters.psName}%`);
  }
  if (filters.ecaseNo) {
    whereClauses.push(`case_number ILIKE $${params.length + 1}`);
    params.push(`%${filters.ecaseNo}%`);
  }

  if (whereClauses.length === 0) return [];

  const whereSql = whereClauses.join(' AND ');
  const query = `SELECT * FROM ${viewName} WHERE ${whereSql} LIMIT 50`;

  const results = await prisma.$queryRawUnsafe(query, ...params);

  // Standardize to the shape expected by postFilterMatches, dedupeRecords, and police.controller.js.
  return results.map(r => standardizeEpettyRecord({
    ecaseNo: r.case_number,
    unitName: r.unit_name,
    psName: r.ps_name,
    incidentDate: r.offence_date,
    offenderName: r.offender_name,
    fatherName: r.father_name,
    sex: r.offender_sex,
    age: r.offender_age,
    offdrMobileNo: r.offender_mobile,
    occupation: r.offender_occupation,
    address: r.offender_address || r.present_address,
    sectionName: r.act_section,
    caseStatus: r.disposal_type
  }));
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

const normalizeEpettyText = (value = '') => (value || '').trim().toUpperCase();

const normalizePhone = (value = '') => {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
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

// Collapse duplicate case rows (keys match standardizeEpettyRecord output).
const recordIdentityKey = (record) => [
  record.recordId,
  record.name,
  record.phone,
  record.fatherName,
  record.incidentDate,
  record.offence
].map((v) => (v == null ? '' : String(v).trim().toLowerCase())).join('::');

const dedupeRecords = (records = []) => {
  const seen = new Set();
  return records.filter((record) => {
    const key = recordIdentityKey(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// postFilterMatches reads standardizeEpettyRecord field names (name, phone, fatherName).
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
        matches: await fetchEpettyFromDb(filters),
        lookupError: null
      };
    } catch (error) {
      console.warn(`[ePetty] DB Lookup failed: ${error.message}`);
      return { matches: [], lookupError: "ePetty database is currently unavailable." };
    }
  };

  const unavailable = (lookupError) => ({
    matches: [],
    priorityLabel: null,
    matchedSource: null,
    lookupError
  });

  const steps = buildSearchSteps({ name, phone, father, occupation: role, customFilters: extraFilters });

  // Cascade: try steps strongest-first, return as soon as one has matches.
  // Weaker steps never run once a stronger one hits.
  for (const step of steps) {
    const { matches, lookupError } = await runLookup(step.filters);
    if (lookupError) return unavailable(lookupError);

    // FDW queries can be broad; tighten matches locally before returning.
    const strictMatches = dedupeRecords(postFilterMatches(matches, step.filters));

    if (strictMatches.length > 0) {
      return { matches: strictMatches, priorityLabel: step.label, matchedSource: 'ePetty Case' };
    }
  }

  return { matches: [], priorityLabel: null, matchedSource: null };
};
