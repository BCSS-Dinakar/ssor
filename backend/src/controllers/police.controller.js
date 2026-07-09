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
      time: log.createdAt.toLocaleString(),
      who: log.user?.policeProfile?.name || log.user?.loginId || 'Unknown Officer',
      action: log.action,
      node: log.ipAddress || 'Internal/Protected Node'
    }));

    res.status(200).json({ success: true, data: formattedLogs });
  } catch (error) {
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
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};
