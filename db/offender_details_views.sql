-- =============================================================================
-- 1. RAW SQL QUERY (MASSIVE OFFENDER DETAILS)
-- =============================================================================
-- This query grabs LITERALLY EVERYTHING about an offender from every table 
-- in the CCTNS ETL database and structures it into a single JSON response row!

/*
SELECT 
    p.person_id AS offender_id,
    
    -- Full person row
    to_jsonb(p.*) AS person_details,
    
    -- Latest Physical Features
    (SELECT to_jsonb(a_inner.*) FROM cctns_etl.accused a_inner WHERE a_inner.person_id = p.person_id ORDER BY a_inner.seq_num DESC LIMIT 1) AS latest_physical_features,
    
    -- Highest Risk Tier across all their crimes
    (SELECT kb.tier FROM cctns_etl.accused a_inner JOIN cctns_etl.crimes c_inner ON a_inner.crime_id = c_inner.crime_id JOIN "RiskTierSection" kb ON c_inner.acts_sections ILIKE '%' || kb.section_code || '%' WHERE a_inner.person_id = p.person_id ORDER BY kb.severity_rank DESC LIMIT 1) AS highest_risk_tier,

    -- All FIRs / Crimes
    (SELECT jsonb_agg(to_jsonb(c.*)) FROM cctns_etl.crimes c JOIN cctns_etl.accused a2 ON c.crime_id = a2.crime_id WHERE a2.person_id = p.person_id) AS crimes,

    -- All Arrests
    (SELECT jsonb_agg(to_jsonb(ar.*)) FROM cctns_etl.arrests ar WHERE ar.person_id = p.person_id) AS arrests,

    -- All Chargesheets
    (SELECT jsonb_agg(to_jsonb(cs.*)) FROM cctns_etl.chargesheets cs JOIN cctns_etl.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.charge_sheet_id::text WHERE (csa.accused_payload->>'accusedPersonId') = p.person_id) AS chargesheets,
    
    -- Fingerprint Bureau (FPB) / MO Records (Links via crime_id)
    (SELECT jsonb_agg(to_jsonb(fpb.*)) FROM cctns_etl.fpb_accused fpb JOIN cctns_etl.accused a3 ON fpb.crime_id = a3.crime_id WHERE a3.person_id = p.person_id) AS fingerprint_bureau_records,

    -- Interrogation Reports (IR) and all its sub-tables
    (SELECT jsonb_agg(to_jsonb(ir.*)) FROM cctns_etl.interrogation_reports ir WHERE ir.person_id = p.person_id) AS interrogation_reports,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'FAMILY_HISTORY') AS family_history,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'LOCAL_CONTACTS') AS local_contacts,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'MODUS_OPERANDI') AS modus_operandi,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'REGULAR_HABITS') AS regular_habits

FROM cctns_etl.persons p
-- Only get actual offenders (people who have an accused record)
WHERE EXISTS (SELECT 1 FROM cctns_etl.accused a WHERE a.person_id = p.person_id);
*/

-- =============================================================================
-- 2. STANDARD VIEW (FULL DETAILS) - HIGH PERFORMANCE CTE VERSION
-- =============================================================================

