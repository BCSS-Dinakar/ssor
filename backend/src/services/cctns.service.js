import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';

export const CLEARANCE_ACCUSED_MV = 'public.mv_clearance_accused_search';
const CLEARANCE_ACCUSED_V = 'public.v_clearance_accused_search';

/** CCTNS clearance search order / subcategory metadata */
export const CCTNS_MATCH_CATEGORIES = {
  aadhaar_name: {
    key: 'aadhaar_name',
    label: 'Aadhaar + name exact match',
    params: ['aadhaar', 'name'],
    confidence: 100,
    priorityLabel: 'High Priority (Exact Aadhaar & Name Match)'
  },
  aadhaar: {
    key: 'aadhaar',
    label: 'Aadhaar exact match',
    params: ['aadhaar'],
    confidence: 98,
    priorityLabel: 'High Priority (Exact Aadhaar Match)'
  },
  name_phone: {
    key: 'name_phone',
    label: 'Name + phone exact',
    params: ['name', 'phone'],
    confidence: 95,
    priorityLabel: 'High Priority (Exact Name & Phone Match)'
  },
  name_phone_father: {
    key: 'name_phone_father',
    label: 'Name + phone + father exact',
    params: ['name', 'phone', 'father'],
    confidence: 97,
    priorityLabel: 'High Priority (Exact Name, Phone & Father Match)'
  },
  name_father: {
    key: 'name_father',
    label: 'Name + father exact',
    params: ['name', 'father'],
    confidence: 88,
    priorityLabel: 'Medium Priority (Exact Name & Father Match)'
  },
  name: {
    key: 'name',
    label: 'Name exact',
    params: ['name'],
    confidence: 82,
    priorityLabel: 'Medium Priority (Exact Name Match)'
  },
  phone: {
    key: 'phone',
    label: 'Phone exact',
    params: ['phone'],
    confidence: 68,
    priorityLabel: 'Low Priority (Exact Phone Match)'
  },
  phone_father: {
    key: 'phone_father',
    label: 'Phone + father exact',
    params: ['phone', 'father'],
    confidence: 72,
    priorityLabel: 'Low Priority (Exact Phone & Father Match)'
  },
  father: {
    key: 'father',
    label: 'Father exact',
    params: ['father'],
    confidence: 58,
    priorityLabel: 'Medium Priority (Exact Father Match)'
  },
  fuzzy: {
    key: 'fuzzy',
    label: 'Trigram fuzzy name fallback',
    params: ['name'],
    confidence: 45,
    priorityLabel: 'Fuzzy Name Match'
  }
};

export const normalizeName = (value = '') =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

export const normalizePhone = (value = '') => {
  let digits = (value || '').replace(/\D/g, '');
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits;
};

export const normalizeAadhaar = (value = '') => (value || '').replace(/\D/g, '');

const formatDate = (value) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB');
};

const fuzzyConfidence = (similarity) => {
  const sim = Number(similarity);
  if (!Number.isFinite(sim)) return CCTNS_MATCH_CATEGORIES.fuzzy.confidence;
  return Math.max(40, Math.min(75, Math.round(40 + sim * 35)));
};

// mv_clearance_accused_search.highest_risk_tier comes straight from
// ssor_kb.tier, which is UPPERCASE ('RED'/'ORANGE'/'BLUE'/'BLACK'/'PINK').
// The frontend's tier-color map (VerificationVetting.js) keys on TitleCase
// ('Red'/'Orange'/...), so reformat here rather than push that knowledge
// into the UI. Falls back to 'Orange' — same default as before this was wired
// up — for the ~25% of rows with no computed tier, or the live-CTE fallback
// path which doesn't compute one at all.
const KNOWN_RISK_TIERS = new Set(['RED', 'ORANGE', 'BLUE', 'BLACK', 'PINK', 'GREEN']);
const formatRiskTier = (tier) => {
  const upper = String(tier || '').trim().toUpperCase();
  if (!KNOWN_RISK_TIERS.has(upper)) return 'Orange';
  return upper.charAt(0) + upper.slice(1).toLowerCase();
};

