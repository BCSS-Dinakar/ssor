-- =============================================================================
-- SSOR Clearance Accused Search — run this entire script in pgAdmin Query Tool
-- =============================================================================
-- Creates mv_clearance_accused_search for CCTNS accused matching during
-- clearance vetting. No ssor_kb dependency.
--
-- After initial run:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_clearance_accused_search;
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP MATERIALIZED VIEW IF EXISTS public.mv_clearance_accused_search;

CREATE MATERIALIZED VIEW public.mv_clearance_accused_search AS
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
            '\s+', ' ', 'g'
        )) AS search_name_norm,
        right(regexp_replace(COALESCE(p.phone_number, p.phone_numbers, ''), '\D', '', 'g'), 10) AS search_phone_norm
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
        COALESCE(f.phone_number, ac.phone_number, ac.phone_numbers, ''), '\D', '', 'g'
    ), 10) AS match_phone_norm
FROM accused_latest ac
LEFT JOIN fpb_latest f ON f.person_id = ac.offender_id;

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

CREATE INDEX IF NOT EXISTS idx_accused_person_id
    ON public.accused (person_id);

CREATE INDEX IF NOT EXISTS idx_accused_crime_id
    ON public.accused (crime_id);

CREATE INDEX IF NOT EXISTS idx_fpb_accused_person_id
    ON public.fpb_accused (person_id);

COMMIT;

-- Populate the materialized view (required after WITH NO DATA deployments; safe to run here)
REFRESH MATERIALIZED VIEW public.mv_clearance_accused_search;

-- Grant read access to the app DB role (adjust role if different)
GRANT SELECT ON public.mv_clearance_accused_search TO cctns_prod;
GRANT SELECT ON public.accused TO cctns_prod;
GRANT SELECT ON public.persons TO cctns_prod;
GRANT SELECT ON public.crimes TO cctns_prod;
GRANT SELECT ON public.hierarchy TO cctns_prod;
GRANT SELECT ON public.fpb_accused TO cctns_prod;

-- Optional sanity check:
-- SELECT offender_id, offender_name, match_phone, match_dob, search_name_norm FROM public.mv_clearance_accused_search LIMIT 20;
