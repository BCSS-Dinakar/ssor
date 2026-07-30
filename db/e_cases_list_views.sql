-- =============================================================================
-- 1. STANDARD VIEW (SUMMARY LIST)
-- =============================================================================

CREATE OR REPLACE VIEW v_e_cases_list AS
SELECT
    ecase_no AS case_number,
    unit_name,
    ps_name,
    offence_dt AS offence_date,
    offdr_name AS offender_name,
    offdr_age AS offender_age,
    offdr_mobile_no AS offender_mobile,
    offdr_occupation AS offender_occupation,
    offdr_address AS offender_address,
    sections AS act_section,
    disposal_type
FROM epetty.e_cases
ORDER BY offence_dt DESC;

-- =============================================================================
-- 2. MATERIALIZED VIEW (SUMMARY LIST)
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_e_cases_list CASCADE;

CREATE MATERIALIZED VIEW mv_e_cases_list AS
SELECT
    ecase_no AS case_number,
    unit_name,
    ps_name,
    offence_dt AS offence_date,
    offdr_name AS offender_name,
    offdr_age AS offender_age,
    offdr_mobile_no AS offender_mobile,
    offdr_occupation AS offender_occupation,
    offdr_address AS offender_address,
    sections AS act_section,
    disposal_type
FROM epetty.e_cases
ORDER BY offence_dt DESC;

-- Create unique index for concurrent refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_e_cases_list_id ON mv_e_cases_list (case_number);