export const mapCctnsRowToSuspect = (row, categoryKey, confidenceOverride = null) => {
  const category = CCTNS_MATCH_CATEGORIES[categoryKey] || CCTNS_MATCH_CATEGORIES.fuzzy;
  const confidence =
    confidenceOverride != null ? confidenceOverride : category.confidence;

  return {
    id: row.offender_id,
    name: row.offender_name,
    alias: row.offender_alias || '—',
    age: row.age ?? '—',
    fatherName: row.match_father_name || '—',
    dob: formatDate(row.match_dob),
    phone: row.match_phone || '—',
    address: '—',
    offence: row.acts_sections || row.crime_type || '—',
    firNo: row.fir_num || row.fir_reg_num || '—',
    firDate: formatDate(row.fir_date),
    courtName: row.court_name || row.police_station || '—',
    convDate: '—',
    riskTier: formatRiskTier(row.highest_risk_tier),
    source: 'CCTNS',
    sourceType: 'cctns',
    priority: category.priorityLabel,
    matchCategory: category.key,
    matchCategoryLabel: category.label,
    matchParams: category.params,
    confidence,
    nameSimilarity: row.name_similarity != null ? Number(row.name_similarity) : null
  };
};

const getErrorText = (error) => {
  const nested = error?.meta?.driverAdapterError;
  return [
    error?.message,
    error?.code,
    error?.meta?.code,
    nested?.message,
    nested?.cause?.message,
    nested?.cause?.kind,
    typeof error?.meta === 'object' ? JSON.stringify(error.meta) : null
  ]
    .filter(Boolean)
    .join(' | ')
    .toLowerCase();
};

const isMvMissingError = (error) => {
  const text = getErrorText(error);
  return (
    (text.includes('mv_clearance_accused_search') || text.includes('42p01')) &&
    (text.includes('does not exist') || text.includes('undefined_table'))
  );
};

const isTimeoutError = (error) => {
  const text = getErrorText(error);
  return text.includes('timeout') || text.includes('timed out') || text.includes('sockettimeout');
};

// Prefer the materialized view (fast, indexed); fall back to the plain view
// (always live, no build/refresh needed) if the MV isn't built yet — same
// pg_matviews-check-and-cache pattern as getActiveView() in
// police.controller.js and getEpettyView() in epetty.service.js. Both views
// expose identical column names (see db/clearance_accused_search_view.sql),
// so nothing downstream needs to know which one is active.
let clearanceViewReady = false;
const getClearanceView = async () => {
  if (clearanceViewReady) return Prisma.raw(CLEARANCE_ACCUSED_MV);
  try {
    const res = await prisma.$queryRaw`SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_clearance_accused_search'`;
    if (res && res.length > 0) {
      clearanceViewReady = true;
      return Prisma.raw(CLEARANCE_ACCUSED_MV);
    }
  } catch (e) {}
  return Prisma.raw(CLEARANCE_ACCUSED_V);
};

const runAccusedSearch = async (whereClause, orderClause = Prisma.empty, limit = 10, { fuzzy = false, normName = '' } = {}) => {
  const fromSource = await getClearanceView();

  if (fuzzy) {
    return prisma.$queryRaw`
      SELECT
        src.*,
        similarity(src.search_name_norm, ${normName}) AS name_similarity
      FROM ${fromSource} AS src
      WHERE src.search_name_norm LIKE ${'%' + normName + '%'}
      ORDER BY similarity(src.search_name_norm, ${normName}) DESC
      LIMIT ${limit}
    `;
  }

  return prisma.$queryRaw`
    SELECT *
    FROM ${fromSource} AS src
    WHERE ${whereClause}
    ${orderClause}
    LIMIT ${limit}
  `;
};

const searchHigh = (normName, normPhone) =>
  runAccusedSearch(Prisma.sql`
    src.search_name_norm LIKE ${'%' + normName + '%'}
    AND src.match_phone_norm LIKE ${'%' + normPhone + '%'}
    AND src.match_phone_norm <> ''
  `);