CREATE OR REPLACE VIEW v_offender_details AS
WITH     q_latest_features AS (
        SELECT DISTINCT ON (person_id) person_id, to_jsonb(a.*) AS latest_physical_features
        FROM cctns_etl.accused a
        WHERE person_id IS NOT NULL AND person_id != ''
        ORDER BY person_id, seq_num DESC
    ),
    q_highest_tier AS (
        SELECT DISTINCT ON (a.person_id) a.person_id, kb.tier AS highest_risk_tier
        FROM cctns_etl.accused a
        JOIN cctns_etl.crimes c ON a.crime_id = c.crime_id
        JOIN "RiskTierSection" kb ON c.acts_sections ILIKE '%' || kb.section_code || '%'
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        ORDER BY a.person_id, kb.severity_rank DESC
    ),
    q_crimes AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(c.*)) AS crimes
        FROM cctns_etl.crimes c JOIN cctns_etl.accused a ON c.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_arrests AS (
        SELECT person_id, jsonb_agg(to_jsonb(ar.*)) AS arrests
        FROM cctns_etl.arrests ar
        WHERE person_id IS NOT NULL AND person_id != ''
        GROUP BY person_id
    ),
    q_chargesheets AS (
        SELECT (csa.accused_payload->>'accusedPersonId') AS person_id, jsonb_agg(to_jsonb(cs.*)) AS chargesheets
        FROM cctns_etl.chargesheets cs JOIN cctns_etl.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.charge_sheet_id::text
        WHERE (csa.accused_payload->>'accusedPersonId') IS NOT NULL AND (csa.accused_payload->>'accusedPersonId') != ''
        GROUP BY 1
    ),
    q_fpb AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(fpb.*)) AS fingerprint_bureau_records
        FROM cctns_etl.fpb_accused fpb JOIN cctns_etl.accused a ON fpb.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_ir AS (
        SELECT person_id, jsonb_agg(to_jsonb(ir.*)) AS interrogation_reports
        FROM cctns_etl.interrogation_reports ir
        WHERE person_id IS NOT NULL AND person_id != ''
        GROUP BY person_id
    ),
    q_fh AS (
        SELECT ir.person_id, jsonb_agg(to_jsonb(cr.*)) AS family_history
        FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir ON cr.interrogation_report_id = ir.interrogation_report_id
        WHERE cr.section_name = 'FAMILY_HISTORY' AND ir.person_id IS NOT NULL AND ir.person_id != ''
        GROUP BY ir.person_id
    ),
    q_lc AS (
        SELECT ir.person_id, jsonb_agg(to_jsonb(cr.*)) AS local_contacts
        FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir ON cr.interrogation_report_id = ir.interrogation_report_id
        WHERE cr.section_name = 'LOCAL_CONTACTS' AND ir.person_id IS NOT NULL AND ir.person_id != ''
        GROUP BY ir.person_id
    ),
    q_mo AS (
        SELECT ir.person_id, jsonb_agg(to_jsonb(cr.*)) AS modus_operandi
        FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir ON cr.interrogation_report_id = ir.interrogation_report_id
        WHERE cr.section_name = 'MODUS_OPERANDI' AND ir.person_id IS NOT NULL AND ir.person_id != ''
        GROUP BY ir.person_id
    ),
    q_rh AS (
        SELECT ir.person_id, jsonb_agg(to_jsonb(cr.*)) AS regular_habits
        FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir ON cr.interrogation_report_id = ir.interrogation_report_id
        WHERE cr.section_name = 'REGULAR_HABITS' AND ir.person_id IS NOT NULL AND ir.person_id != ''
        GROUP BY ir.person_id
    ),
    q_pid AS (
        SELECT person_id, jsonb_agg(to_jsonb(pid.*)) AS person_identity_details
        FROM cctns_etl.person_identity_details pid
        WHERE person_id IS NOT NULL AND person_id != ''
        GROUP BY person_id
    ),
    q_pm AS (
        SELECT person_id, jsonb_agg(to_jsonb(pm.*)) AS person_media
        FROM cctns_etl.person_media pm
        WHERE person_id IS NOT NULL AND person_id != ''
        GROUP BY person_id
    ),
    q_disp AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(d.*)) AS disposals
        FROM cctns_etl.disposals d JOIN cctns_etl.accused a ON d.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_prop AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(pr.*)) AS properties
        FROM cctns_etl.properties pr JOIN cctns_etl.accused a ON pr.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_cp AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(cp.*)) AS case_properties
        FROM cctns_etl.case_properties cp JOIN cctns_etl.accused a ON cp.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_sa AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(sa.*)) AS stolen_automobiles
        FROM cctns_etl.stolen_automobiles sa JOIN cctns_etl.accused a ON sa.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_ms AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(ms.*)) AS mo_seizures
        FROM cctns_etl.mo_seizures ms JOIN cctns_etl.accused a ON ms.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_msm AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(msm.*)) AS mo_seizure_media
        FROM cctns_etl.mo_seizure_media msm JOIN cctns_etl.mo_seizures ms ON msm.mo_seizure_id = ms.mo_seizure_id JOIN cctns_etl.accused a ON ms.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_csu AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(csu.*)) AS charge_sheet_updates
        FROM cctns_etl.charge_sheet_updates csu JOIN cctns_etl.accused a ON csu.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_cas AS (
        SELECT (csa.accused_payload->>'accusedPersonId') AS person_id, jsonb_agg(to_jsonb(cas.*)) AS chargesheet_acts_sections
        FROM cctns_etl.chargesheet_acts_sections cas JOIN cctns_etl.chargesheets cs ON cas.charge_sheet_id::text = cs.charge_sheet_id::text JOIN cctns_etl.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.charge_sheet_id::text
        WHERE (csa.accused_payload->>'accusedPersonId') IS NOT NULL AND (csa.accused_payload->>'accusedPersonId') != ''
        GROUP BY 1
    ),
    q_fac AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(fac.*)) AS fpb_additional_crimes
        FROM cctns_etl.fpb_additional_crimes fac JOIN cctns_etl.fpb_accused fpb ON fac.fpb_accused_id = fpb.id JOIN cctns_etl.accused a ON fpb.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    )
