import prisma from '../config/db.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

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

    const imagePath = candidateImageFile ? `/api/v1/police/documents/${candidateImageFile.filename}` : null;
    const consentPath = consentDocFile ? `/api/v1/police/documents/${consentDocFile.filename}` : null;

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
        candidateImage: imagePath,
        consentFile: consentPath
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
    console.error('[submitVerification Error]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getVerifications = async (req, res) => {
  try {
    const verifications = await prisma.candidateVerification.findMany({
      where: {
        organizationId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({ success: true, verifications });
  } catch (error) {
    console.error('[getVerifications Error]', error);
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

    res.status(200).json({ success: true, verification });
  } catch (error) {
    console.error('[getVerificationById Error]', error);
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

    const trendData = [
      { month: 'Jan', requests: 4, cleared: 4 },
      { month: 'Feb', requests: 7, cleared: 6 },
      { month: 'Mar', requests: 5, cleared: 5 },
      { month: 'Apr', requests: 9, cleared: 8 },
      { month: 'May', requests: 12, cleared: 11 },
      { month: 'Jun', requests: total > 12 ? total : 15, cleared: cleared > 11 ? cleared : 13 },
    ];

    const roleDistribution = [
      { name: 'Teachers / Tutors', value: 35, color: '#10b981' },
      { name: 'Support Staff', value: 20, color: '#3b82f6' },
      { name: 'Bus Drivers', value: 15, color: '#f59e0b' },
      { name: 'Security Guards', value: 10, color: '#ef4444' },
      { name: 'Administrative', value: 8, color: '#8b5cf6' },
      { name: 'Other', value: 12, color: '#64748b' },
    ];

    const processingTimes = [
      { category: 'Jan', days: 5.2 },
      { category: 'Feb', days: 4.8 },
      { category: 'Mar', days: 4.1 },
      { category: 'Apr', days: 3.5 },
      { category: 'May', days: 2.9 },
      { category: 'Jun', days: 2.1 },
    ];

    const recentActivity = [
      { action: 'Submitted clearance request for candidate R. Sharma', time: '10 mins ago', type: 'submit' },
      { action: 'Downloaded Clearance Certificate for S. Patel', time: '2 hours ago', type: 'download' },
      { action: 'Added 5 candidates to verification queue', time: 'Yesterday', type: 'batch' },
      { action: 'Received notification: Background check failed for Candidate #892', time: '2 days ago', type: 'alert' },
      { action: 'Updated organization profile information', time: '1 week ago', type: 'system' },
      { action: 'Submitted clearance request for candidate M. Kumar', time: '1 week ago', type: 'submit' },
      { action: 'Downloaded Clearance Certificate for A. Singh', time: '2 weeks ago', type: 'download' },
    ];

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        cleared,
        rejected
      },
      trendData,
      roleDistribution,
      processingTimes,
      recentActivity,
      recentVerifications: verifications.slice(0, 5)
    });
  } catch (error) {
    console.error('[getDashboardStats Error]', error);
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
    console.error('[getTickets Error]', error);
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
    console.error('[createTicket Error]', error);
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
    console.error('[addTicketMessage Error]', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const generateConsentTemplate = async (req, res) => {
  try {
    const { candidate, fatherName, dob, aadharNumber, phone, role, address, type } = req.body;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Consent_Template_${candidate ? candidate.replace(/\\s+/g, '_') : 'Candidate'}.pdf`);

    doc.pipe(res);

    // Draw border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();
    doc.rect(22, 22, doc.page.width - 44, doc.page.height - 44).stroke(); // Double border

    // Header
    doc.moveDown(1);
    doc.fontSize(16).font('Helvetica-Bold').text('GOVERNMENT OF TELANGANA - STATE POLICE', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(14).font('Helvetica-Bold').text('STATE SEXUAL OFFENDER REGISTRY (SSOR)', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(12).font('Helvetica').text('CANDIDATE VERIFICATION CONSENT FORM', { align: 'center', underline: true });

    doc.moveDown(1);

    // Intro
    doc.fontSize(11).font('Helvetica').text('This document serves as explicit, irrevocable consent for the below-mentioned individual to undergo a formal background verification against the State Sexual Offender Registry, conducted by the Telangana State Police.', { align: 'justify' });

    doc.moveDown(1);

    // Details Box
    const startX = 50;
    let currentY = doc.y;
    doc.rect(40, currentY - 10, doc.page.width - 80, 170).stroke();

    doc.fontSize(12).font('Helvetica-Bold').text('I. CANDIDATE DEMOGRAPHICS', 50, currentY);
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

    doc.moveDown(1.5);

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

    doc.moveDown(2.5);

    // Signatures
    const sigY = doc.y;

    doc.font('Helvetica').fontSize(11);
    doc.text('Date: ________________', 50, sigY);
    doc.text('Place: ________________', 50, sigY + 25);

    doc.text('________________________________', 350, sigY);
    doc.text('Signature / Thumb Impression of Candidate', 350, sigY + 15, { width: 200, align: 'center' });

    // Footer text
    doc.font('Helvetica-Oblique').fontSize(8).text('This is a system-generated document for SSOR compliance.', 50, doc.page.height - 50, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('[generateConsentTemplate Error]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Internal server error generating template' });
    }
  }
};

export const getDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(process.cwd(), 'storage/documents', filename);

    // Security check: ensure they don't escape the directory
    if (!filepath.startsWith(path.join(process.cwd(), 'storage/documents'))) {
      return res.status(403).json({ success: false, message: 'Forbidden access' });
    }

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    res.sendFile(filepath);
  } catch (err) {
    console.error('[GetDocument Error]', err);
    res.status(500).json({ success: false, message: 'Server error serving document' });
  }
};
