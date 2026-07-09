import prisma from '../config/db.js';

export const submitVerification = async (req, res) => {
  try {
    const { 
      type, role, candidate,
      dob, email, phone, consent 
    } = req.body;

    if (!candidate || !dob || !phone || !role || !consent) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

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
        dob: new Date(dob),
        email: email || null,
        phone: phone,
        consent: consent
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

    // Fake trend data for now until we have real historical data over months
    const trendData = [
      { month: 'Jan', requests: 4, cleared: 4 },
      { month: 'Feb', requests: 7, cleared: 6 },
      { month: 'Mar', requests: 5, cleared: 5 },
      { month: 'Apr', requests: 9, cleared: 8 },
      { month: 'May', requests: 12, cleared: 11 },
      { month: 'Jun', requests: total > 12 ? total : 15, cleared: cleared > 11 ? cleared : 13 },
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
