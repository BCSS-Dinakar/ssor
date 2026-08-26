import prisma from '../config/db.js';
import { sendText, sendTemplateByKey } from './whatsapp.service.js';
import logger from '../utils/logger.js';

const RELEASE_ALERT_TEMPLATE_KEY = 'ssor_release_alert';

/**
 * Determine the district code for a given police station name
 * by looking it up in cctns_etl.hierarchy via FDW.
 */
async function resolveDistCodeFromPS(psName) {
  if (!psName) return null;
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT dist_code FROM cctns_etl.hierarchy
       WHERE LOWER(ps_name) LIKE LOWER($1)
         AND dist_code IS NOT NULL AND dist_code != ''
       LIMIT 1`,
      `%${psName.trim()}%`
    );
    return rows?.[0]?.dist_code || null;
  } catch (err) {
    logger.warn('[ReleaseAlert] PS→district lookup failed:', err.message);
    return null;
  }
}

/**
 * Extract a likely police station name from a caseDetails string.
 * e.g. "Cr.No. 245/2024, Cyberabad PS" → "Cyberabad"
 */
function extractPSFromCaseDetails(caseDetails) {
  if (!caseDetails) return null;
  // Pattern: text before " PS" or " Police Station"
  const match = caseDetails.match(/,?\s+([A-Za-z\s]+?)\s+(?:PS|Police\s+Station)/i);
  if (match) return match[1].trim();
  return null;
}

/**
 * Build the WhatsApp free-form text message for a release alert.
 */
function buildAlertMessage(record, distName, policeStation) {
  const lines = [
    `🚨 *PRISONER RELEASE ALERT*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `*District:* ${distName || 'N/A'}`,
    `*Police Station:* ${policeStation || 'N/A'}`,
    `*Prisoner:* ${record.prisonerName || 'N/A'}`,
    record.fatherName ? `*Father's Name:* ${record.fatherName}` : null,
    `*Prison:* ${record.jailName || 'N/A'}`,
    `*Release Date:* ${record.releaseDate || 'N/A'}`,
    `*Case Details:* ${record.caseDetails || 'N/A'}`,
    `*Sections:* ${record.sectionsOfLaw || 'N/A'}`,
    record.surveillanceOfficer ? `*Surveillance:* ${record.surveillanceOfficer}` : null,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `*Status:* ${record.status || 'Released'}`,
    `\n_This is an automated alert from SSOR Portal._`
  ].filter(Boolean).join('\n');

  return lines;
}

/**
 * Build the named-parameter payload for the ssor_release_alert template.
 * Templates can't omit a variable slot conditionally, so optional fields
 * fall back to 'N/A' the same way the free-text fields already do.
 */
function buildTemplateParams(record, distName, policeStation) {
  return {
    district: distName || 'N/A',
    police_station: policeStation || 'N/A',
    prisoner_name: record.prisonerName || 'N/A',
    father_name: record.fatherName || 'N/A',
    prison_name: record.jailName || 'N/A',
    release_date: record.releaseDate || 'N/A',
    case_details: record.caseDetails || 'N/A',
    sections: record.sectionsOfLaw || 'N/A',
    surveillance_officer: record.surveillanceOfficer || 'N/A',
    status: record.status || 'Released',
  };
}

/**
 * Core alert dispatcher.
 * Given one release record, determines district, loads settings,
 * sends WhatsApp if configured, and logs to NotificationHistory.
 *
 * @param {object} record - Release record from ePrisons
 * @param {boolean} isTest - Skip PS lookup for test alerts
 */
