import prisma from '../config/db.js';
import { verifyCertToken } from '../utils/certToken.js';

/**
 * Public (no auth) certificate authenticity check.
 * Called when someone scans the QR code on a clearance certificate.
 * Returns a minimal, DPDP-compliant payload confirming whether the
 * certificate is a genuine, currently-valid SSOR clearance.
 */
export const verifyCertificate = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = verifyCertToken(token);
    if (!decoded) {
      return res.status(200).json({
        success: true,
        valid: false,
        reason: 'This code is not a valid SSOR certificate token. It may be forged or altered.'
      });
    }

    const verification = await prisma.candidateVerification.findUnique({
      where: { id: decoded.verificationId }
    });

    if (!verification) {
      return res.status(200).json({
        success: true,
        valid: false,
        reason: 'No clearance record matches this certificate. It is not an official SSOR certificate.'
      });
    }

    if (verification.status !== 'cleared') {
      return res.status(200).json({
        success: true,
        valid: false,
        reason: `This clearance is no longer active (current status: ${verification.status}). Do not accept this certificate.`
      });
    }

    // Minimal disclosure only (DPDP Act 2023) — enough to confirm authenticity.
    return res.status(200).json({
      success: true,
      valid: true,
      certificate: {
        shortRef: verification.id.split('-')[0].toUpperCase(),
        referenceNo: verification.id,
        candidateName: verification.candidateName,
        organization: verification.orgName,
        role: verification.role,
        issuedDate: verification.updatedAt || verification.createdAt,
        status: 'CLEARED'
      }
    });
  } catch (error) {
    console.error('[verifyCertificate Error]', error);
    return res.status(500).json({ success: false, message: 'Internal server error verifying certificate' });
  }
};
