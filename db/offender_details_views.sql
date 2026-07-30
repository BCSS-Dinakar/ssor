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
    (SELECT kb.tier FROM cctns_etl.accused a_inner JOIN cctns_etl.crimes c_inner ON a_inner.crime_id = c_inner.crime_id JOIN ssor_kb kb ON c_inner.acts_sections ILIKE '%' || kb.section_code || '%' WHERE a_inner.person_id = p.person_id ORDER BY kb.severity_rank DESC LIMIT 1) AS highest_risk_tier,

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
-- 2. STANDARD VIEW
-- =============================================================================

CREATE OR REPLACE VIEW v_offender_details AS
SELECT 
    p.person_id AS offender_id,
    to_jsonb(p.*) AS person_details,
    (SELECT to_jsonb(a_inner.*) FROM cctns_etl.accused a_inner WHERE a_inner.person_id = p.person_id ORDER BY a_inner.seq_num DESC LIMIT 1) AS latest_physical_features,
    (SELECT kb.tier FROM cctns_etl.accused a_inner JOIN cctns_etl.crimes c_inner ON a_inner.crime_id = c_inner.crime_id JOIN ssor_kb kb ON c_inner.acts_sections ILIKE '%' || kb.section_code || '%' WHERE a_inner.person_id = p.person_id ORDER BY kb.severity_rank DESC LIMIT 1) AS highest_risk_tier,
    (SELECT jsonb_agg(to_jsonb(c.*)) FROM cctns_etl.crimes c JOIN cctns_etl.accused a2 ON c.crime_id = a2.crime_id WHERE a2.person_id = p.person_id) AS crimes,
    (SELECT jsonb_agg(to_jsonb(ar.*)) FROM cctns_etl.arrests ar WHERE ar.person_id = p.person_id) AS arrests,
    (SELECT jsonb_agg(to_jsonb(cs.*)) FROM cctns_etl.chargesheets cs JOIN cctns_etl.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.charge_sheet_id::text WHERE (csa.accused_payload->>'accusedPersonId') = p.person_id) AS chargesheets,
    (SELECT jsonb_agg(to_jsonb(fpb.*)) FROM cctns_etl.fpb_accused fpb JOIN cctns_etl.accused a3 ON fpb.crime_id = a3.crime_id WHERE a3.person_id = p.person_id) AS fingerprint_bureau_records,
    (SELECT jsonb_agg(to_jsonb(ir.*)) FROM cctns_etl.interrogation_reports ir WHERE ir.person_id = p.person_id) AS interrogation_reports,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'FAMILY_HISTORY') AS family_history,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'LOCAL_CONTACTS') AS local_contacts,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'MODUS_OPERANDI') AS modus_operandi,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'REGULAR_HABITS') AS regular_habits,
    (SELECT jsonb_agg(to_jsonb(pid.*)) FROM cctns_etl.person_identity_details pid WHERE pid.person_id = p.person_id) AS person_identity_details,
    (SELECT jsonb_agg(to_jsonb(pm.*)) FROM cctns_etl.person_media pm WHERE pm.person_id = p.person_id) AS person_media,
    (SELECT jsonb_agg(to_jsonb(d.*)) FROM cctns_etl.disposals d JOIN cctns_etl.accused a_disp ON d.crime_id = a_disp.crime_id WHERE a_disp.person_id = p.person_id) AS disposals,
    (SELECT jsonb_agg(to_jsonb(pr.*)) FROM cctns_etl.properties pr JOIN cctns_etl.accused a_pr ON pr.crime_id = a_pr.crime_id WHERE a_pr.person_id = p.person_id) AS properties,
    (SELECT jsonb_agg(to_jsonb(cp.*)) FROM cctns_etl.case_properties cp JOIN cctns_etl.accused a_cp ON cp.crime_id = a_cp.crime_id WHERE a_cp.person_id = p.person_id) AS case_properties,
    (SELECT jsonb_agg(to_jsonb(sa.*)) FROM cctns_etl.stolen_automobiles sa JOIN cctns_etl.accused a_sa ON sa.crime_id = a_sa.crime_id WHERE a_sa.person_id = p.person_id) AS stolen_automobiles,
    (SELECT jsonb_agg(to_jsonb(ms.*)) FROM cctns_etl.mo_seizures ms JOIN cctns_etl.accused a_ms ON ms.crime_id = a_ms.crime_id WHERE a_ms.person_id = p.person_id) AS mo_seizures,
    (SELECT jsonb_agg(to_jsonb(msm.*)) FROM cctns_etl.mo_seizure_media msm JOIN cctns_etl.mo_seizures ms ON msm.mo_seizure_id = ms.mo_seizure_id JOIN cctns_etl.accused a_msm ON ms.crime_id = a_msm.crime_id WHERE a_msm.person_id = p.person_id) AS mo_seizure_media,
    (SELECT jsonb_agg(to_jsonb(csu.*)) FROM cctns_etl.charge_sheet_updates csu JOIN cctns_etl.accused a_csu ON csu.crime_id = a_csu.crime_id WHERE a_csu.person_id = p.person_id) AS charge_sheet_updates,
    (SELECT jsonb_agg(to_jsonb(cas.*)) FROM cctns_etl.chargesheet_acts_sections cas JOIN cctns_etl.chargesheets cs_cas ON cas.charge_sheet_id::text = cs_cas.charge_sheet_id::text JOIN cctns_etl.chargesheet_accused csa2 ON cs_cas.charge_sheet_id::text = csa2.charge_sheet_id::text WHERE (csa2.accused_payload->>'accusedPersonId') = p.person_id) AS chargesheet_acts_sections,
    (SELECT jsonb_agg(to_jsonb(fac.*)) FROM cctns_etl.fpb_additional_crimes fac JOIN cctns_etl.fpb_accused fpb2 ON fac.fpb_accused_id = fpb2.id JOIN cctns_etl.accused a_fac ON fpb2.crime_id = a_fac.crime_id WHERE a_fac.person_id = p.person_id) AS fpb_additional_crimes