export async function sendReleaseAlert(record, isTest = false) {
  const result = { sent: [], skipped: [], failed: [] };

  try {
    // 1. Determine distCode
    let distCode = record.distCode || null;

    if (!distCode && !isTest) {
      // Try to resolve from PS name in caseDetails
      const psName = extractPSFromCaseDetails(record.caseDetails);
      if (psName) {
        distCode = await resolveDistCodeFromPS(psName);
      }

      // Fallback: try jail district name → dist_name match
      if (!distCode && record.district) {
        try {
          const rows = await prisma.$queryRawUnsafe(
            `SELECT DISTINCT dist_code FROM cctns_etl.hierarchy
             WHERE LOWER(dist_name) LIKE LOWER($1)
               AND dist_code IS NOT NULL AND dist_code != ''
             LIMIT 1`,
            `%${record.district.trim()}%`
          );
          distCode = rows?.[0]?.dist_code || null;
        } catch (_) { /* silent */ }
      }
    }

    if (!distCode) {
      logger.warn(`[ReleaseAlert] Could not resolve distCode for record ${record.id}`);
      result.skipped.push({ record: record.id, reason: 'distCode unresolvable' });
      return result;
    }

    // 2. Ensure district row exists in local table
    let districtRow = await prisma.district.findUnique({ where: { distCode } });
    if (!districtRow) {
      // Auto-provision from hierarchy
      try {
        const rows = await prisma.$queryRawUnsafe(
          `SELECT DISTINCT dist_name FROM cctns_etl.hierarchy WHERE dist_code = $1 LIMIT 1`,
          distCode
        );
        const distName = rows?.[0]?.dist_name || distCode;
        districtRow = await prisma.district.upsert({
          where: { distCode },
          update: { distName },
          create: { distCode, distName }
        });
      } catch (_) {
        result.skipped.push({ record: record.id, reason: 'district not in local table' });
        return result;
      }
    }

    // 3. Load notification settings
    const settings = await prisma.districtNotificationSettings.findUnique({ where: { distCode } });

    if (!settings || !settings.alertsEnabled) {
      logger.info(`[ReleaseAlert] Alerts disabled or not configured for district ${distCode}`);
      result.skipped.push({ record: record.id, distCode, reason: settings ? 'alerts disabled' : 'not configured' });
      return result;
    }

    const numbers = [settings.primaryWhatsApp, settings.secondaryWhatsApp].filter(Boolean);
    if (numbers.length === 0) {
      logger.info(`[ReleaseAlert] No WhatsApp numbers for district ${distCode}`);
      result.skipped.push({ record: record.id, distCode, reason: 'no numbers configured' });
      return result;
    }

    // 4. Build message (template params for the proactive send, free-text as fallback)
    const policeStation = extractPSFromCaseDetails(record.caseDetails) || record.district || null;
    const templateParams = buildTemplateParams(record, districtRow.distName, policeStation);
    const message = buildAlertMessage(record, districtRow.distName, policeStation);

    // 5. Send to each number and log
    for (const number of numbers) {
      let status = 'sent';
      let apiResponse = null;
      let errorMessage = null;

      try {
        // Prefer the approved template — it works outside the 24h session
        // window, which matters since these are business-initiated alerts.
        const waResult = await sendTemplateByKey(number, RELEASE_ALERT_TEMPLATE_KEY, templateParams);
        apiResponse = JSON.stringify(waResult);
        logger.info(`[ReleaseAlert] Template alert sent to ${number} for district ${distCode}`);
        result.sent.push({ number, distCode, via: 'template' });
      } catch (templateErr) {
        // Template not approved yet / rejected / API error — fall back to
        // free-form text so the alert still lands for anyone inside the
        // 24h window instead of silently failing.
        logger.warn(`[ReleaseAlert] Template send failed for ${number}, falling back to text: ${templateErr.message}`);
        try {
          const waResult = await sendText(number, message);
          apiResponse = JSON.stringify(waResult);
          errorMessage = `Template fallback: ${templateErr.message}`;
          logger.info(`[ReleaseAlert] Fallback text alert sent to ${number} for district ${distCode}`);
          result.sent.push({ number, distCode, via: 'text-fallback' });
        } catch (textErr) {
          status = 'failed';
          errorMessage = `Template failed: ${templateErr.message}; Text fallback failed: ${textErr.message}`;
          logger.error(`[ReleaseAlert] Both template and text failed for ${number}: ${textErr.message}`);
          result.failed.push({ number, distCode, error: errorMessage });
        }
      }

      // Always log to history
      try {
        await prisma.notificationHistory.create({
          data: {
            distCode,
            prisonerId: String(record.id || ''),
            caseNumber: record.caseDetails?.split(',')[0]?.trim() || null,
            prisonerName: record.prisonerName || null,
            policeStation,
            prisonName: record.jailName || null,
            releaseDate: record.releaseDate || null,
            recipient: number,
            status,
            apiResponse,
            errorMessage,
          }
        });
      } catch (logErr) {
        logger.error(`[ReleaseAlert] History log failed: ${logErr.message}`);
      }
    }
  } catch (err) {
    logger.error(`[ReleaseAlert] Unexpected error: ${err.message}`);
    result.failed.push({ record: record.id, error: err.message });
  }

  return result;
}

/**
 * Process an entire batch of release records (called from eprisons route).
 * Runs all alerts concurrently with a concurrency cap.
 */
export async function processReleaseBatch(records) {
  if (!records?.length) return;

  // Fire-and-forget — don't block the HTTP response
  setImmediate(async () => {
    logger.info(`[ReleaseAlert] Processing batch of ${records.length} release records`);
    // Process concurrently in chunks of 5 to avoid hammering WA API
    const CHUNK = 5;
    for (let i = 0; i < records.length; i += CHUNK) {
      const chunk = records.slice(i, i + CHUNK);
      await Promise.allSettled(chunk.map(r => sendReleaseAlert(r)));
    }
    logger.info(`[ReleaseAlert] Batch processing complete`);
  });
}
