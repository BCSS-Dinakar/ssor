import { env } from '../config/env.js';

/**
 * Calls Gemini 2.5 Flash API to generate a professional Police Clearance or Rejection Report.
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=GEMINI_API_KEY
 */
export const generateClearanceReport = async (verification, status, matchedSuspect = null) => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini Service] GEMINI_API_KEY is not configured in .env. Falling back to default report template.');
    return getDefaultTemplate(verification, status, matchedSuspect);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let prompt = '';
  if (status === 'cleared') {
    prompt = `You are a professional Police Verification Officer generating an official background clearance report.
Candidate Details:
- Full Name: ${verification.candidateName}
- Date of Birth: ${new Date(verification.dob).toLocaleDateString('en-GB')}
- Mobile: ${verification.phone}
- Email: ${verification.email || 'N/A'}
- Employer Station: ${verification.orgName} (${verification.orgType})
- Requested Role/Seat: ${verification.role}
- Submission Date: ${new Date(verification.createdAt).toLocaleString('en-GB')}

Findings:
- Database Scan (CCTNS & ePetty cases): Clean. No matches found.
- Verification Status: APPROVED / CLEARED.

Write a formal, structured, and professional Police Clearance Report (approx. 100-150 words). Include sections like "Verification Summary", "Database Query Results", and "Official Recommendation". Keep the tone strictly administrative and objective. Do not include placeholders.`;
  } else {
    prompt = `You are a professional Police Verification Officer generating an official background disclosure and rejection report.
Candidate Details:
- Full Name: ${verification.candidateName}
- Date of Birth: ${new Date(verification.dob).toLocaleDateString('en-GB')}
- Mobile: ${verification.phone}
- Email: ${verification.email || 'N/A'}
- Employer Station: ${verification.orgName} (${verification.orgType})
- Requested Role/Seat: ${verification.role}
- Submission Date: ${new Date(verification.createdAt).toLocaleString('en-GB')}

Offence / Match Findings:
- Offender Name: ${matchedSuspect ? matchedSuspect.name : 'N/A'}
- Offender Mobile: ${matchedSuspect ? matchedSuspect.phone : 'N/A'}
- Father's Name: ${matchedSuspect ? matchedSuspect.fatherName : 'N/A'}
- DOB / Incident Date: ${matchedSuspect ? matchedSuspect.dob : 'N/A'}
- Offence/Section Charged: ${matchedSuspect ? matchedSuspect.offence : 'N/A'}
- Session Court / PS: ${matchedSuspect ? matchedSuspect.courtName : 'N/A'}
- Record Source: ${matchedSuspect ? matchedSuspect.source : 'ePetty Case'}
- Case Number / FIR: ${matchedSuspect ? matchedSuspect.firNo || matchedSuspect.id : 'N/A'}
- Vetting Status: REJECTED / DISAPPROVED.

Write a formal, structured, and professional Police Vetting Rejection Report (approx. 150-200 words). Include sections like "Vetting Summary", "Database Query Results", and "Official Decisive Action".
Under "Database Query Results", you MUST explicitly state that the CCTNS record was not found, but the ePetty case record was found, so we are rejecting it.
Keep the tone strictly administrative and objective. Do not include placeholders.`;
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Gemini Service] API call failed with status ${response.status}: ${errorText}`);
      return getDefaultTemplate(verification, status, matchedSuspect);
    }

    const resData = await response.json();
    const generatedText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (generatedText) {
      return generatedText.trim();
    }
    return getDefaultTemplate(verification, status, matchedSuspect);
  } catch (error) {
    console.error('[Gemini Service] Error communicating with Gemini API:', error);
    return getDefaultTemplate(verification, status, matchedSuspect);
  }
};

/**
 * Fallback template generator in case API key is missing or fails.
 */
function getDefaultTemplate(verification, status, matchedSuspect) {
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
  } else {
    return `POLICE BACKGROUND DISCLOSURE REPORT
Report Date: ${formattedDate}

VERIFICATION SUMMARY:
Background verification request for candidate ${verification.candidateName} has been processed.

DATABASE QUERY RESULTS:
- CCTNS Database: Clean (No matching record)
- ePetty Case Register: Active Match Found (CCTNS record was not found, but the ePetty case record was found, so we are rejecting it)

MATCHED OFFENDER PROFILE:
- Offender Name: ${matchedSuspect ? matchedSuspect.name : 'N/A'}
- Contact Number: ${matchedSuspect ? matchedSuspect.phone : 'N/A'}
- Case/FIR Reference: ${matchedSuspect ? matchedSuspect.firNo || matchedSuspect.id : 'N/A'}
- Offence Type: ${matchedSuspect ? matchedSuspect.offence : 'N/A'}
- Jurisdiction/PS: ${matchedSuspect ? matchedSuspect.courtName : 'N/A'}
- Source Registry: ${matchedSuspect ? matchedSuspect.source : 'ePetty Case'}

OFFICIAL DECISIVE ACTION:
The automated database query confirmed that the CCTNS record was not found, but the ePetty case record was found. Consequently, the vetting clearance request is hereby REJECTED / DISAPPROVED.`;
  }
}
