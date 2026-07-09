import prisma from '../config/db.js';
import path from 'path';
import fs from 'fs';

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
    const verifications = await prisma.candidateVerification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: verifications });
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

    res.status(200).json({ success: true, data: verification });
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
    // Get absolute path to storage/documents dir
    const filePath = path.resolve(process.cwd(), 'storage', 'documents', filename);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ success: false, message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const clearPending = await prisma.candidateVerification.count({
      where: { status: 'pending' }
    });

    const discPending = 12; // Hardcoded fallback for disclosures since it's not implemented yet

    // Return mock data for offenders since user requested it to be N/A or 0 for now.
    res.status(200).json({
      success: true,
      data: {
        totalOffenders: 0,
        convictedCount: 0,
        underTrialCount: 0,
        clearPending,
        discPending,
        byTier: [] // Empty so the charts gracefully display no data
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
