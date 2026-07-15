import { env } from '../config/env.js';

export const generateClearanceReport = async (verification, status, matchedSuspect = null) => {
  if (!env.GEMINI_API_KEY) {
    return getDefaultTemplate(verification, status, matchedSuspect);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
  const prompt = buildPrompt(verification, status, matchedSuspect);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      console.warn(`[Gemini] API returned ${response.status} ${response.statusText}. Falling back to template.`);
      return getDefaultTemplate(verification, status, matchedSuspect);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || getDefaultTemplate(verification, status, matchedSuspect);
  } catch (error) {
    console.warn(`[Gemini] Report generation failed: ${error.message}`);
    return getDefaultTemplate(verification, status, matchedSuspect);
  }
};

const buildPrompt = (verification, status, matchedSuspect) => {
  const candidateSummary = `
Candidate Details:
- Full Name: ${verification.candidateName}
- Date of Birth: ${new Date(verification.dob).toLocaleDateString('en-GB')}
- Mobile: ${verification.phone}
- Employer Station: ${verification.orgName} (${verification.orgType})
- Requested Role/Seat: ${verification.role}
- Submission Date: ${new Date(verification.createdAt).toLocaleString('en-GB')}`;

  if (status === 'cleared') {
    return `You are a professional Police Verification Officer generating an official background clearance report.
${candidateSummary}

Findings:
- Database Scan (CCTNS and ePetty cases): Clean. No matches found.
- Verification Status: APPROVED / CLEARED.

Write a formal, structured Police Clearance Report in 100-150 words. Keep the tone strictly administrative and objective.`;
  }

  return `You are a professional Police Verification Officer generating an official background disclosure and rejection report.
${candidateSummary}

Offence / Match Findings:
- Offender Name: ${matchedSuspect?.name || 'N/A'}
- Offender Mobile: ${matchedSuspect?.phone || 'N/A'}
- Father's Name: ${matchedSuspect?.fatherName || 'N/A'}
- DOB / Incident Date: ${matchedSuspect?.dob || 'N/A'}
- Offence/Section Charged: ${matchedSuspect?.offence || 'N/A'}
- Session Court / PS: ${matchedSuspect?.courtName || 'N/A'}
- Record Source: ${matchedSuspect?.source || 'N/A'}
- Case Number / FIR: ${matchedSuspect?.firNo || matchedSuspect?.id || 'N/A'}
- Vetting Status: REJECTED / DISAPPROVED.

Write a formal, structured Police Vetting Rejection Report in 150-200 words. Keep the tone strictly administrative and objective.`;
};

const getDefaultTemplate = (verification, status, matchedSuspect) => {
  const formattedDate = new Date().toLocaleDateString('en-GB');

  if (status === 'cleared') {
    return `POLICE CLEARANCE REPORT
Report Date: ${formattedDate}

VERIFICATION SUMMARY:
Background verification has been completed for candidate ${verification.candidateName}.

DATABASE QUERY RESULTS:
- CCTNS Database: Clean (No matching record)
- ePetty Case Register: Clean (No matching record)

OFFICIAL RECOMMENDATION:
Based on the database queries, the candidate has no disclosable criminal record or police history. The vetting clearance request is hereby APPROVED / CLEARED.`;
  }

  return `POLICE BACKGROUND DISCLOSURE REPORT
Report Date: ${formattedDate}

VERIFICATION SUMMARY:
Background verification request for candidate ${verification.candidateName} has been processed.

DATABASE QUERY RESULTS:
- Matched Source: ${matchedSuspect?.source || 'N/A'}
- Active Match Found: ${matchedSuspect ? 'Yes' : 'No'}

MATCHED OFFENDER PROFILE:
- Offender Name: ${matchedSuspect?.name || 'N/A'}
- Contact Number: ${matchedSuspect?.phone || 'N/A'}
- Case/FIR Reference: ${matchedSuspect?.firNo || matchedSuspect?.id || 'N/A'}
- Offence Type: ${matchedSuspect?.offence || 'N/A'}
- Jurisdiction/PS: ${matchedSuspect?.courtName || 'N/A'}

OFFICIAL DECISIVE ACTION:
The automated database query returned a disclosable match. Consequently, the vetting clearance request is hereby REJECTED / DISAPPROVED.`;
};