SELECT 
    p.person_id AS offender_id,
    to_jsonb(p.*) AS person_details,
    f.latest_physical_features,
    t.highest_risk_tier,
    c.crimes,
    ar.arrests,
    cs.chargesheets,
    fpb.fingerprint_bureau_records,
    ir.interrogation_reports,
    fh.family_history,
    lc.local_contacts,
    mo.modus_operandi,
    rh.regular_habits,
    pid.person_identity_details,
    pm.person_media,
    disp.disposals,
    prop.properties,
    cp.case_properties,
    sa.stolen_automobiles,
    ms.mo_seizures,
    msm.mo_seizure_media,
    csu.charge_sheet_updates,
    cas.chargesheet_acts_sections,
    fac.fpb_additional_crimes
FROM cctns_etl.persons p
-- JOIN only people who are accused
JOIN (SELECT DISTINCT person_id FROM cctns_etl.accused) accused_filter ON p.person_id = accused_filter.person_id
LEFT JOIN q_latest_features f ON p.person_id = f.person_id
LEFT JOIN q_highest_tier t ON p.person_id = t.person_id
LEFT JOIN q_crimes c ON p.person_id = c.person_id
LEFT JOIN q_arrests ar ON p.person_id = ar.person_id
LEFT JOIN q_chargesheets cs ON p.person_id = cs.person_id
LEFT JOIN q_fpb fpb ON p.person_id = fpb.person_id
LEFT JOIN q_ir ir ON p.person_id = ir.person_id
LEFT JOIN q_fh fh ON p.person_id = fh.person_id
LEFT JOIN q_lc lc ON p.person_id = lc.person_id
LEFT JOIN q_mo mo ON p.person_id = mo.person_id
LEFT JOIN q_rh rh ON p.person_id = rh.person_id
LEFT JOIN q_pid pid ON p.person_id = pid.person_id
LEFT JOIN q_pm pm ON p.person_id = pm.person_id
LEFT JOIN q_disp disp ON p.person_id = disp.person_id
LEFT JOIN q_prop prop ON p.person_id = prop.person_id
LEFT JOIN q_cp cp ON p.person_id = cp.person_id
LEFT JOIN q_sa sa ON p.person_id = sa.person_id
LEFT JOIN q_ms ms ON p.person_id = ms.person_id
LEFT JOIN q_msm msm ON p.person_id = msm.person_id
LEFT JOIN q_csu csu ON p.person_id = csu.person_id
LEFT JOIN q_cas cas ON p.person_id = cas.person_id
LEFT JOIN q_fac fac ON p.person_id = fac.person_id;


-- =============================================================================
-- 3. MATERIALIZED VIEW (FULL DETAILS) - HIGH PERFORMANCE CTE VERSION
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_offender_details CASCADE;

