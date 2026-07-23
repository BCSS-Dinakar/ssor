import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { searchEpettyCandidate } from '../services/epetty.service.js';
import { searchCctnsCandidate, shouldSkipEpettyAfterCctns } from '../services/cctns.service.js';
import { generateClearanceReport } from '../services/gemini.service.js';
import { streamDocument, statObject, getPresignedUrl, SIGNED_URL_EXPIRY_SECONDS } from '../services/storage.service.js';
import { withVerificationUrls, withVerificationUrlsList, resolveObjectKey } from '../services/media.service.js';

export const getLogs = async (req, res) => {
  try {
    const logs = await prisma.systemAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          include: { policeProfile: true }
        }
      }
    });

    const formattedLogs = logs.map(log => ({
      id: log.id,
      time: log.createdAt.toLocaleString(),
      rawTime: log.createdAt.toISOString(),
      who: log.user?.policeProfile?.name || log.user?.loginId || 'Unknown Officer',
      badgeId: log.user?.policeProfile?.badgeId || 'N/A',
      rank: log.user?.policeProfile?.rank || 'N/A',
      role: log.user?.role || 'Unknown',
      action: log.action,
      node: log.ipAddress || 'Internal/Protected Node'
    }));

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const getVerifications = async (req, res) => {
  try {
    const rows = await prisma.candidateVerification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    const data = await withVerificationUrlsList(rows);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const getVerificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const verification = await prisma.candidateVerification.findUnique({
      where: { id }
    });

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    res.status(200).json({ success: true, data: await withVerificationUrls(verification) });
  } catch (error) {
    console.error('[getVerificationById Error]', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const updateVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, policeFeedback } = req.body;

    const verification = await prisma.candidateVerification.update({
      where: { id },
      data: { status, policeFeedback }
    });

    // Also log this action
    await prisma.systemAuditLog.create({
      data: {
        userId: req.user.id,
        action: `Updated verification ${id} status to ${status}`,
        ipAddress: req.ip
      }
    });

    res.status(200).json({ success: true, data: verification });
  } catch (error) {
    console.error('[updateVerificationStatus Error]', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const scanVerificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const verification = await prisma.candidateVerification.findUnique({ where: { id } });
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification record not found.' });
    }

    // Mark status as verifying
    await prisma.candidateVerification.update({
      where: { id },
      data: { status: 'verifying' }
    });

    const requestDob = verification.dob ? new Date(verification.dob).toISOString().split('T')[0] : '—';

    const cctnsOutcome = await searchCctnsCandidate({
      candidateName: verification.candidateName,
      candidatePhone: verification.phone,
      aadharNumber: verification.aadharNumber,
      fatherName: verification.fatherName
    });
    const cctnsSuspects = cctnsOutcome.matches;

    let epettyOutcome = { matches: [], lookupError: null, matchedSource: null, priorityLabel: null };
    let epettySuspects = [];

    const mapEpettyMatchMeta = (priorityLabel = '') => {
      if (priorityLabel.includes('Name & Phone')) {
        return { matchCategory: 'epetty_name_phone', matchCategoryLabel: 'Name + phone exact', matchParams: ['name', 'phone'], confidence: 94 };
      }
      if (priorityLabel.includes('Father')) {
        return { matchCategory: 'epetty_name_father', matchCategoryLabel: 'Name + father exact', matchParams: ['name', 'father'], confidence: 85 };
      }
      if (priorityLabel.includes('Exact Name')) {
        return { matchCategory: 'epetty_name', matchCategoryLabel: 'Name exact', matchParams: ['name'], confidence: 78 };
      }
      if (priorityLabel.includes('Exact Phone')) {
        return { matchCategory: 'epetty_phone', matchCategoryLabel: 'Phone exact', matchParams: ['phone'], confidence: 62 };
      }
      return { matchCategory: 'epetty_custom', matchCategoryLabel: 'Custom filter match', matchParams: [], confidence: 50 };
    };

    if (!shouldSkipEpettyAfterCctns(cctnsOutcome)) {
      epettyOutcome = await searchEpettyCandidate({
        candidateName: verification.candidateName,
        candidatePhone: verification.phone,
        fatherName: verification.fatherName,
        occupation: verification.role,
      });
      const epettyMeta = mapEpettyMatchMeta(epettyOutcome.priorityLabel || '');
      epettySuspects = epettyOutcome.matches.map(m => ({
        id: m.recordId || m.caseNumber || '—',
        name: m.name || m.offenderName || '—',
        alias: m.alias || '—',
        age: m.age || '—',
        fatherName: m.fatherName || '—',
        dob: m.dob || requestDob,
        phone: m.phone || '—',
        address: m.address || '—',
        offence: m.offence || m.offenceType || '—',
        firNo: m.firNo || m.caseNumber || '—',
        firDate: m.firDate || m.incidentDate || '—',
        courtName: m.courtName || (m.disposalStatus ? `Status: ${m.disposalStatus}` : '—'),
        convDate: m.convDate || m.incidentDate || '—',
        riskTier: m.riskTier || 'Orange',
        source: 'ePetty Case',
        sourceType: 'epetty',
        priority: epettyOutcome.priorityLabel || 'ePetty Match',
        ...epettyMeta
      }));
    }

    const suspects = [...cctnsSuspects, ...epettySuspects];
    const matchedSources = [
      cctnsSuspects.length > 0 ? 'CCTNS' : null,
      epettySuspects.length > 0 ? 'ePetty Case' : null
    ].filter(Boolean);
    const matchedSource = matchedSources.length > 0 ? matchedSources.join(' + ') : 'None';
    const priorityLabel = matchedSources.length > 1
      ? 'Multi-Source Match'
      : (cctnsOutcome.priorityLabel || epettyOutcome.priorityLabel || suspects[0]?.priority || 'No Match');

    await prisma.systemAuditLog.create({
      data: {
        userId: req.user.id,
        action: `Ran CCTNS/ePetty Database Scan on ${verification.candidateName} (${id}) -> Outcome: ${suspects.length} matches across ${matchedSource}`,
        ipAddress: req.ip
      }
    });

    res.status(200).json({
      success: true,
      matchedSource,
      priorityLabel,
      sourceCounts: {
        cctns: cctnsSuspects.length,
        epetty: epettySuspects.length
      },
      cctnsStatus: cctnsOutcome.lookupError ? 'unavailable' : 'checked',
      cctnsError: cctnsOutcome.lookupError || null,
      epettyStatus: shouldSkipEpettyAfterCctns(cctnsOutcome)
        ? 'skipped'
        : (epettyOutcome.lookupError ? 'unavailable' : 'checked'),
      epettyError: epettyOutcome.lookupError || null,
      cctnsMatches: cctnsSuspects,
      epettyMatches: epettySuspects,
      suspects
    });
  } catch (error) {
    console.error('[scanVerificationById Error]', error);
    res.status(500).json({ success: false, message: 'Server error during scan.', error: error.message });
  }
};

