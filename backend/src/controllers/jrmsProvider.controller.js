// Controller for APIs exposed to the JRMS third-party integration.
// Every handler consumed by the JRMS provider should live in this file.
import prisma from '../config/db.js';
import { setCache, getCache } from '../config/redis.js';
import { processReleaseBatch } from '../services/release-alert.service.js';
import { TELANGANA_POLICE_STATIONS } from '../config/policeStations.js';

const RELEASE_ALERTS_CACHE_KEY = 'jrms:eprisoners_release_alerts';
const ONE_DAY_SECONDS = 24 * 60 * 60;
const stationByCode = new Map(TELANGANA_POLICE_STATIONS.map((s) => [s.code, s]));

const DATE_FORMAT = /^\d{2}\/\d{2}\/\d{4}$/; // DD/MM/YYYY

// Title-cases ssor_kb's uppercase tier ('RED' -> 'Red') to match what the
// map UI expects (r.riskTier === 'Red' / 'Orange').
const toTitleCase = (s) => s.charAt(0) + s.slice(1).toLowerCase();

// Release-alert POST body shape. Required fields are what the map UI and the
// WhatsApp dispatcher (release-alert.service.js) actually key off; optional
// fields are shown if present but degrade to "N/A" in the UI when absent.
//
// riskTier and sectionsOfLaw are NOT sent by JRMS — both are derived
// server-side from `sections` via the ssor_kb table (see GET /ssor_sections),
// same as psName/district are derived from psCode. A prisoner can be charged
// under multiple acts/sections, so `sections` is an array; the overall
// riskTier is the highest-severity tier among all of them.
const ALERT_FIELDS = {
  id: { required: true, type: 'string' },
  prisonerName: { required: true, type: 'string' },
  psCode: { required: true, type: 'string' }, // must match GET /police_stations
  releaseDate: { required: true, type: 'string', pattern: DATE_FORMAT, patternHint: 'DD/MM/YYYY' },
  sections: { required: true, type: 'sections' }, // [{ actName, sectionCode }, ...], each must match GET /ssor_sections
  fatherName: { required: false, type: 'string' },
  age: { required: false, type: 'number' },
  jailName: { required: false, type: 'string' },
  caseDetails: { required: false, type: 'string' },
  surveillanceOfficer: { required: false, type: 'string' },
  status: { required: false, type: 'string' },
};

// Validates one alert against ALERT_FIELDS, returning a list of "field: problem"
// strings (empty if valid). Cross-referencing psCode/sections against our own
// master data happens separately in postReleaseAlerts, since it needs the
// shared lookup maps.
function validateAlert(alert) {
  const errors = [];
  for (const [field, rule] of Object.entries(ALERT_FIELDS)) {
    const value = alert[field];
    const present = value !== undefined && value !== null && value !== '';

    if (!present) {
      if (rule.required) errors.push(`${field}: required`);
      continue;
    }
    if (rule.type === 'string' && typeof value !== 'string') {
      errors.push(`${field}: must be a string`);
    } else if (rule.type === 'number' && typeof value !== 'number') {
      errors.push(`${field}: must be a number`);
    } else if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(`${field}: must match ${rule.patternHint}`);
    } else if (rule.enum && !rule.enum.includes(value)) {
      errors.push(`${field}: must be one of ${rule.enum.join(', ')}`);
    } else if (rule.type === 'sections') {
      if (!Array.isArray(value) || value.length === 0) {
        errors.push('sections: must be a non-empty array of { actName, sectionCode }');
      } else {
        value.forEach((s, i) => {
          if (!s || typeof s !== 'object') errors.push(`sections[${i}]: must be an object`);
          else {
            if (typeof s.actName !== 'string' || !s.actName) errors.push(`sections[${i}].actName: required string`);
            if (typeof s.sectionCode !== 'string' || !s.sectionCode) errors.push(`sections[${i}].sectionCode: required string`);
          }
        });
      }
    }
  }
  return errors;
}

// RED > BLACK > ORANGE > BLUE > PINK (see ssor_kb.severity_rank). Given a
// prisoner's matched tier rows, the overall riskTier is whichever is worst.
function worstTier(tierRows) {
  return tierRows.reduce((worst, r) => (r.severity_rank > worst.severity_rank ? r : worst)).tier;
}

