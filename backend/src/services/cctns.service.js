import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';

export const CLEARANCE_ACCUSED_MV = 'public.mv_clearance_accused_search';

/** CCTNS clearance search order / subcategory metadata */
export const CCTNS_MATCH_CATEGORIES = {
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
    riskTier: 'Orange',
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

/** Live CTE matching the materialized view — used when MV is unavailable */
const LIVE_ACCUSED_SEARCH_FROM = Prisma.raw(`(
  WITH accused_latest AS (
    SELECT DISTINCT ON (p.person_id)
      p.person_id AS offender_id,
      COALESCE(
        p.full_name,
        p.raw_full_name,
        NULLIF(TRIM(CONCAT(COALESCE(p.name, ''), ' ', COALESCE(p.surname, ''))), '')
      ) AS offender_name,
      p.alias AS offender_alias,
      p.date_of_birth,
      p.age,
      p.relative_name AS father_name,
      p.phone_number,
      p.phone_numbers,
      a.accused_status,
      c.fir_num,
      c.fir_reg_num,
      c.fir_date,
      c.acts_sections,
      c.crime_type,
      c.court_name,
      h.ps_name AS police_station,
      lower(regexp_replace(
        COALESCE(
          p.full_name,
          p.raw_full_name,
          NULLIF(TRIM(CONCAT(COALESCE(p.name, ''), ' ', COALESCE(p.surname, ''))), '')
        ),
        '\\s+', ' ', 'g'
      )) AS search_name_norm,
      right(regexp_replace(COALESCE(p.phone_number, p.phone_numbers, ''), '\\D', '', 'g'), 10) AS search_phone_norm
    FROM public.accused a
    JOIN public.persons p ON a.person_id = p.person_id
    JOIN public.crimes c ON a.crime_id = c.crime_id
    LEFT JOIN public.hierarchy h ON c.ps_code = h.ps_code
    ORDER BY p.person_id, c.fir_date DESC NULLS LAST
  ),
  fpb_latest AS (
    SELECT DISTINCT ON (person_id)
      person_id,
      phone_number,
      dob,
      father_husband_name,
      aadhaar_or_other_id_number
    FROM public.fpb_accused
    WHERE person_id IS NOT NULL
    ORDER BY person_id, date_fetched DESC NULLS LAST
  )
  SELECT
    ac.offender_id,
    ac.offender_name,
    ac.offender_alias,
    ac.date_of_birth,
    ac.age,
    ac.father_name,
    ac.phone_number,
    ac.phone_numbers,
    ac.accused_status,
    ac.fir_num,
    ac.fir_reg_num,
    ac.fir_date,
    ac.acts_sections,
    ac.crime_type,
    ac.court_name,
    ac.police_station,
    ac.search_name_norm,
    ac.search_phone_norm,
    COALESCE(f.phone_number, ac.phone_number) AS match_phone,
    COALESCE(f.dob, ac.date_of_birth) AS match_dob,
    COALESCE(f.father_husband_name, ac.father_name) AS match_father_name,
    f.aadhaar_or_other_id_number AS match_aadhaar,
    right(regexp_replace(
      COALESCE(f.phone_number, ac.phone_number, ac.phone_numbers, ''), '\\D', '', 'g'
    ), 10) AS match_phone_norm
  FROM accused_latest ac
  LEFT JOIN fpb_latest f ON f.person_id = ac.offender_id
)`);

let preferLiveFallback = false;

const runAccusedSearch = async (whereClause, orderClause = Prisma.empty, limit = 10, { fuzzy = false, normName = '' } = {}) => {
  const fromSource = preferLiveFallback
    ? LIVE_ACCUSED_SEARCH_FROM
    : Prisma.raw(CLEARANCE_ACCUSED_MV);

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

const runWithMvFallback = async (queryFn) => {
  try {
    return await queryFn();
  } catch (error) {
    if (!preferLiveFallback && isMvMissingError(error)) {
      console.warn('[CCTNS] mv_clearance_accused_search unavailable — falling back to live accused/persons query.');
      preferLiveFallback = true;
      return queryFn();
    }
    throw error;
  }
};

const searchHigh = (normName, normPhone) =>
  runWithMvFallback(() =>
    runAccusedSearch(Prisma.sql`
      src.search_name_norm LIKE ${'%' + normName + '%'}
      AND src.match_phone_norm LIKE ${'%' + normPhone + '%'}
      AND src.match_phone_norm <> ''
    `)
  );

const fatherNormSql = (normFather) => Prisma.sql`
  lower(regexp_replace(COALESCE(src.match_father_name, ''), '\\s+', ' ', 'g')) LIKE ${'%' + normFather + '%'}
  AND COALESCE(src.match_father_name, '') <> ''
`;

const searchNamePhoneFather = (normName, normPhone, normFather) =>
  runWithMvFallback(() =>
    runAccusedSearch(Prisma.sql`
      src.search_name_norm LIKE ${'%' + normName + '%'}
      AND src.match_phone_norm LIKE ${'%' + normPhone + '%'}
      AND src.match_phone_norm <> ''
      AND ${fatherNormSql(normFather)}
    `)
  );

const searchNameFather = (normName, normFather) =>
  runWithMvFallback(() =>
    runAccusedSearch(Prisma.sql`
      src.search_name_norm LIKE ${'%' + normName + '%'}
      AND ${fatherNormSql(normFather)}
    `)
  );

const searchPhoneFather = (normPhone, normFather) =>
  runWithMvFallback(() =>
    runAccusedSearch(Prisma.sql`
      src.match_phone_norm LIKE ${'%' + normPhone + '%'}
      AND length(src.match_phone_norm) >= 7
      AND ${fatherNormSql(normFather)}
    `)
  );

const searchFather = (normFather) =>
  runWithMvFallback(() =>
    runAccusedSearch(Prisma.sql`${fatherNormSql(normFather)}`)
  );

const searchMedium = (normName) =>
  runWithMvFallback(() =>
    runAccusedSearch(Prisma.sql`src.search_name_norm LIKE ${'%' + normName + '%'}`)
  );

const searchLow = (normPhone) =>
  runWithMvFallback(() =>
    runAccusedSearch(Prisma.sql`
      src.match_phone_norm LIKE ${'%' + normPhone + '%'}
      AND length(src.match_phone_norm) >= 7
    `)
  );

const searchAadhaar = (normAadhaar) =>
  runWithMvFallback(() =>
    runAccusedSearch(Prisma.sql`
      regexp_replace(COALESCE(src.match_aadhaar, ''), '\\D', '', 'g') = ${normAadhaar}
    `)
  );

const searchFallback = (normName) =>
  runWithMvFallback(() =>
    runAccusedSearch(Prisma.empty, Prisma.empty, 10, { fuzzy: true, normName })
  );

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
      if (rows.length > 0) return buildOutcome(rows, 'aadhaar');
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
      lookupError = 'CCTNS search view/tables unavailable. Confirm accused/persons exist and optionally recreate mv_clearance_accused_search.';
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

export const shouldSkipEpettyAfterCctns = (cctnsOutcome) =>
  isHighOrMediumPriority(cctnsOutcome?.priorityLabel || '');