FROM cctns_etl.persons p
WHERE EXISTS (SELECT 1 FROM cctns_etl.accused a WHERE a.person_id = p.person_id);


-- =============================================================================
-- 3. MATERIALIZED VIEW
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_offender_details CASCADE;

CREATE MATERIALIZED VIEW mv_offender_details AS
SELECT 
    p.person_id AS offender_id,
    to_jsonb(p.*) AS person_details,
    (SELECT to_jsonb(a_inner.*) FROM cctns_etl.accused a_inner WHERE a_inner.person_id = p.person_id ORDER BY a_inner.seq_num DESC LIMIT 1) AS latest_physical_features,
    (SELECT kb.tier FROM cctns_etl.accused a_inner JOIN cctns_etl.crimes c_inner ON a_inner.crime_id = c_inner.crime_id JOIN ssor_kb kb ON c_inner.acts_sections ILIKE '%' || kb.section_code || '%' WHERE a_inner.person_id = p.person_id ORDER BY kb.severity_rank DESC LIMIT 1) AS highest_risk_tier,
    (SELECT jsonb_agg(to_jsonb(c.*)) FROM cctns_etl.crimes c JOIN cctns_etl.accused a2 ON c.crime_id = a2.crime_id WHERE a2.person_id = p.person_id) AS crimes,
    (SELECT jsonb_agg(to_jsonb(ar.*)) FROM cctns_etl.arrests ar WHERE ar.person_id = p.person_id) AS arrests,
    (SELECT jsonb_agg(to_jsonb(cs.*)) FROM cctns_etl.chargesheets cs JOIN cctns_etl.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.charge_sheet_id::text WHERE (csa.accused_payload->>'accusedPersonId') = p.person_id) AS chargesheets,
    (SELECT jsonb_agg(to_jsonb(fpb.*)) FROM cctns_etl.fpb_accused fpb JOIN cctns_etl.accused a3 ON fpb.crime_id = a3.crime_id WHERE a3.person_id = p.person_id) AS fingerprint_bureau_records,
    (SELECT jsonb_agg(to_jsonb(ir.*)) FROM cctns_etl.interrogation_reports ir WHERE ir.person_id = p.person_id) AS interrogation_reports,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'FAMILY_HISTORY') AS family_history,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'LOCAL_CONTACTS') AS local_contacts,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'MODUS_OPERANDI') AS modus_operandi,
    (SELECT jsonb_agg(to_jsonb(cr.*)) FROM cctns_etl.ir_child_rows cr JOIN cctns_etl.interrogation_reports ir_inner ON cr.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id AND cr.section_name = 'REGULAR_HABITS') AS regular_habits,
    (SELECT jsonb_agg(to_jsonb(pid.*)) FROM cctns_etl.person_identity_details pid WHERE pid.person_id = p.person_id) AS person_identity_details,
    (SELECT jsonb_agg(to_jsonb(pm.*)) FROM cctns_etl.person_media pm WHERE pm.person_id = p.person_id) AS person_media,
    (SELECT jsonb_agg(to_jsonb(d.*)) FROM cctns_etl.disposals d JOIN cctns_etl.accused a_disp ON d.crime_id = a_disp.crime_id WHERE a_disp.person_id = p.person_id) AS disposals,
    (SELECT jsonb_agg(to_jsonb(pr.*)) FROM cctns_etl.properties pr JOIN cctns_etl.accused a_pr ON pr.crime_id = a_pr.crime_id WHERE a_pr.person_id = p.person_id) AS properties,
    (SELECT jsonb_agg(to_jsonb(cp.*)) FROM cctns_etl.case_properties cp JOIN cctns_etl.accused a_cp ON cp.crime_id = a_cp.crime_id WHERE a_cp.person_id = p.person_id) AS case_properties,
    (SELECT jsonb_agg(to_jsonb(sa.*)) FROM cctns_etl.stolen_automobiles sa JOIN cctns_etl.accused a_sa ON sa.crime_id = a_sa.crime_id WHERE a_sa.person_id = p.person_id) AS stolen_automobiles,
    (SELECT jsonb_agg(to_jsonb(ms.*)) FROM cctns_etl.mo_seizures ms JOIN cctns_etl.accused a_ms ON ms.crime_id = a_ms.crime_id WHERE a_ms.person_id = p.person_id) AS mo_seizures,
    (SELECT jsonb_agg(to_jsonb(msm.*)) FROM cctns_etl.mo_seizure_media msm JOIN cctns_etl.mo_seizures ms ON msm.mo_seizure_id = ms.mo_seizure_id JOIN cctns_etl.accused a_msm ON ms.crime_id = a_msm.crime_id WHERE a_msm.person_id = p.person_id) AS mo_seizure_media,
    (SELECT jsonb_agg(to_jsonb(csu.*)) FROM cctns_etl.charge_sheet_updates csu JOIN cctns_etl.accused a_csu ON csu.crime_id = a_csu.crime_id WHERE a_csu.person_id = p.person_id) AS charge_sheet_updates,
    (SELECT jsonb_agg(to_jsonb(cas.*)) FROM cctns_etl.chargesheet_acts_sections cas JOIN cctns_etl.chargesheets cs_cas ON cas.charge_sheet_id::text = cs_cas.charge_sheet_id::text JOIN cctns_etl.chargesheet_accused csa2 ON cs_cas.charge_sheet_id::text = csa2.charge_sheet_id::text WHERE (csa2.accused_payload->>'accusedPersonId') = p.person_id) AS chargesheet_acts_sections,
    (SELECT jsonb_agg(to_jsonb(fac.*)) FROM cctns_etl.fpb_additional_crimes fac JOIN cctns_etl.fpb_accused fpb2 ON fac.fpb_accused_id = fpb2.id JOIN cctns_etl.accused a_fac ON fpb2.crime_id = a_fac.crime_id WHERE a_fac.person_id = p.person_id) AS fpb_additional_crimes
FROM cctns_etl.persons p
WHERE EXISTS (SELECT 1 FROM cctns_etl.accused a WHERE a.person_id = p.person_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_offender_details_id ON mv_offender_details (offender_id);
