-- =============================================================================
-- E-Petty Case Data Relay - Relational Schema (PostgreSQL)
-- =============================================================================
-- Derived from E-Petty Case API (/api/epettyCase/personDetails).
--
-- Conventions
--   * Fully normalized relational schema in PostgreSQL style matching CCTNS-V2.
--   * Primary keys and foreign keys drive the relational design.
--   * Naming conventions follow snake_case for tables and columns.
--   * String identifiers/codes are VARCHAR(64) or TEXT.
--   * Dates and timestamps are stored as TIMESTAMP.
--   * Numeric fields (age, counts) are stored as NUMERIC.
--
-- Endpoint -> Table map
--   api/epettyCase/personDetails .......... epetty_case_person_details
--   api/epettyCase/summary ................ v_epetty_case_summary (view)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. E-PETTY CASE CLUSTER
-- =============================================================================

-- api/epettyCase/personDetails : PK ECASE_NO. Stores person details, offence
-- location, landmark, occupation, and police station/unit mapping.
CREATE TABLE epetty_case_person_details (
    ecase_no             VARCHAR(64) PRIMARY KEY,
    case_status          TEXT,
    created_dt           TIMESTAMP,
    no_of_ids_produced   NUMERIC,
    offdr_age            NUMERIC,
    offdr_mobile_no      TEXT,
    offdr_name           TEXT,
    offdr_occupation     TEXT,
    offence_landmark     TEXT,
    offence_location     TEXT,
    ps_name              TEXT,
    section_name         TEXT,
    unit_name            TEXT
);

-- Indexes for common search filters used in API queries
-- NOTE: ecase_no is PRIMARY KEY; PostgreSQL auto-creates an index on it.
CREATE INDEX idx_epetty_case_offdr_name       ON epetty_case_person_details (offdr_name);
CREATE INDEX idx_epetty_case_offdr_mobile     ON epetty_case_person_details (offdr_mobile_no);
CREATE INDEX idx_epetty_case_offdr_occupation ON epetty_case_person_details (offdr_occupation);
CREATE INDEX idx_epetty_case_ps_name          ON epetty_case_person_details (ps_name);
CREATE INDEX idx_epetty_case_unit_name        ON epetty_case_person_details (unit_name);
CREATE INDEX idx_epetty_case_created_dt       ON epetty_case_person_details (created_dt);

-- =============================================================================
-- 2. VIEWS / REPORTING
-- =============================================================================

-- View for reporting and quick search summary
CREATE VIEW v_epetty_case_summary AS
SELECT
    ecase_no             AS case_number,
    case_status          AS status,
    created_dt           AS registration_date,
    offdr_name           AS offender_name,
    offdr_age            AS offender_age,
    offdr_mobile_no      AS offender_mobile,
    offdr_occupation     AS offender_occupation,
    offence_location     AS location,
    offence_landmark     AS landmark,
    ps_name              AS police_station,
    unit_name            AS unit,
    section_name         AS act_section
FROM epetty_case_person_details;

COMMIT;
