-- =============================================================================
-- SSOR Clearance Accused Search — run this entire script in pgAdmin Query Tool
-- =============================================================================
-- Creates v_clearance_accused_search (plain view, always live) and
-- mv_clearance_accused_search (materialized snapshot, fast) for CCTNS accused
-- matching during clearance vetting — mirroring the v_/mv_ pattern already
-- used for offenders_list and offender_details (see offenders_list_views.sql,
-- offender_details_views.sql): the app prefers the materialized view, and
-- falls back to the plain view if the MV isn't built/ready yet (checked via
-- pg_matviews in cctns.service.js's getClearanceView(), same as
-- police.controller.js's getActiveView() and epetty.service.js's
-- getEpettyView()).
--
-- IMPORTANT — the two views are NOT chained to each other:
--   - v_clearance_accused_search queries cctns_etl.* directly (independent,
--     so it still works even if every mv_* in this database is stale/missing
--     — that's the whole point of a fallback).
--   - mv_clearance_accused_search reads FROM public.mv_offender_details (see
--     v3 note below) for speed and to reuse its highest_risk_tier/JSONB
--     extraction instead of duplicating it.
-- Both expose the SAME output columns (match_phone/match_dob/
-- match_father_name/match_aadhaar/match_phone_norm/search_name_norm/
-- highest_risk_tier/...) since cctns.service.js's WHERE clauses query those
-- names regardless of which one is active.
--
-- v3 (2026-08): rebuilt mv_clearance_accused_search to read FROM
-- public.mv_offender_details instead of re-joining cctns_etl.accused/
-- persons/crimes independently. mv_offender_details is the single source of
-- truth already used for the officer's full-dossier "Inspect" view
-- (getOffenderById) — building the search index off the same view means:
--   - highest_risk_tier is now real (ssor_kb-derived, ~75% filled) instead of
--     the hardcoded 'Orange' every match previously showed in the UI.
--   - father/phone JSONB extraction logic isn't duplicated between two views.
-- mv_offender_details aggregates ALL of a person's crimes into one JSONB
-- array (crimes), so a LATERAL join picks the single most recent one (by
-- fir_date) to populate fir_num/acts_sections/court_name/etc — matching the
-- old "latest crime per person" semantics. fir_date inside that JSONB is a
-- full ISO timestamp ('2022-06-06T15:30:00.571Z'), not a bare date.
-- Added v_clearance_accused_search in this same pass: cctns.service.js
-- previously had no real fallback view object — it reactively caught a
-- "relation does not exist" error and retried with an inline CTE
-- (LIVE_ACCUSED_SEARCH_FROM). That logic is what's now persisted here as a
-- real view, plus the risk-tier LATERAL join (same pattern as
-- v_offenders_list) which the inline CTE never had.
--
-- v2 (2026-08) changes (carried forward):
--   - Fixed a schema-qualification bug (`public.accused` -> `cctns_etl.accused`)
--     that aborted the transaction and silently prevented mv_clearance_accused_search
--     from ever being created — the app ran on the slow live-CTE fallback in
--     cctns.service.js in the meantime.
--   - cctns_etl.persons.dob / father_husband_name and cctns_etl.fpb_accused
--     are unpopulated on this environment (fpb_accused has 0 rows; the flat
--     dob/father_husband_name columns are 100% NULL). Real data — where it
--     exists — lives in persons.personal_details / persons.contact_details
--     JSONB (covers ~1.2% of persons). Both views fall back to it, so real
--     matches surface where the data exists. Aadhaar still has no clean
--     source field (fpb_accused.aadhaar_or_other_id is JSONB with unknown
--     internal keys, and the table has 0 rows to sample) and stays NULL — an
--     Aadhaar search simply returns no match when the value isn't present.
--   - Dropped the dead `search_phone_norm` column (always computed from an
--     empty literal, never read by the app — match_phone_norm was already
--     the real phone-matching column).
--   - Added a trigram index on the normalized father name so father-name
--     searches (currently a full-table LIKE scan) can use an index.
--
-- After initial run:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_clearance_accused_search;
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 1. STANDARD VIEW (always live — independent of any mv_*, direct from cctns_etl.*)
-- =============================================================================

CREATE OR REPLACE VIEW public.v_clearance_accused_search AS
WITH accused_latest AS (
    SELECT DISTINCT ON (p.person_id)
        p.person_id AS offender_id,
        p.full_name AS offender_name,
        p.alias AS offender_alias,
        COALESCE(
            CASE WHEN p.dob ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN p.dob::date ELSE NULL END,
            CASE
                WHEN trim(p.personal_details->>'DATE_OF_BIRTH') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                    THEN (p.personal_details->>'DATE_OF_BIRTH')::date
                WHEN trim(p.personal_details->>'DATE_OF_BIRTH') ~ '^[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4}$'
                    THEN to_date(regexp_replace(trim(p.personal_details->>'DATE_OF_BIRTH'), '[-/]', '-', 'g'), 'DD-MM-YYYY')
                ELSE NULL
            END
        ) AS date_of_birth,
        p.age,
        COALESCE(
            NULLIF(trim(p.father_husband_name), ''),
            CASE
                WHEN p.personal_details->>'RELATION_TYPE' ILIKE ANY (ARRAY['%father%', '%husband%'])
                    THEN NULLIF(trim(p.personal_details->>'RELATIVE_NAME'), '')
                ELSE NULL
            END
        ) AS father_name,
        NULLIF(trim(p.contact_details->>'PHONE_NUMBER'), '') AS phone_number,
        NULL::text AS phone_numbers,
        a.accused_status,
        c.fir_num,
        c.fir_reg_num,
        c.fir_date,
        c.acts_sections,
        c.crime_type,
        c.court_name,
        h.ps_name AS police_station,
        risk.tier AS highest_risk_tier,
        lower(regexp_replace(p.full_name, '\s+', ' ', 'g')) AS search_name_norm
    FROM cctns_etl.accused a
    JOIN cctns_etl.persons p ON a.person_id = p.person_id
    JOIN cctns_etl.crimes c ON a.crime_id = c.crime_id
    LEFT JOIN cctns_etl.hierarchy h ON c.ps_code = h.ps_code
    LEFT JOIN LATERAL (
        SELECT kb.tier
        FROM ssor_kb kb
        WHERE c.acts_sections ILIKE '%' || kb.section_code || '%'
        ORDER BY kb.severity_rank DESC
        LIMIT 1
    ) risk ON true
    ORDER BY p.person_id, c.fir_date DESC NULLS LAST
),
fpb_latest AS (
    -- 0 rows on this environment today; kept so fpb data (once populated)
    -- automatically takes priority over the persons-JSONB fallback above.
    SELECT DISTINCT ON (person_id)
        person_id,
        phone_number,
        CASE WHEN dob ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN dob::date ELSE NULL END AS dob,
        NULL::text AS father_husband_name,
        NULL::text AS aadhaar_or_other_id_number
    FROM cctns_etl.fpb_accused
    WHERE person_id IS NOT NULL
    ORDER BY person_id, updated_at DESC NULLS LAST
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
    ac.highest_risk_tier,
    ac.search_name_norm,
    COALESCE(f.phone_number, ac.phone_number) AS match_phone,
    COALESCE(f.dob, ac.date_of_birth) AS match_dob,
    COALESCE(f.father_husband_name, ac.father_name) AS match_father_name,
    f.aadhaar_or_other_id_number AS match_aadhaar,
    right(regexp_replace(
        COALESCE(f.phone_number, ac.phone_number, ac.phone_numbers, ''), '\D', '', 'g'
    ), 10) AS match_phone_norm
FROM accused_latest ac
LEFT JOIN fpb_latest f ON f.person_id = ac.offender_id;

-- =============================================================================
-- 2. MATERIALIZED VIEW (fast — built from public.mv_offender_details)
-- =============================================================================

BEGIN;

DROP MATERIALIZED VIEW IF EXISTS public.mv_clearance_accused_search;

CREATE MATERIALIZED VIEW public.mv_clearance_accused_search AS
WITH accused_latest AS (
    SELECT
        od.offender_id,
        od.person_details->>'full_name' AS offender_name,
        od.person_details->>'alias' AS offender_alias,
        -- DOB: flat `dob` is unpopulated on this environment; fall back to
        -- personal_details.DATE_OF_BIRTH (rare). Regex-guarded so a stray
        -- non-date value never aborts the whole materialized view build.
        COALESCE(
            CASE WHEN od.person_details->>'dob' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                THEN (od.person_details->>'dob')::date ELSE NULL END,
            CASE
                WHEN trim(od.person_details->'personal_details'->>'DATE_OF_BIRTH') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                    THEN (od.person_details->'personal_details'->>'DATE_OF_BIRTH')::date
                WHEN trim(od.person_details->'personal_details'->>'DATE_OF_BIRTH') ~ '^[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{4}$'
                    THEN to_date(regexp_replace(trim(od.person_details->'personal_details'->>'DATE_OF_BIRTH'), '[-/]', '-', 'g'), 'DD-MM-YYYY')
                ELSE NULL
            END
        ) AS date_of_birth,
        od.person_details->>'age' AS age,
        -- Father/husband name: flat column is unpopulated; fall back to the
        -- Father/Husband relative entry inside personal_details JSONB.
        COALESCE(
            NULLIF(trim(od.person_details->>'father_husband_name'), ''),
            CASE
                WHEN od.person_details->'personal_details'->>'RELATION_TYPE' ILIKE ANY (ARRAY['%father%', '%husband%'])
                    THEN NULLIF(trim(od.person_details->'personal_details'->>'RELATIVE_NAME'), '')
                ELSE NULL
            END
        ) AS father_name,
        -- Phone: persons has no flat phone column; contact_details JSONB is
        -- the only source (fpb, joined below, takes priority when present).
        NULLIF(trim(od.person_details->'contact_details'->>'PHONE_NUMBER'), '') AS phone_number,
        NULL::text AS phone_numbers,
        od.latest_physical_features->>'accused_status' AS accused_status,
        lc.fir_num,
        lc.fir_reg_num,
        lc.fir_date,
        lc.acts_sections,
        lc.crime_type,
        lc.court_name,
        h.ps_name AS police_station,
        od.highest_risk_tier,
        lower(regexp_replace(
            COALESCE(od.person_details->>'full_name', ''),
            '\s+', ' ', 'g'
        )) AS search_name_norm
    FROM public.mv_offender_details od
    -- Pick the single most recent crime out of the aggregated crimes array,
    -- matching the old view's "one row per person, latest crime" semantics.
    LEFT JOIN LATERAL (
        SELECT
            c->>'fir_num' AS fir_num,
            c->>'fir_reg_num' AS fir_reg_num,
            c->>'fir_date' AS fir_date,
            c->>'acts_sections' AS acts_sections,
            c->>'crime_type' AS crime_type,
            c->>'court_name' AS court_name,
            c->>'ps_code' AS ps_code
        FROM jsonb_array_elements(COALESCE(od.crimes, '[]'::jsonb)) AS c
        ORDER BY
            CASE WHEN c->>'fir_date' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
                THEN (c->>'fir_date')::timestamptz ELSE NULL END DESC NULLS LAST
        LIMIT 1
    ) lc ON true
    LEFT JOIN cctns_etl.hierarchy h ON lc.ps_code = h.ps_code
),
fpb_latest AS (
    -- Most recent fingerprint-bureau record per person, read off
    -- mv_offender_details' own fingerprint_bureau_records JSONB array rather
    -- than re-querying cctns_etl.fpb_accused directly. 0 rows on this
    -- environment today; kept so fpb data automatically takes priority over
    -- the persons-JSONB fallback above the moment it's populated. Aadhaar has
    -- no known clean key inside aadhaar_or_other_id (0 rows to sample), so it
    -- stays NULL rather than guessing a field name.
    SELECT
        od.offender_id,
        (SELECT f->>'phone_number'
         FROM jsonb_array_elements(COALESCE(od.fingerprint_bureau_records, '[]'::jsonb)) AS f
         ORDER BY CASE WHEN f->>'updated_at' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
             THEN (f->>'updated_at')::timestamptz ELSE NULL END DESC NULLS LAST
         LIMIT 1) AS phone_number,
        (SELECT CASE WHEN f->>'dob' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN (f->>'dob')::date ELSE NULL END
         FROM jsonb_array_elements(COALESCE(od.fingerprint_bureau_records, '[]'::jsonb)) AS f
         ORDER BY CASE WHEN f->>'updated_at' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
             THEN (f->>'updated_at')::timestamptz ELSE NULL END DESC NULLS LAST
         LIMIT 1) AS dob,
        NULL::text AS father_husband_name,
        NULL::text AS aadhaar_or_other_id_number
    FROM public.mv_offender_details od
    WHERE od.fingerprint_bureau_records IS NOT NULL
      AND jsonb_array_length(od.fingerprint_bureau_records) > 0
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
    ac.highest_risk_tier,
    ac.search_name_norm,
    COALESCE(NULLIF(f.phone_number, ''), ac.phone_number) AS match_phone,
    COALESCE(f.dob, ac.date_of_birth) AS match_dob,
    COALESCE(f.father_husband_name, ac.father_name) AS match_father_name,
    f.aadhaar_or_other_id_number AS match_aadhaar,
    right(regexp_replace(
        COALESCE(NULLIF(f.phone_number, ''), ac.phone_number, ac.phone_numbers, ''), '\D', '', 'g'
    ), 10) AS match_phone_norm
FROM accused_latest ac
LEFT JOIN fpb_latest f ON f.offender_id = ac.offender_id;

CREATE UNIQUE INDEX idx_mv_clearance_accused_id
    ON public.mv_clearance_accused_search (offender_id);

CREATE INDEX idx_mv_clearance_phone
    ON public.mv_clearance_accused_search (match_phone_norm)
    WHERE match_phone_norm IS NOT NULL AND match_phone_norm <> '';

CREATE INDEX idx_mv_clearance_dob
    ON public.mv_clearance_accused_search (match_dob)
    WHERE match_dob IS NOT NULL;

CREATE INDEX idx_mv_clearance_name_trgm
    ON public.mv_clearance_accused_search
    USING gin (search_name_norm gin_trgm_ops);

-- Father-name searches (searchNameFather/searchFather/searchPhoneFather in
-- cctns.service.js) run a normalized ILIKE against match_father_name with no
-- index today — this expression index lets Postgres use pg_trgm for those too.
CREATE INDEX idx_mv_clearance_father_trgm
    ON public.mv_clearance_accused_search
    USING gin ((lower(regexp_replace(COALESCE(match_father_name, ''), '\s+', ' ', 'g'))) gin_trgm_ops);

-- NOTE: cctns_etl.accused / cctns_etl.persons / cctns_etl.fpb_accused are FDW
-- foreign tables (this schema is a live mount, not a local copy), so
-- Postgres does not support creating local indexes on them (ERROR 42809:
-- "cannot create index on relation ... This operation is not supported for
-- foreign tables"). Not relevant to the materialized view above anyway since
-- it no longer reads cctns_etl directly, only via mv_offender_details.

COMMIT;

-- Populate the materialized view (required after WITH NO DATA deployments; safe to run here)
REFRESH MATERIALIZED VIEW public.mv_clearance_accused_search;

-- Grant read access to the app DB role (adjust role if different)
GRANT SELECT ON public.v_clearance_accused_search TO cctns_prod;
GRANT SELECT ON public.mv_clearance_accused_search TO cctns_prod;

-- Optional sanity check:
-- SELECT offender_id, offender_name, match_phone, match_dob, match_father_name, highest_risk_tier, search_name_norm FROM public.mv_clearance_accused_search LIMIT 20;
-- SELECT offender_id, offender_name, match_phone, match_dob, match_father_name, highest_risk_tier, search_name_norm FROM public.v_clearance_accused_search LIMIT 20;
