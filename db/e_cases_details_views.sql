-- =============================================================================
-- 1. STANDARD VIEW (FULL DETAILS)
-- =============================================================================

CREATE OR REPLACE VIEW v_e_cases_details AS
SELECT
    ecase_no AS case_number,
    unit_name,
    ps_name,
    ps_name_2,
    pid_cd,
    pid_name,
    offence_dt AS offence_date,
    offdr_name AS offender_name,
    offdr_fname AS father_name,
    offdr_sex AS offender_sex,
    offdr_age AS offender_age,
    offdr_mobile_no AS offender_mobile,
    offdr_occupation AS offender_occupation,
    offdr_hno AS house_number,
    offdr_street AS street,
    offdr_village AS village,
    offdr_address AS offender_address,
    offdr_pres_addr AS present_address,
    sections AS act_section,
    brief_facts,
    charge_sheet_dt AS charge_sheet_date,
    disposal_dt AS disposal_date,
    disposal_type,
    disposal_remarks
FROM epetty.e_cases
ORDER BY offence_dt DESC;


-- =============================================================================
-- 2. MATERIALIZED VIEW (FULL DETAILS)
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_e_cases_details CASCADE;

CREATE MATERIALIZED VIEW mv_e_cases_details AS
SELECT
    ecase_no AS case_number,
    unit_name,
    ps_name,
    ps_name_2,
    pid_cd,
    pid_name,
    offence_dt AS offence_date,
    offdr_name AS offender_name,
    offdr_fname AS father_name,
    offdr_sex AS offender_sex,
    offdr_age AS offender_age,
    offdr_mobile_no AS offender_mobile,
    offdr_occupation AS offender_occupation,
    offdr_hno AS house_number,
    offdr_street AS street,
    offdr_village AS village,
    offdr_address AS offender_address,
    offdr_pres_addr AS present_address,
    sections AS act_section,
    brief_facts,
    charge_sheet_dt AS charge_sheet_date,
    disposal_dt AS disposal_date,
    disposal_type,
    disposal_remarks
FROM epetty.e_cases
ORDER BY offence_dt DESC;

-- Create unique index for concurrent refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_e_cases_details_id ON mv_e_cases_details (case_number);
