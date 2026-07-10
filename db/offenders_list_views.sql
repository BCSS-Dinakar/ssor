-- =============================================================================
-- 1. RAW SQL QUERY
-- =============================================================================
-- This query returns the minimal set of fields needed for the Offender List Page,
-- including a dynamically calculated Risk Tier. It uses DISTINCT ON to ensure
-- we only get ONE row per offender (their most recent crime).

/*
WITH LatestOffences AS (
    SELECT DISTINCT ON (p.person_id)
        p.person_id AS offender_id,
        p.full_name AS offender_name,
        p.alias AS offender_alias,
        a.accused_status AS current_status,
        c.fir_date AS offence_date,
        c.crime_type AS primary_offence,
        h.ps_name AS police_station,
        risk.tier AS risk_tier
    FROM public.accused a
    JOIN public.persons p ON a.person_id = p.person_id
    JOIN public.crimes c ON a.crime_id = c.crime_id
    LEFT JOIN public.hierarchy h ON c.ps_code = h.ps_code
    LEFT JOIN LATERAL (
        SELECT kb.tier
        FROM public.ssor_kb kb
        WHERE c.acts_sections ILIKE '%' || kb.section_code || '%'
        ORDER BY kb.severity_rank DESC
        LIMIT 1
    ) risk ON true
    -- Distinct ON requires the first ORDER BY column to be the distinct column
    -- The second column (fir_date DESC) ensures we pick their most recent crime
    ORDER BY p.person_id, c.fir_date DESC
)
-- Finally, sort the overall list so the most recent offenders overall appear first
SELECT * FROM LatestOffences
ORDER BY offence_date DESC;
*/

-- =============================================================================
-- 2. STANDARD VIEW
-- =============================================================================

CREATE OR REPLACE VIEW public.v_offenders_list AS
WITH LatestOffences AS (
    SELECT DISTINCT ON (p.person_id)
        p.person_id AS offender_id,
        p.full_name AS offender_name,
        p.alias AS offender_alias,
        a.accused_status AS current_status,
        c.fir_date AS offence_date,
        c.crime_type AS primary_offence,
        h.ps_name AS police_station,
        risk.tier AS risk_tier
    FROM public.accused a
    JOIN public.persons p ON a.person_id = p.person_id
    JOIN public.crimes c ON a.crime_id = c.crime_id
    LEFT JOIN public.hierarchy h ON c.ps_code = h.ps_code
    LEFT JOIN LATERAL (
        SELECT kb.tier
        FROM public.ssor_kb kb
        WHERE c.acts_sections ILIKE '%' || kb.section_code || '%'
        ORDER BY kb.severity_rank DESC
        LIMIT 1
    ) risk ON true
    ORDER BY p.person_id, c.fir_date DESC
)
SELECT * FROM LatestOffences
ORDER BY offence_date DESC;


-- =============================================================================
-- 3. MATERIALIZED VIEW
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.mv_offenders_list;

CREATE MATERIALIZED VIEW public.mv_offenders_list AS
WITH LatestOffences AS (
    SELECT DISTINCT ON (p.person_id)
        p.person_id AS offender_id,
        p.full_name AS offender_name,
        p.alias AS offender_alias,
        a.accused_status AS current_status,
        c.fir_date AS offence_date,
        c.crime_type AS primary_offence,
        h.ps_name AS police_station,
        risk.tier AS risk_tier
    FROM public.accused a
    JOIN public.persons p ON a.person_id = p.person_id
    JOIN public.crimes c ON a.crime_id = c.crime_id
    LEFT JOIN public.hierarchy h ON c.ps_code = h.ps_code
    LEFT JOIN LATERAL (
        SELECT kb.tier
        FROM public.ssor_kb kb
        WHERE c.acts_sections ILIKE '%' || kb.section_code || '%'
        ORDER BY kb.severity_rank DESC
        LIMIT 1
    ) risk ON true
    ORDER BY p.person_id, c.fir_date DESC
)
SELECT * FROM LatestOffences
ORDER BY offence_date DESC;

-- Now that we guaranteed 1 row per offender, we CAN use a UNIQUE INDEX!
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_offenders_list_id ON public.mv_offenders_list (offender_id);