const fatherNormSql = (normFather) => Prisma.sql`
  lower(regexp_replace(COALESCE(src.match_father_name, ''), '\\s+', ' ', 'g')) LIKE ${'%' + normFather + '%'}
  AND COALESCE(src.match_father_name, '') <> ''
`;

const searchNamePhoneFather = (normName, normPhone, normFather) =>
  runAccusedSearch(Prisma.sql`
    src.search_name_norm LIKE ${'%' + normName + '%'}
    AND src.match_phone_norm LIKE ${'%' + normPhone + '%'}
    AND src.match_phone_norm <> ''
    AND ${fatherNormSql(normFather)}
  `);

const searchNameFather = (normName, normFather) =>
  runAccusedSearch(Prisma.sql`
    src.search_name_norm LIKE ${'%' + normName + '%'}
    AND ${fatherNormSql(normFather)}
  `);

const searchPhoneFather = (normPhone, normFather) =>
  runAccusedSearch(Prisma.sql`
    src.match_phone_norm LIKE ${'%' + normPhone + '%'}
    AND length(src.match_phone_norm) >= 7
    AND ${fatherNormSql(normFather)}
  `);

const searchFather = (normFather) =>
  runAccusedSearch(Prisma.sql`${fatherNormSql(normFather)}`);

const searchMedium = (normName) =>
  runAccusedSearch(Prisma.sql`src.search_name_norm LIKE ${'%' + normName + '%'}`);

const searchLow = (normPhone) =>
  runAccusedSearch(Prisma.sql`
    src.match_phone_norm LIKE ${'%' + normPhone + '%'}
    AND length(src.match_phone_norm) >= 7
  `);

const searchAadhaar = (normAadhaar) =>
  runAccusedSearch(Prisma.sql`
    regexp_replace(COALESCE(src.match_aadhaar, ''), '\\D', '', 'g') = ${normAadhaar}
  `);

const searchFallback = (normName) =>
  runAccusedSearch(Prisma.empty, Prisma.empty, 10, { fuzzy: true, normName });

const buildOutcome = (rows, categoryKey) => {
  const category = CCTNS_MATCH_CATEGORIES[categoryKey];
  const matches = rows.map((row) => {
    if (categoryKey === 'fuzzy') {
      return mapCctnsRowToSuspect(row, categoryKey, fuzzyConfidence(row.name_similarity));
    }
    return mapCctnsRowToSuspect(row, categoryKey);
  });

  return {
    matches,
    priorityLabel: category.priorityLabel,
    matchedSource: 'CCTNS',
    matchCategory: category.key,
    matchCategoryLabel: category.label
  };
};

const isHighOrMediumPriority = (priorityLabel = '') =>
  priorityLabel.includes('High Priority') || priorityLabel.includes('Medium Priority');