export const generateVerificationReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, matchedSuspect } = req.body;

    if (!['cleared', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status for report generation' });
    }

    const verification = await prisma.candidateVerification.findUnique({ where: { id } });
    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification record not found' });
    }

    const report = await generateClearanceReport(verification, status, matchedSuspect);
    res.status(200).json({ success: true, report });
  } catch (error) {
    console.error('[generateVerificationReport Error]', error);
    res.status(500).json({ success: false, message: 'Server error generating report.', error: error.message });
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const orgs = await prisma.user.findMany({
      where: { role: 'organization' },
      include: { organizationProfile: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const orgUser = await prisma.user.findUnique({
      where: { id },
      include: { organizationProfile: true }
    });

    if (!orgUser || orgUser.role !== 'organization') {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.status(200).json({ success: true, data: orgUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const updateOrganizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const orgUser = await prisma.user.findUnique({ where: { id }, include: { organizationProfile: true } });
    if (!orgUser) return res.status(404).json({ success: false, message: 'Organization not found' });

    const updated = await prisma.user.update({
      where: { id },
      data: { status }
    });

    // Add Audit Log
    const orgName = orgUser.organizationProfile?.orgName || orgUser.loginId;
    await prisma.systemAuditLog.create({
      data: {
        userId: req.user.id,
        action: `Changed status of organization '${orgName}' to '${status}'`,
        ipAddress: req.ip
      }
    });

    res.status(200).json({ success: true, data: updated, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const getDocument = async (req, res) => {
  try {
    const { filename } = req.params;

    // Reject path traversal in the reference
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(403).json({ success: false, message: 'Forbidden access' });
    }

    const objectKey = await resolveObjectKey(filename);
    if (!objectKey) return res.status(404).json({ success: false, message: 'Document not found' });
    await streamDocument(res, objectKey, { notFoundMessage: 'Document not found' });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
  }
};

/**
 * Permanent-link endpoint: returns a fresh, time-limited signed URL for a stored
 * document key. Only the permanent key lives in the DB; the URL is transient.
 * Response: { success, url, expiresIn }
 */
export const getDocumentSignedUrl = async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(403).json({ success: false, message: 'Forbidden access' });
    }

    const objectKey = await resolveObjectKey(filename);
    if (!objectKey || !(await statObject(objectKey))) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const url = await getPresignedUrl(objectKey, SIGNED_URL_EXPIRY_SECONDS, objectKey);
    res.status(200).json({ success: true, url, expiresIn: SIGNED_URL_EXPIRY_SECONDS });
  } catch (error) {
    console.error('[getDocumentSignedUrl Error]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating document link' });
    }
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const clearPending = await prisma.candidateVerification.count({
      where: { status: 'pending' }
    });

    const totalResult = await prisma.$queryRaw`SELECT count(*) as total FROM public.mv_offenders_list`;
    const totalOffenders = Number(totalResult[0]?.total || 0);

    const trialResult = await prisma.$queryRaw`SELECT count(*) as count FROM public.mv_offenders_list WHERE current_status ILIKE '%Arrest%'`;
    const underTrialCount = Number(trialResult[0]?.count || 0);
    // Generic assumption for convictions since DB only tracks arrest actions
    const convictedCount = Math.max(0, totalOffenders - underTrialCount);

    const tierResult = await prisma.$queryRaw`SELECT risk_tier, count(*) as count FROM public.mv_offenders_list GROUP BY risk_tier`;
    const byTier = tierResult.map(t => ({
      tier: (t.risk_tier || 'orange').toLowerCase(),
      count: Number(t.count)
    }));

    const offenceResult = await prisma.$queryRaw`SELECT primary_offence, count(*) as count FROM public.mv_offenders_list WHERE primary_offence IS NOT NULL AND primary_offence != '' AND primary_offence != '—' GROUP BY primary_offence ORDER BY count DESC LIMIT 6`;
    const sectionData = offenceResult.map(o => ({
      name: o.primary_offence,
      value: Number(o.count)
    }));

    res.status(200).json({
      success: true,
      data: {
        totalOffenders,
        convictedCount,
        underTrialCount,
        clearPending,
        byTier,
        sectionData
      }
    });

  } catch (error) {
    console.error('[getDashboardStats error]', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        organization: { select: { organizationProfile: true } },
        messages: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    console.error('[getTickets error]', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const policeProfile = await prisma.policeProfile.findUnique({ where: { userId: req.user.id } });
    const assignee = policeProfile ? policeProfile.name : 'Police Officer';

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status, assignee }
    });
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    console.error('[updateTicketStatus error]', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const addTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    const policeProfile = await prisma.policeProfile.findUnique({ where: { userId: req.user.id } });
    const senderName = policeProfile ? `${policeProfile.rank} ${policeProfile.name}` : 'Police Officer';

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderName,
        senderRole: 'Police',
        text
      }
    });

    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date(), assignee: policeProfile ? policeProfile.name : 'Police Officer' }
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('[addTicketMessage error]', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const getOffendersList = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', tier = '' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = Prisma.sql`WHERE 1=1`;
    if (search) {
      const searchParam = `%${search}%`;
      whereClause = Prisma.sql`${whereClause} AND (offender_name ILIKE ${searchParam} OR offender_id ILIKE ${searchParam} OR police_station ILIKE ${searchParam})`;
    }
    if (tier) {
      const tiers = tier.split(',').map(t => t.trim()).filter(Boolean);
      if (tiers.length > 0) {
        const tierConditions = tiers.map(t => Prisma.sql`risk_tier ILIKE ${t}`);
        whereClause = Prisma.sql`${whereClause} AND (${Prisma.join(tierConditions, ' OR ')})`;
      }
    }

    const rawData = await prisma.$queryRaw`
      SELECT * FROM public.mv_offenders_list
      ${whereClause}
      ORDER BY offender_id ASC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const countResult = await prisma.$queryRaw`
      SELECT count(*) as total FROM public.mv_offenders_list
      ${whereClause}
    `;
    const total = Number(countResult[0]?.total || 0);

    // Map the database columns to the UI's expected format
    const offenders = rawData.map(row => ({
      id: row.offender_id,
      name: row.offender_name,
      age: '—', // Not in list view
      area: row.police_station || 'Unknown',
      ps: row.police_station || 'Unknown',
      tier: (row.risk_tier || 'orange').toLowerCase(),
      offence: row.primary_offence || '—',
      cc: '—', // Not in list view
      status: 'active'
    }));
    
    res.status(200).json({ 
      success: true, 
      data: offenders, 
      pagination: { total, page: pageNum, limit: limitNum } 
    });
  } catch (error) {
    console.error('[getOffendersList error]', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const getOffenderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rawData = await prisma.$queryRaw`
      SELECT * FROM public.mv_offender_details
      WHERE offender_id = ${id}
      LIMIT 1
    `;

    if (!rawData || rawData.length === 0) {
      return res.status(404).json({ success: false, message: 'Offender not found' });
    }

    const row = rawData[0];
    
    const fillObj = (obj, fields) => {
      const result = {};
      fields.forEach(f => {
        result[f] = (obj && obj[f] !== null && obj[f] !== undefined && obj[f] !== '') ? obj[f] : 'N/A';
      });
      return result;
    };

    const fillArr = (arr, fields) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) {
        // Return at least one object filled with N/A so the structure is visible
        return [fillObj({}, fields)];
      }
      return arr.map(item => fillObj(item, fields));
    };

    const personFields = ['person_id', 'name', 'surname', 'alias', 'full_name', 'relation_type', 'relative_name', 'gender', 'is_died', 'date_of_birth', 'age', 'occupation', 'education_qualification', 'caste', 'sub_caste', 'religion', 'nationality', 'designation', 'place_of_work', 'present_house_no', 'present_street_road_no', 'present_ward_colony', 'present_landmark_milestone', 'present_locality_village', 'present_area_mandal', 'present_district', 'present_state_ut', 'present_country', 'present_residency_type', 'present_pin_code', 'present_jurisdiction_ps', 'phone_number', 'country_code', 'email_id', 'date_created', 'date_modified', 'raw_full_name', 'gender_confidence', 'gender_source', 'phone_numbers'];
    
    const accusedFields = ['accused_id', 'crime_id', 'person_id', 'seq_num', 'is_known', 'is_named', 'is_absconding', 'is_arrested', 'arrest_date', 'status', 'pf_height', 'pf_build', 'pf_color', 'pf_eyes', 'pf_hair', 'pf_beard', 'pf_mustache', 'pf_face', 'pf_mole', 'pf_leucoderma', 'age', 'date_created', 'date_modified'];

    const crimeFields = ['crime_id', 'crime_number', 'fir_no', 'fir_date', 'ps_id', 'police_station', 'district_id', 'district', 'acts_sections', 'brief_fact', 'day_of_week', 'fir_reg_time', 'fir_type', 'gd_entry_date', 'gd_entry_num', 'gd_entry_type', 'occurrence_from_date', 'occurrence_prior_to_date', 'occurrence_to_date', 'poo_area_mandal', 'poo_beat_no', 'poo_district', 'poo_house_no', 'poo_jurisdiction_ps', 'poo_landmark_milestone', 'poo_latitude', 'poo_limits', 'poo_longitude', 'poo_pin_code', 'poo_state_ut', 'poo_street_road_no', 'poo_ward_colony', 'additional_json_data'];

    const arrestFields = ['arrest_id', 'person_id', 'crime_no', 'district', 'ps_name', 'section_of_law', 'state_of_arrest', 'date_of_arrest', 'date_fetched'];

    const chargesheetFields = ['charge_sheet_id', 'charge_sheet_no', 'charge_sheet_date', 'court_name', 'section_of_law', 'fir_num', 'fir_date', 'ps_code', 'date_fetched'];

    const fpbFields = ['fpb_accused_id', 'crime_id', 'person_id', 'fir_num', 'ps_code', 'age', 'alias', 'caste', 'cc_kd_dc_no', 'confession_statement', 'date_fingerprinted', 'date_of_arrest', 'dob', 'father_husband_name', 'fir_reg_num', 'fp_unit', 'full_name', 'mo', 'nationality', 'occupation', 'phone_number', 'place_of_birth', 'property_recovered', 'ps_where_fps_obtained', 'religion', 'remarks', 'sex', 'slip_type', 'surname', 'aadhaar_or_other_id_number', 'aadhaar_or_other_id_type', 'arrest_details_crime_no', 'arrest_details_crime_year', 'arrest_details_district', 'arrest_details_ps_name', 'arrest_details_section_of_law', 'arrest_details_state_of_arrest', 'permanent_address_address', 'permanent_address_district', 'permanent_address_state_ut', 'present_address_address', 'present_address_district', 'present_address_state_ut', 'pf_beard', 'pf_chin', 'pf_complexion_of_face', 'pf_ear', 'pf_eyebrows', 'pf_forehead', 'pf_hair', 'pf_hair_color', 'pf_height', 'pf_jaws', 'pf_lips', 'pf_moustaches', 'pf_mouth', 'pf_neck', 'pf_nose', 'pf_shape_of_face', 'pf_weight', 'date_fetched'];

    const irFields = ['interrogation_report_id', 'crime_id', 'person_id', 'physical_beard', 'physical_build', 'physical_burn_marks', 'physical_color', 'physical_deformities_or_peculiarities', 'physical_deformities', 'physical_ear', 'physical_eyes', 'physical_face', 'physical_hair', 'physical_height', 'physical_identification_marks', 'physical_language_or_dialect', 'physical_leucoderma', 'physical_mole', 'physical_mustache', 'physical_nose', 'physical_scar', 'physical_tattoo', 'physical_teeth', 'socio_living_status', 'socio_marital_status', 'socio_education', 'socio_occupation', 'socio_income_group', 'offence_time', 'other_offence_time', 'share_of_amount_spent', 'other_share_of_amount_spent', 'share_remarks', 'is_in_jail', 'from_where_sent_in_jail', 'in_jail_crime_num', 'in_jail_dist_unit', 'is_on_bail', 'from_where_sent_on_bail', 'on_bail_crime_num', 'date_of_bail', 'is_absconding', 'wanted_in_police_station', 'absconding_crime_num', 'is_normal_life', 'eking_livelihood_by_labor_work', 'is_rehabilitated', 'rehabilitation_details', 'is_dead', 'death_details', 'is_facing_trial', 'facing_trial_ps_name', 'facing_trial_crime_num', 'other_regular_habits', 'other_indulgence_before_offence', 'time_since_modus_operandi', 'date_created', 'date_modified'];

    const famFields = ['id', 'interrogation_report_id', 'person_id', 'relation', 'family_member_peculiarity', 'criminal_background', 'is_alive', 'family_stay_together'];
    const contactFields = ['id', 'interrogation_report_id', 'person_id', 'town', 'address', 'jurisdiction_ps'];
    const moFields = ['id', 'interrogation_report_id', 'crime_head', 'crime_sub_head', 'modus_operandi'];
    const habitFields = ['id', 'interrogation_report_id', 'habit'];

    const offenderDetail = {
      offender_id: row.offender_id,
      highest_risk_tier: row.highest_risk_tier || 'N/A',
      person_details: fillObj(row.person_details, personFields),
      latest_physical_features: fillObj(row.latest_physical_features, accusedFields),
      crimes: fillArr(row.crimes, crimeFields),
      arrests: fillArr(row.arrests, arrestFields),
      chargesheets: fillArr(row.chargesheets, chargesheetFields),
      interrogation_reports: fillArr(row.interrogation_reports, irFields),
      modus_operandi: fillArr(row.modus_operandi, moFields),
      family_history: fillArr(row.family_history, famFields),
      local_contacts: fillArr(row.local_contacts, contactFields),
      regular_habits: fillArr(row.regular_habits, habitFields),
      fingerprint_bureau_records: fillArr(row.fingerprint_bureau_records, fpbFields)
    };

    res.status(200).json({ success: true, data: offenderDetail });
  } catch (error) {
    console.error('[getOffenderById error]', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};
