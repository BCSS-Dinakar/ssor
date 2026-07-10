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
    (SELECT to_jsonb(a_inner.*) FROM public.accused a_inner WHERE a_inner.person_id = p.person_id ORDER BY a_inner.seq_num DESC LIMIT 1) AS latest_physical_features,
    
    -- Highest Risk Tier across all their crimes
    (SELECT kb.tier FROM public.accused a_inner JOIN public.crimes c_inner ON a_inner.crime_id = c_inner.crime_id JOIN public.ssor_kb kb ON c_inner.acts_sections ILIKE '%' || kb.section_code || '%' WHERE a_inner.person_id = p.person_id ORDER BY kb.severity_rank DESC LIMIT 1) AS highest_risk_tier,

    -- All FIRs / Crimes
    (SELECT jsonb_agg(to_jsonb(c.*)) FROM public.crimes c JOIN public.accused a2 ON c.crime_id = a2.crime_id WHERE a2.person_id = p.person_id) AS crimes,

    -- All Arrests
    (SELECT jsonb_agg(to_jsonb(ar.*)) FROM public.arrests ar WHERE ar.person_id = p.person_id) AS arrests,

    -- All Chargesheets
    (SELECT jsonb_agg(to_jsonb(cs.*)) FROM public.chargesheets cs JOIN public.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.chargesheet_id::text WHERE csa.accused_person_id = p.person_id) AS chargesheets,
    
    -- Fingerprint Bureau (FPB) / MO Records (Links via crime_id)
    (SELECT jsonb_agg(to_jsonb(fpb.*)) FROM public.fpb_accused fpb JOIN public.accused a3 ON fpb.crime_id = a3.crime_id WHERE a3.person_id = p.person_id) AS fingerprint_bureau_records,

    -- Interrogation Reports (IR) and all its sub-tables
    (SELECT jsonb_agg(to_jsonb(ir.*)) FROM public.interrogation_reports ir WHERE ir.person_id = p.person_id) AS interrogation_reports,
    (SELECT jsonb_agg(to_jsonb(fh.*)) FROM public.ir_family_history fh WHERE fh.person_id = p.person_id) AS family_history,
    (SELECT jsonb_agg(to_jsonb(lc.*)) FROM public.ir_local_contacts lc WHERE lc.person_id = p.person_id) AS local_contacts,
    (SELECT jsonb_agg(to_jsonb(mo.*)) FROM public.ir_modus_operandi mo JOIN public.interrogation_reports ir_inner ON mo.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id) AS modus_operandi,
    (SELECT jsonb_agg(to_jsonb(rh.*)) FROM public.ir_regular_habits rh JOIN public.interrogation_reports ir_inner ON rh.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id) AS regular_habits

FROM public.persons p
-- Only get actual offenders (people who have an accused record)
WHERE EXISTS (SELECT 1 FROM public.accused a WHERE a.person_id = p.person_id);
*/


-- =============================================================================
-- 2. STANDARD VIEW
-- =============================================================================

CREATE OR REPLACE VIEW public.v_offender_details AS
SELECT 
    p.person_id AS offender_id,
    to_jsonb(p.*) AS person_details,
    (SELECT to_jsonb(a_inner.*) FROM public.accused a_inner WHERE a_inner.person_id = p.person_id ORDER BY a_inner.seq_num DESC LIMIT 1) AS latest_physical_features,
    (SELECT kb.tier FROM public.accused a_inner JOIN public.crimes c_inner ON a_inner.crime_id = c_inner.crime_id JOIN public.ssor_kb kb ON c_inner.acts_sections ILIKE '%' || kb.section_code || '%' WHERE a_inner.person_id = p.person_id ORDER BY kb.severity_rank DESC LIMIT 1) AS highest_risk_tier,
    (SELECT jsonb_agg(to_jsonb(c.*)) FROM public.crimes c JOIN public.accused a2 ON c.crime_id = a2.crime_id WHERE a2.person_id = p.person_id) AS crimes,
    (SELECT jsonb_agg(to_jsonb(ar.*)) FROM public.arrests ar WHERE ar.person_id = p.person_id) AS arrests,
    (SELECT jsonb_agg(to_jsonb(cs.*)) FROM public.chargesheets cs JOIN public.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.chargesheet_id::text WHERE csa.accused_person_id = p.person_id) AS chargesheets,
    (SELECT jsonb_agg(to_jsonb(fpb.*)) FROM public.fpb_accused fpb JOIN public.accused a3 ON fpb.crime_id = a3.crime_id WHERE a3.person_id = p.person_id) AS fingerprint_bureau_records,
    (SELECT jsonb_agg(to_jsonb(ir.*)) FROM public.interrogation_reports ir WHERE ir.person_id = p.person_id) AS interrogation_reports,
    (SELECT jsonb_agg(to_jsonb(fh.*)) FROM public.ir_family_history fh WHERE fh.person_id = p.person_id) AS family_history,
    (SELECT jsonb_agg(to_jsonb(lc.*)) FROM public.ir_local_contacts lc WHERE lc.person_id = p.person_id) AS local_contacts,
    (SELECT jsonb_agg(to_jsonb(mo.*)) FROM public.ir_modus_operandi mo JOIN public.interrogation_reports ir_inner ON mo.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id) AS modus_operandi,
    (SELECT jsonb_agg(to_jsonb(rh.*)) FROM public.ir_regular_habits rh JOIN public.interrogation_reports ir_inner ON rh.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id) AS regular_habits