CREATE MATERIALIZED VIEW mv_offender_details AS
WITH     q_latest_features AS (
        SELECT DISTINCT ON (person_id) person_id, to_jsonb(a.*) AS latest_physical_features
        FROM cctns_etl.accused a
        WHERE person_id IS NOT NULL AND person_id != ''
        ORDER BY person_id, seq_num DESC
    ),
    q_highest_tier AS (
        SELECT DISTINCT ON (a.person_id) a.person_id, kb.tier AS highest_risk_tier
        FROM cctns_etl.accused a
        JOIN cctns_etl.crimes c ON a.crime_id = c.crime_id
        JOIN "RiskTierSection" kb ON c.acts_sections ILIKE '%' || kb.section_code || '%'
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        ORDER BY a.person_id, kb.severity_rank DESC
    ),
    q_crimes AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(c.*)) AS crimes
        FROM cctns_etl.crimes c JOIN cctns_etl.accused a ON c.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_arrests AS (
        SELECT person_id, jsonb_agg(to_jsonb(ar.*)) AS arrests
        FROM cctns_etl.arrests ar
        WHERE person_id IS NOT NULL AND person_id != ''
        GROUP BY person_id
    ),
    q_chargesheets AS (
        SELECT (csa.accused_payload->>'accusedPersonId') AS person_id, jsonb_agg(to_jsonb(cs.*)) AS chargesheets
        FROM cctns_etl.chargesheets cs JOIN cctns_etl.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.charge_sheet_id::text
        WHERE (csa.accused_payload->>'accusedPersonId') IS NOT NULL AND (csa.accused_payload->>'accusedPersonId') != ''
        GROUP BY 1
    ),
    q_fpb AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(fpb.*)) AS fingerprint_bureau_records
        FROM cctns_etl.fpb_accused fpb JOIN cctns_etl.accused a ON fpb.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_ir AS (
        SELECT person_id, jsonb_agg(to_jsonb(ir.*)) AS interrogation_reports
        FROM cctns_etl.interrogation_reports ir
        WHERE person_id IS NOT NULL AND person_id != ''
        GROUP BY person_id
    ),
    q_fh AS (
        SELECT ir.person_id, jsonb_agg(to_jsonb(cr.*)) AS family_history
        FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir ON cr.interrogation_report_id = ir.interrogation_report_id
        WHERE cr.section_name = 'FAMILY_HISTORY' AND ir.person_id IS NOT NULL AND ir.person_id != ''
        GROUP BY ir.person_id
    ),
    q_lc AS (
        SELECT ir.person_id, jsonb_agg(to_jsonb(cr.*)) AS local_contacts
        FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir ON cr.interrogation_report_id = ir.interrogation_report_id
        WHERE cr.section_name = 'LOCAL_CONTACTS' AND ir.person_id IS NOT NULL AND ir.person_id != ''
        GROUP BY ir.person_id
    ),
    q_mo AS (
        SELECT ir.person_id, jsonb_agg(to_jsonb(cr.*)) AS modus_operandi
        FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir ON cr.interrogation_report_id = ir.interrogation_report_id
        WHERE cr.section_name = 'MODUS_OPERANDI' AND ir.person_id IS NOT NULL AND ir.person_id != ''
        GROUP BY ir.person_id
    ),
    q_rh AS (
        SELECT ir.person_id, jsonb_agg(to_jsonb(cr.*)) AS regular_habits
        FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir ON cr.interrogation_report_id = ir.interrogation_report_id
        WHERE cr.section_name = 'REGULAR_HABITS' AND ir.person_id IS NOT NULL AND ir.person_id != ''
        GROUP BY ir.person_id
    ),
    q_pid AS (
        SELECT person_id, jsonb_agg(to_jsonb(pid.*)) AS person_identity_details
        FROM cctns_etl.person_identity_details pid
        WHERE person_id IS NOT NULL AND person_id != ''
        GROUP BY person_id
    ),
    q_pm AS (
        SELECT person_id, jsonb_agg(to_jsonb(pm.*)) AS person_media
        FROM cctns_etl.person_media pm
        WHERE person_id IS NOT NULL AND person_id != ''
        GROUP BY person_id
    ),
    q_disp AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(d.*)) AS disposals
        FROM cctns_etl.disposals d JOIN cctns_etl.accused a ON d.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_prop AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(pr.*)) AS properties
        FROM cctns_etl.properties pr JOIN cctns_etl.accused a ON pr.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_cp AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(cp.*)) AS case_properties
        FROM cctns_etl.case_properties cp JOIN cctns_etl.accused a ON cp.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_sa AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(sa.*)) AS stolen_automobiles
        FROM cctns_etl.stolen_automobiles sa JOIN cctns_etl.accused a ON sa.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_ms AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(ms.*)) AS mo_seizures
        FROM cctns_etl.mo_seizures ms JOIN cctns_etl.accused a ON ms.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_msm AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(msm.*)) AS mo_seizure_media
        FROM cctns_etl.mo_seizure_media msm JOIN cctns_etl.mo_seizures ms ON msm.mo_seizure_id = ms.mo_seizure_id JOIN cctns_etl.accused a ON ms.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_csu AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(csu.*)) AS charge_sheet_updates
        FROM cctns_etl.charge_sheet_updates csu JOIN cctns_etl.accused a ON csu.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    ),
    q_cas AS (
        SELECT (csa.accused_payload->>'accusedPersonId') AS person_id, jsonb_agg(to_jsonb(cas.*)) AS chargesheet_acts_sections
        FROM cctns_etl.chargesheet_acts_sections cas JOIN cctns_etl.chargesheets cs ON cas.charge_sheet_id::text = cs.charge_sheet_id::text JOIN cctns_etl.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.charge_sheet_id::text
        WHERE (csa.accused_payload->>'accusedPersonId') IS NOT NULL AND (csa.accused_payload->>'accusedPersonId') != ''
        GROUP BY 1
    ),
    q_fac AS (
        SELECT a.person_id, jsonb_agg(to_jsonb(fac.*)) AS fpb_additional_crimes
        FROM cctns_etl.fpb_additional_crimes fac JOIN cctns_etl.fpb_accused fpb ON fac.fpb_accused_id = fpb.id JOIN cctns_etl.accused a ON fpb.crime_id = a.crime_id
        WHERE a.person_id IS NOT NULL AND a.person_id != ''
        GROUP BY a.person_id
    )