// Reference list of police stations, so JRMS knows which `code` to attach
// to each release alert it posts to /eprisoners_release_alerts.
export const getPoliceStations = async (req, res) => {
  res.status(200).json({ success: true, data: TELANGANA_POLICE_STATIONS });
};

export const getSections = async (req, res) => {
  try {
    const rows = await prisma.ssor_kb.findMany({
      orderBy: { id: 'asc' },
      select: { act_name: true, section_code: true, description: true },
    });
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// JRMS posts today's prisoner-release alerts here. Each call replaces the
// stored list — alerts are daily, so a fresh POST is the day's full set.
// Stored in Redis (or the automatic local-file fallback in config/redis.js
// when Redis is down) with a 24h TTL, since the data is only ever relevant
// for the day it was posted.
//
// JRMS only needs to send `psCode` (from GET /police_stations) and a
// `sections` array (each { actName, sectionCode }, from GET /ssor_sections)
// — psName/district and riskTier are looked up and attached here from our
// own master data, so JRMS doesn't decide risk classification itself.
export const postReleaseAlerts = async (req, res) => {
  try {
    const rawAlerts = Array.isArray(req.body) ? req.body : [req.body];
    if (rawAlerts.length === 0 || rawAlerts.some((a) => !a || typeof a !== 'object' || Array.isArray(a))) {
      return res.status(400).json({ success: false, message: 'Body must be an alert object or a non-empty array of alert objects.' });
    }

    // Look up every (actName, sectionCode) pair used across this batch in one query.
    const allSections = rawAlerts.flatMap((a) => (Array.isArray(a.sections) ? a.sections : []));
    const sectionPairs = [...new Map(
      allSections.filter((s) => s && s.actName && s.sectionCode).map((s) => [`${s.actName}::${s.sectionCode}`, { act_name: s.actName, section_code: s.sectionCode }])
    ).values()];
    const sectionRows = sectionPairs.length > 0
      ? await prisma.ssor_kb.findMany({ where: { OR: sectionPairs } })
      : [];
    const rowBySection = new Map(sectionRows.map((r) => [`${r.act_name}::${r.section_code}`, r]));

    const errorsByIndex = rawAlerts
      .map((alert, index) => {
        const errors = validateAlert(alert);
        if (alert.psCode && !stationByCode.has(alert.psCode)) {
          errors.push(`psCode: unknown code "${alert.psCode}" — see GET /police_stations for valid codes`);
        }
        if (Array.isArray(alert.sections)) {
          alert.sections.forEach((s, i) => {
            if (s?.actName && s?.sectionCode && !rowBySection.has(`${s.actName}::${s.sectionCode}`)) {
              errors.push(`sections[${i}]: no matching entry for "${s.actName} ${s.sectionCode}" — see GET /ssor_sections for valid combinations`);
            }
          });
        }
        return { index, errors };
      })
      .filter((e) => e.errors.length > 0);

    if (errorsByIndex.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more alerts failed validation.',
        errors: errorsByIndex,
      });
    }

    const alerts = rawAlerts.map((a) => {
      const station = stationByCode.get(a.psCode);
      const tierRows = a.sections.map((s) => rowBySection.get(`${s.actName}::${s.sectionCode}`));
      return {
        ...a,
        psName: station.name,
        district: station.district,
        riskTier: toTitleCase(worstTier(tierRows)),
        sectionsOfLaw: a.sections.map((s) => `${s.actName} ${s.sectionCode}`).join(', '),
      };
    });

    await setCache(RELEASE_ALERTS_CACHE_KEY, alerts, ONE_DAY_SECONDS);

    // Notify districts (WhatsApp) for this batch — fire-and-forget.
    processReleaseBatch(alerts);

    res.status(200).json({ success: true, message: `Stored ${alerts.length} release alert(s) for 24h.`, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Fetches today's release alerts as last posted by JRMS. Empty list once the
// 24h TTL has expired (or nothing has been posted yet today).
export const getReleaseAlerts = async (req, res) => {
  try {
    const alerts = (await getCache(RELEASE_ALERTS_CACHE_KEY, true)) || [];
    res.status(200).json({ success: true, data: alerts, count: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