FROM public.persons p
WHERE EXISTS (SELECT 1 FROM public.accused a WHERE a.person_id = p.person_id);


-- =============================================================================
-- 3. MATERIALIZED VIEW
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.mv_offender_details;

CREATE MATERIALIZED VIEW public.mv_offender_details AS
SELECT 
    p.person_id AS offender_id,
    to_jsonb(p.*) AS person_details,
    (SELECT to_jsonb(a_inner.*) FROM public.accused a_inner WHERE a_inner.person_id = p.person_id ORDER BY a_inner.seq_num DESC LIMIT 1) AS latest_physical_features,
    (SELECT kb.tier FROM public.accused a_inner JOIN public.crimes c_inner ON a_inner.crime_id = c_inner.crime_id JOIN public.ssor_kb kb ON c_inner.acts_sections ILIKE '%' || kb.section_code || '%' WHERE a_inner.person_id = p.person_id ORDER BY kb.severity_rank DESC LIMIT 1) AS highest_risk_tier,
    (SELECT jsonb_agg(to_jsonb(c.*)) FROM public.crimes c JOIN public.accused a2 ON c.crime_id = a2.crime_id WHERE a2.person_id = p.person_id) AS crimes,
    (SELECT jsonb_agg(to_jsonb(ar.*)) FROM public.arrests ar WHERE ar.person_id = p.person_id) AS arrests,
    (SELECT jsonb_agg(to_jsonb(cs.*)) FROM public.chargesheets cs JOIN public.chargesheet_accused csa ON cs.charge_sheet_id::text = csa.chargesheet_id::text WHERE csa.accused_person_id = p.person_id) AS chargesheets,
    (SELECT jsonb_agg(to_jsonb(fpb.*)) FROM public.fpb_accused fpb JOIN public.accused a3 ON fpb.crime_id = a3.crime_id WHERE a3.person_id = p.person_id) AS fingerprint_bureau_records,
    (SELECT jsonb_agg(to_jsonb(ir.*)) FROM public.interrogation_reports ir WHERE ir.person_id = p.person_id) AS interrogation_reports,
    (SELECT jsonb_agg(to_jsonb(fh.*)) FROM public.ir_family_history fh WHERE fh.person_id = p.person_id) AS family_history,
    (SELECT jsonb_agg(to_jsonb(lc.*)) FROM public.ir_local_contacts lc WHERE lc.person_id = p.person_id) AS local_contacts,
    (SELECT jsonb_agg(to_jsonb(mo.*)) FROM public.ir_modus_operandi mo JOIN public.interrogation_reports ir_inner ON mo.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id) AS modus_operandi,
    (SELECT jsonb_agg(to_jsonb(rh.*)) FROM public.ir_regular_habits rh JOIN public.interrogation_reports ir_inner ON rh.interrogation_report_id = ir_inner.interrogation_report_id WHERE ir_inner.person_id = p.person_id) AS regular_habits
FROM public.persons p
WHERE EXISTS (SELECT 1 FROM public.accused a WHERE a.person_id = p.person_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_offender_details_id ON public.mv_offender_details (offender_id);