SELECT 
    p.person_id AS offender_id,
    to_jsonb(p.*) AS person_details,
    f.latest_physical_features,
    t.highest_risk_tier,
    c.crimes,
    ar.arrests,
    cs.chargesheets,
    fpb.fingerprint_bureau_records,
    ir.interrogation_reports,
    fh.family_history,
    lc.local_contacts,
    mo.modus_operandi,
    rh.regular_habits,
    pid.person_identity_details,
    pm.person_media,
    disp.disposals,
    prop.properties,
    cp.case_properties,
    sa.stolen_automobiles,
    ms.mo_seizures,
    msm.mo_seizure_media,
    csu.charge_sheet_updates,
    cas.chargesheet_acts_sections,
    fac.fpb_additional_crimes
FROM cctns_etl.persons p
-- JOIN only people who are accused
JOIN (SELECT DISTINCT person_id FROM cctns_etl.accused) accused_filter ON p.person_id = accused_filter.person_id
LEFT JOIN q_latest_features f ON p.person_id = f.person_id
LEFT JOIN q_highest_tier t ON p.person_id = t.person_id
LEFT JOIN q_crimes c ON p.person_id = c.person_id
LEFT JOIN q_arrests ar ON p.person_id = ar.person_id
LEFT JOIN q_chargesheets cs ON p.person_id = cs.person_id
LEFT JOIN q_fpb fpb ON p.person_id = fpb.person_id
LEFT JOIN q_ir ir ON p.person_id = ir.person_id
LEFT JOIN q_fh fh ON p.person_id = fh.person_id
LEFT JOIN q_lc lc ON p.person_id = lc.person_id
LEFT JOIN q_mo mo ON p.person_id = mo.person_id
LEFT JOIN q_rh rh ON p.person_id = rh.person_id
LEFT JOIN q_pid pid ON p.person_id = pid.person_id
LEFT JOIN q_pm pm ON p.person_id = pm.person_id
LEFT JOIN q_disp disp ON p.person_id = disp.person_id
LEFT JOIN q_prop prop ON p.person_id = prop.person_id
LEFT JOIN q_cp cp ON p.person_id = cp.person_id
LEFT JOIN q_sa sa ON p.person_id = sa.person_id
LEFT JOIN q_ms ms ON p.person_id = ms.person_id
LEFT JOIN q_msm msm ON p.person_id = msm.person_id
LEFT JOIN q_csu csu ON p.person_id = csu.person_id
LEFT JOIN q_cas cas ON p.person_id = cas.person_id
LEFT JOIN q_fac fac ON p.person_id = fac.person_id;

