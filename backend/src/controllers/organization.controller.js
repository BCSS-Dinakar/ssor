import prisma from '../config/db.js';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { streamDocument, getPresignedUrl, SIGNED_URL_EXPIRY_SECONDS } from '../services/storage.service.js';
import { mediaFromFile, withVerificationUrls, withVerificationUrlsList, guardDocumentAccess } from '../services/media.service.js';
import { env } from '../config/env.js';
import { generateCertToken } from '../utils/certToken.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const submitVerification = async (req, res) => {
  try {
    const {
      type, role, candidate,
      dob, phone, consent, fatherName, aadharNumber, address
    } = req.body;

    if (!candidate || !dob || !phone || !role || consent !== 'true' && consent !== true) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const candidateImageFile = req.files?.['candidateImage']?.[0];
    const consentDocFile = req.files?.['consentFile']?.[0];

    // Register each upload in the central Media table and store its reference id.
    // The columns hold a Media.id (int) — never a path or URL.
    const candidateMediaId = candidateImageFile
      ? await mediaFromFile(candidateImageFile, 'candidate_image', req.user.id)
      : null;
    const consentMediaId = consentDocFile
      ? await mediaFromFile(consentDocFile, 'consent', req.user.id)
      : null;

    // We must find the user's organization profile to get the orgName
    const orgProfile = await prisma.organizationProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!orgProfile) {
      return res.status(404).json({ success: false, message: 'Organization profile not found' });
    }

    const verification = await prisma.candidateVerification.create({
      data: {
        organizationId: req.user.id,
        orgName: orgProfile.orgName,
        orgType: type,
        role: role,
        candidateName: candidate,
        fatherName: fatherName || null,
        dob: new Date(dob),
        phone: phone,
        consent: consent === 'true' || consent === true,
        aadharNumber: aadharNumber || null,
        address: address || null,
        candidateMediaId,
        consentMediaId
      }
    });

    // Also log this action
    await prisma.systemAuditLog.create({
      data: {
        userId: req.user.id,
        action: `Submitted candidate verification for ${candidate}`,
        ipAddress: req.ip
      }
    });

    res.status(201).json({ success: true, verification });
  } catch (error) {
    logger.error('[submitVerification Error]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getVerifications = async (req, res) => {
  try {
    const rows = await prisma.candidateVerification.findMany({
      where: {
        organizationId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const verifications = await withVerificationUrlsList(rows);
    res.status(200).json({ success: true, verifications });
  } catch (error) {
    logger.error('[getVerifications Error]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getVerificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const verification = await prisma.candidateVerification.findFirst({
      where: {
        id,
        organizationId: req.user.id
      }
    });

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    res.status(200).json({ success: true, verification: await withVerificationUrls(verification) });
  } catch (error) {
    logger.error('[getVerificationById Error]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const verifications = await prisma.candidateVerification.findMany({
      where: {
        organizationId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const pending = verifications.filter((v) => v.status === 'pending' || v.status === 'verifying').length;
    const cleared = verifications.filter((v) => v.status === 'cleared').length;
    const rejected = verifications.filter((v) => v.status === 'rejected').length;
    const total = verifications.length;



    // Dynamic Trend Data (Last 6 Months)
    const trendData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = monthNames[d.getMonth()];
      
      const reqsInMonth = verifications.filter(v => {
        const vd = new Date(v.createdAt);
        return vd.getMonth() === d.getMonth() && vd.getFullYear() === d.getFullYear();
      });
      const clearedInMonth = reqsInMonth.filter(v => v.status === 'cleared');
      
      trendData.push({ month: monthStr, requests: reqsInMonth.length, cleared: clearedInMonth.length });
    }

    // Dynamic Recent Activity
    const rawActivity = await prisma.systemAuditLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 8
    });

    const formatTimeAgo = (date) => {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      let interval = seconds / 31536000;
      if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " year ago" : " years ago");
      interval = seconds / 2592000;
      if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " month ago" : " months ago");
      interval = seconds / 86400;
      if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");
      interval = seconds / 3600;
      if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hour ago" : " hours ago");
      interval = seconds / 60;
      if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " min ago" : " mins ago");
      return "just now";
    };

    const recentActivity = rawActivity.map(log => {
      let type = 'system';
      const actionLow = log.action.toLowerCase();
      if (actionLow.includes('submit') || actionLow.includes('add')) type = 'submit';
      if (actionLow.includes('download')) type = 'download';
      if (actionLow.includes('fail') || actionLow.includes('reject')) type = 'alert';
      
      return {
        action: log.action,
        time: formatTimeAgo(log.createdAt),
        type
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        cleared,
        rejected
      },
      trendData,
      recentActivity,
      recentVerifications: verifications.slice(0, 5)
    });
  } catch (error) {
    logger.error('[getDashboardStats Error]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTickets = async (req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: {
        organizationId: req.user.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.status(200).json({ success: true, tickets });
  } catch (error) {
    logger.error('[getTickets Error]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createTicket = async (req, res) => {
  try {
    const { subject, category, priority, reference, message } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const orgProfile = await prisma.organizationProfile.findUnique({
      where: { userId: req.user.id }
    });

    const senderName = orgProfile?.orgName || 'Organization';

    const ticket = await prisma.supportTicket.create({
      data: {
        organizationId: req.user.id,
        subject,
        category,
        priority: priority || 'Medium',
        reference,
        messages: {
          create: {
            senderName,
            senderRole: 'Organization',
            text: message
          }
        }
      },
      include: {
        messages: true
      }
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    logger.error('[createTicket Error]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const addTicketMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    // Verify ownership
    const ticket = await prisma.supportTicket.findUnique({
      where: { id }
    });

    if (!ticket || ticket.organizationId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.status === 'Closed') {
      return res.status(400).json({ success: false, message: 'Cannot add message to a closed ticket' });
    }

    const orgProfile = await prisma.organizationProfile.findUnique({
      where: { userId: req.user.id }
    });
    const senderName = orgProfile?.orgName || 'Organization';

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderName,
        senderRole: 'Organization',
        text
      }
    });

    // Update parent ticket updatedAt
    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ success: true, message });
  } catch (error) {
    logger.error('[addTicketMessage Error]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const generateConsentTemplate = async (req, res) => {
  try {
    const { candidate, fatherName, dob, aadharNumber, phone, role, address, type } = req.body;

    const doc = new PDFDocument({ margins: { top: 50, bottom: 20, left: 50, right: 50 }, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Consent_Template_${candidate ? candidate.replace(/\\s+/g, '_') : 'Candidate'}.pdf`);

    doc.pipe(res);

    // Draw border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
    doc.rect(22, 22, doc.page.width - 44, doc.page.height - 44).stroke(); // Double border

    // Draw Watermark
    try {
      // Robust path resolution relative to this file's location, ensuring it works anywhere
      const imgPath = path.join(__dirname, '../../assets/watermark.png');
      if (fs.existsSync(imgPath)) {
        doc.save();
        doc.opacity(0.12);
        // Fit within a square box while preserving the source aspect ratio (290x342),
        // then align/valign center so the shield is never stretched or cropped.
        const boxSize = 400;
        const x = (doc.page.width - boxSize) / 2;
        const y = (doc.page.height - boxSize) / 2;
        doc.image(imgPath, x, y, { fit: [boxSize, boxSize], align: 'center', valign: 'center' });
        doc.restore();
      }
    } catch (e) {
      logger.error('[Watermark Error]', e);
    }

    // Header
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica-Bold').text('GOVERNMENT OF TELANGANA - STATE POLICE', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(14).font('Helvetica-Bold').text('STATE SEXUAL OFFENDER REGISTRY (SSOR)', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(12).font('Helvetica').text('CANDIDATE VERIFICATION CONSENT FORM', { align: 'center', underline: true });

    doc.moveDown(0.5);

    // Intro
    doc.fontSize(11).font('Helvetica').text('This document serves as explicit, irrevocable consent for the below-mentioned individual to undergo a formal background verification against the State Sexual Offender Registry, conducted by the Telangana State Police.', { align: 'justify' });

    doc.moveDown(0.5);

    // Details Box
    const startX = 50;
    const startY = doc.y;

    doc.fontSize(12).font('Helvetica-Bold').text('I. CANDIDATE DEMOGRAPHICS', 50, startY);
    doc.moveDown(0.5);

    const drawField = (label, value) => {
      doc.font('Helvetica-Bold').fontSize(11).text(`${label}: `, { continued: true })
        .font('Helvetica').text(value || '______________________');
      doc.moveDown(0.2);
    };

    drawField('Candidate Name', candidate);
    drawField('Father\'s Name', fatherName);
    drawField('Date of Birth', dob);
    drawField('Aadhar Number', aadharNumber);
    drawField('Phone Number', phone);
    drawField('Residential Address', address);
    drawField('Institution Category', type);
    drawField('Designated Role', role);

    const endY = doc.y;
    doc.rect(40, startY - 10, doc.page.width - 80, endY - startY + 15).stroke();

    doc.moveDown(1);

    // Declaration
    doc.fontSize(12).font('Helvetica-Bold').text('II. DECLARATION OF CONSENT', 50, doc.y);
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(11).text(
      `I, ${candidate || 'the undersigned'}, hereby voluntarily give my explicit consent to the requesting organization to forward my personal data, including demographics and biometrics (if applicable), to the Telangana State Police. I authorize the Telangana State Police to query the State Sexual Offender Registry for the exclusive purpose of background verification for my employment/role.`,
      { align: 'justify', lineGap: 3 }
    );
    doc.moveDown();
    doc.text(
      'I understand this process is strictly in compliance with the Digital Personal Data Protection (DPDP) Act, 2023, and my data will solely be used for this security vetting process and will not be retained for unauthorized purposes.',
      { align: 'justify', lineGap: 3 }
    );

    // Signatures
    const sigY = doc.page.height - 140; 

    doc.font('Helvetica').fontSize(11);
    doc.text('Date: ________________', 50, sigY);
    doc.text('Place: ________________', 50, sigY + 25);

    doc.text('________________________________', 350, sigY);
    doc.text('Signature / Thumb Impression of Candidate', 350, sigY + 15, { width: 200, align: 'center' });

    // Footer text
    doc.font('Helvetica-Oblique').fontSize(8).text('This is a system-generated document for SSOR compliance.', 50, doc.page.height - 35, { align: 'center', width: doc.page.width - 100, lineBreak: false });

    doc.end();
  } catch (error) {
    logger.error('[generateConsentTemplate Error]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Internal server error generating template' });
    }
  }
};

export const getDocument = async (req, res) => {
  try {
    const guard = await guardDocumentAccess(req.user, req.params.filename);
    if (guard.error) return res.status(guard.error.status).json({ success: false, message: guard.error.message });
    await streamDocument(res, guard.objectKey);
  } catch (err) {
    logger.error('[GetDocument]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error serving document' });
    }
  }
};

/**
 * The "permanent link" the frontend calls for a document. Authorizes the caller
 * against the Media, then returns a freshly generated, time-limited signed URL.
 * The signed URL is never stored — only the permanent reference id is.
 * Response: { success, url, expiresIn }
 */
export const getDocumentSignedUrl = async (req, res) => {
  try {
    const guard = await guardDocumentAccess(req.user, req.params.filename);
    if (guard.error) return res.status(guard.error.status).json({ success: false, message: guard.error.message });

    const url = await getPresignedUrl(guard.objectKey, SIGNED_URL_EXPIRY_SECONDS, guard.objectKey);
    res.status(200).json({ success: true, url, expiresIn: SIGNED_URL_EXPIRY_SECONDS });
  } catch (err) {
    logger.error('[getDocumentSignedUrl]', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating document link' });
    }
  }
};

export const generateClearanceCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const verification = await prisma.candidateVerification.findFirst({
      where: {
        id,
        ...(req.user.role === 'organization' ? { organizationId: req.user.id } : {})
      }
    });

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }

    if (verification.status !== 'cleared') {
      return res.status(400).json({ success: false, message: 'Clearance certificate is only available for cleared candidates' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 30, bottom: 0, left: 35, right: 35 }
    });

    const safeName = (verification.candidateName || 'Candidate').replace(/\s+/g, '_');
    const filename = `Clearance_Certificate_${safeName}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    const pageWidth = doc.page.width;   // ~595.28
    const pageHeight = doc.page.height; // ~841.89

    // 1. Draw Double Official Border Frame
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30).lineWidth(2.5).stroke('#1e3a8a');
    doc.rect(19, 19, pageWidth - 38, pageHeight - 38).lineWidth(1).stroke('#d97706');

    // 2. Draw Centered Watermark — aspect-preserved and dead-centered on the page
    try {
      const imgPath = path.join(__dirname, '../../assets/watermark.png');
      if (fs.existsSync(imgPath)) {
        doc.save();
        doc.opacity(0.15);
        // Fit within a square box while preserving the source aspect ratio (290x342),
        // then align/valign center so the shield is never stretched or cropped.
        const boxSize = 360;
        const x = (pageWidth - boxSize) / 2;
        const y = (pageHeight - boxSize) / 2;
        doc.image(imgPath, x, y, { fit: [boxSize, boxSize], align: 'center', valign: 'center' });
        doc.restore();
      }
    } catch (e) {
      console.error('[Watermark Error]', e);
    }

    // 3. Official Telangana Government & Police Header
    doc.y = 35;
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#0f172a').text('GOVERNMENT OF TELANGANA', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1e3a8a').text('TELANGANA STATE POLICE DEPARTMENT', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0284c7').text('STATE SEXUAL OFFENDER REGISTRY (SSOR) VETTING CELL', { align: 'center' });

    // Gold Accent Line
    doc.moveDown(0.5);
    const lineY = doc.y;
    doc.moveTo(35, lineY).lineTo(pageWidth - 35, lineY).lineWidth(1.5).stroke('#d97706');

    // 4. Certificate Title Box
    doc.y = lineY + 12;
    doc.fontSize(17).font('Helvetica-Bold').fillColor('#065f46').text('OFFICIAL CLEARANCE CERTIFICATE', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#64748b').text(`CERTIFICATE REF NO: ${verification.id}`, { align: 'center' });

    // 5. Introductory Statement
    doc.y = doc.y + 12;
    doc.fontSize(10).font('Helvetica').fillColor('#1e293b').text(
      'This is to officially certify that the background verification request submitted for the candidate detailed below has been processed and thoroughly vetted against the State Sexual Offender Registry (SSOR) database and CCTNS criminal records.',
      35, doc.y, { align: 'justify', width: pageWidth - 70, lineGap: 3 }
    );

    // 6. Candidate Demographics Box (Stroke border only, transparent background so watermark shows through clearly!)
    const tableTop = doc.y + 12;
    const tableHeight = 165;
    const tableWidth = pageWidth - 70; // 525.28

    doc.rect(35, tableTop, tableWidth, tableHeight).lineWidth(1.2).stroke('#94a3b8');

    // Candidate photograph (colour) on the right side of the details card —
    // sourced from the Candidate Image uploaded on the Submit Clearance Request page.
    try {
      let candidatePhoto = null;
      if (verification.candidateImage) {
        const resolved = path.join(process.cwd(), 'storage/documents', path.basename(verification.candidateImage));
        if (fs.existsSync(resolved)) candidatePhoto = resolved;
      }
      const photoW = 92, photoH = 112, photoX = 455, photoY = tableTop + 26;
      doc.rect(photoX, photoY, photoW, photoH).lineWidth(1).stroke('#94a3b8');
      if (candidatePhoto) {
        doc.image(candidatePhoto, photoX + 3, photoY + 3, { fit: [photoW - 6, photoH - 6], align: 'center', valign: 'center' });
      } else {
        doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#94a3b8')
          .text('Photo Not Provided', photoX, photoY + photoH / 2 - 6, { width: photoW, align: 'center' });
      }
    } catch (photoErr) {
      console.error('[Certificate Photo Error]', photoErr);
    }

    let currentY = tableTop + 10;
    const drawRow = (label, value, isHighlight = false) => {
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#334155').text(label, 50, currentY, { width: 150 });
      if (isHighlight) {
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#047857').text(`:  ${value || 'N/A'}`, 205, currentY, { width: 235 });
      } else {
        doc.font('Helvetica').fontSize(9.5).fillColor('#0f172a').text(`:  ${value || 'N/A'}`, 205, currentY, { width: 235 });
      }
      currentY += 19;
    };

    drawRow('Candidate Name', verification.candidateName);
    drawRow('Father / Spouse Name', verification.fatherName);
    drawRow('Date of Birth', verification.dob ? new Date(verification.dob).toLocaleDateString('en-IN') : 'N/A');
    drawRow('Government ID (Aadhar)', verification.aadharNumber);
    drawRow('Contact Phone', verification.phone);
    drawRow('Designated Role', verification.role);
    drawRow('Requesting Organization', verification.orgName);
    drawRow('Verification Outcome', 'CLEARED — Zero Adverse Matches Found', true);

    // 7. Official Clearance Outcome Box (Emerald Stroke border, transparent background for watermark visibility)
    const outcomeY = tableTop + tableHeight + 12;
    const outcomeHeight = 72;

    doc.rect(35, outcomeY, tableWidth, outcomeHeight).lineWidth(1.5).stroke('#10b981');
    
    doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#15803d').text('STATUS: CLEARANCE GRANTED', 48, outcomeY + 10);
    doc.font('Helvetica').fontSize(9).fillColor('#166534').text(
      `Based on database queries conducted on ${new Date(verification.updatedAt || verification.createdAt).toLocaleDateString('en-IN')}, zero matches were found for ${verification.candidateName} in the State Sexual Offender Registry. Clearance is hereby granted for designated employment at ${verification.orgName}.`,
      48, outcomeY + 26, { width: tableWidth - 26, lineGap: 2.5 }
    );

    // 8. Legal Directives Note
    const legalY = outcomeY + outcomeHeight + 10;
    doc.font('Helvetica-Oblique').fontSize(8).fillColor('#64748b').text(
      'This certificate is issued strictly in compliance with Digital Personal Data Protection (DPDP) Act 2023 directives and State Safe Recruitment policies.',
      35, legalY, { align: 'center', width: tableWidth }
    );

    // 9. Signatures & Digital Audit Block
    const sigY = legalY + 22;

    // Line separator
    doc.moveTo(35, sigY).lineTo(pageWidth - 35, sigY).lineWidth(0.5).stroke('#cbd5e1');

    const contentSigY = sigY + 10;

    // Left Box: Digital Security Hash Box (Stroke border only)
    doc.rect(40, contentSigY, 220, 65).lineWidth(1).stroke('#cbd5e1');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#1e3a8a').text('DIGITAL AUDIT VERIFICATION', 48, contentSigY + 8);
    doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(`SECURITY HASH: TS-SSOR-${verification.id.slice(0, 13).toUpperCase()}`, 48, contentSigY + 20);
    doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(`ISSUED DATE: ${new Date(verification.updatedAt || verification.createdAt).toLocaleDateString('en-IN')}`, 48, contentSigY + 32);
    doc.font('Helvetica').fontSize(7.5).fillColor('#047857').text('VALIDITY: 1 YEAR FROM ISSUE DATE', 48, contentSigY + 44);

    // QR Code for public authenticity verification — bottom-left, centered under the Digital Audit box.
    try {
      const certToken = generateCertToken(verification.id);
      const verifyUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/verify/${certToken}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 240,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      const qrSize = 78;
      const qrX = 40 + (220 - qrSize) / 2; // centered under the Digital Audit box (x 40..260)
      const qrY = contentSigY + 76;
      doc.image(qrDataUrl, qrX, qrY, { width: qrSize, height: qrSize });
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#1e3a8a')
        .text('SCAN TO VERIFY AUTHENTICITY', 40, qrY + qrSize + 5, { width: 220, align: 'center' });
    } catch (qrErr) {
      console.error('[Certificate QR Error]', qrErr);
    }

    // Right Side: Police Department Authority Signature Block
    const sigRightX = 310;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e3a8a').text('SUPERINTENDENT OF POLICE', sigRightX, contentSigY + 8, { align: 'center', width: 240 });
    doc.font('Helvetica').fontSize(8.5).fillColor('#475569').text('SSOR Clearance & Vetting Division', sigRightX, contentSigY + 22, { align: 'center', width: 240 });
    doc.font('Helvetica').fontSize(8.5).fillColor('#475569').text('Telangana State Police Department', sigRightX, contentSigY + 34, { align: 'center', width: 240 });
    doc.font('Helvetica-BoldOblique').fontSize(8).fillColor('#059669').text('[ Digitally Signed & Verified ]', sigRightX, contentSigY + 48, { align: 'center', width: 240 });

    // 10. Single-Page Bottom Footer
    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#94a3b8').text(
      'This clearance certificate is electronically generated and digitally signed. Authenticity can be verified on the SSOR Portal.',
      35, pageHeight - 36, { align: 'center', width: pageWidth - 70 }
    );

    doc.end();
  } catch (error) {
    console.error('[generateClearanceCertificate Error]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Internal server error generating clearance certificate' });
    }
  }
};