const postFilterMatches = (matches, { normName, normPhone, normFather }) => {
  return matches.filter(record => {
    if (normName) {
      const recordName = (record.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (!recordName.includes(normName)) return false;
    }
    if (normPhone) {
      const recordPhone = record.phone || '';
      if (!recordPhone.includes(normPhone)) return false;
    }
    if (normFather) {
      const recordFather = (record.fatherName || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (!recordFather.includes(normFather)) return false;
    }
    return true;
  });
};

/**
 * Search CCTNS accused records for clearance vetting.
 * Prefers mv_clearance_accused_search; falls back to live accused/persons joins.
 */
export const searchCctnsCandidate = async ({
  candidateName = '',
  candidatePhone = '',
  aadharNumber = '',
  fatherName = ''
} = {}) => {
  const normName = normalizeName(candidateName);
  const normPhone = normalizePhone(candidatePhone);
  const normAadhaar = normalizeAadhaar(aadharNumber);
  const normFather = normalizeName(fatherName);

  if (!normName && !normPhone && !normAadhaar && !normFather) {
    return { matches: [], priorityLabel: null, matchedSource: null, matchCategory: null };
  }

  try {
    if (normAadhaar) {
      const rows = await searchAadhaar(normAadhaar);
      if (rows.length > 0) {
        // Aadhaar number is a unique government ID, but the record it's
        // attached to could still carry a mismatched/misspelled name (data
        // entry noise) — only stamp the full 100% "corroborated" confidence
        // when the candidate's provided name also matches this same record.
        if (normName) {
          const aadhaarNameOutcome = buildOutcome(rows, 'aadhaar_name');
          aadhaarNameOutcome.matches = postFilterMatches(aadhaarNameOutcome.matches, { normName });
          if (aadhaarNameOutcome.matches.length > 0) return aadhaarNameOutcome;
        }
        // Aadhaar matched but the name didn't corroborate (or wasn't provided)
        // — still surface it, just at the lower aadhaar-only confidence.
        return buildOutcome(rows, 'aadhaar');
      }
    }

    const checkAndReturn = (rows, categoryKey) => {
      const outcome = buildOutcome(rows, categoryKey);
      const category = CCTNS_MATCH_CATEGORIES[categoryKey];
      const filterCriteria = {};

      if (category.params.includes('name')) filterCriteria.normName = normName;
      if (category.params.includes('phone')) filterCriteria.normPhone = normPhone;
      if (category.params.includes('father')) filterCriteria.normFather = normFather;

      outcome.matches = postFilterMatches(outcome.matches, filterCriteria);
      if (outcome.matches.length > 0) return outcome;
      return null;
    };

    if (normName && normPhone && normFather) {
      const rows = await searchNamePhoneFather(normName, normPhone, normFather);
      if (rows.length > 0) {
        const result = checkAndReturn(rows, 'name_phone_father');
        if (result) return result;
      }
    }

    if (normName && normPhone) {
      const rows = await searchHigh(normName, normPhone);
      if (rows.length > 0) {
        const result = checkAndReturn(rows, 'name_phone');
        if (result) return result;
      }
    }

    if (normName && normFather) {
      const rows = await searchNameFather(normName, normFather);
      if (rows.length > 0) {
        const result = checkAndReturn(rows, 'name_father');
        if (result) return result;
      }
    }

    if (normName) {
      const rows = await searchMedium(normName);
      if (rows.length > 0) {
        const result = checkAndReturn(rows, 'name');
        if (result) return result;
      }
    }

    if (normPhone && normPhone.length >= 7 && normFather) {
      const rows = await searchPhoneFather(normPhone, normFather);
      if (rows.length > 0) {
        const result = checkAndReturn(rows, 'phone_father');
        if (result) return result;
      }
    }

    if (normPhone && normPhone.length >= 7) {
      const rows = await searchLow(normPhone);
      if (rows.length > 0) {
        const result = checkAndReturn(rows, 'phone');
        if (result) return result;
      }
    }

    if (normFather) {
      const rows = await searchFather(normFather);
      if (rows.length > 0) {
        const result = checkAndReturn(rows, 'father');
        if (result) return result;
      }
    }

    if (normName) {
      const rows = await searchFallback(normName);
      if (rows.length > 0) {
        const result = checkAndReturn(rows, 'fuzzy');
        if (result) return result;
      }
    }

    return { matches: [], priorityLabel: null, matchedSource: null, matchCategory: null };
  } catch (error) {
    const detail = getErrorText(error);
    console.error('[CCTNS] Accused search failed:', detail);

    let lookupError = error.message || 'CCTNS accused search failed.';
    if (isTimeoutError(error)) {
      lookupError = 'CCTNS database timed out. Check network connectivity to the Postgres host used by DATABASE_URL.';
    } else if (isMvMissingError(error)) {
      // getClearanceView() already falls back mv_clearance_accused_search -> v_clearance_accused_search
      // proactively, so reaching this means BOTH are gone — confirm the source tables/mv_offender_details exist.
      lookupError = 'CCTNS search view/tables unavailable. Confirm cctns_etl.accused/persons and mv_offender_details exist, and recreate v_clearance_accused_search / mv_clearance_accused_search from db/clearance_accused_search_view.sql.';
    }

    return {
      matches: [],
      priorityLabel: null,
      matchedSource: null,
      matchCategory: null,
      lookupError
    };
  }
};

export const shouldSkipEpettyAfterCctns = (cctnsOutcome) => false;
