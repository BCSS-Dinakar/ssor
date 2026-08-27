import prisma from '../config/db.js';

// GET /api/notifications/settings
// - DISTRICT_USER: returns own district settings
// - STATE_ADMIN: if ?distCode=xxx returns that district's settings; else returns all
export const getSettings = async (req, res) => {
  try {
    const { role, distCode: userDistCode } = req.user;

    if (role === 'DISTRICT_USER') {
      if (!userDistCode) {
        return res.status(400).json({ success: false, message: 'No district assigned to your account.' });
      }
      const settings = await prisma.districtNotificationSettings.findUnique({
        where: { distCode: userDistCode },
        include: { district: true }
      });
      return res.status(200).json({ success: true, data: settings || { distCode: userDistCode, alertsEnabled: true, primaryWhatsApp: null, secondaryWhatsApp: null } });
    }

    // STATE_ADMIN
    const { distCode } = req.query;
    if (distCode) {
      const settings = await prisma.districtNotificationSettings.findUnique({
        where: { distCode },
        include: { district: true }
      });
      return res.status(200).json({ success: true, data: settings || { distCode, alertsEnabled: true, primaryWhatsApp: null, secondaryWhatsApp: null } });
    }

    // Return all districts with their settings
    const allDistricts = await prisma.district.findMany({
      include: { notificationSettings: true },
      orderBy: { distName: 'asc' }
    });
    return res.status(200).json({ success: true, data: allDistricts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// PUT /api/notifications/settings
// Body: { distCode (STATE_ADMIN only), primaryWhatsApp, secondaryWhatsApp, alertsEnabled }
export const upsertSettings = async (req, res) => {
  try {
    const { role, distCode: userDistCode } = req.user;
    let { distCode, primaryWhatsApp, secondaryWhatsApp, alertsEnabled } = req.body;

    // District Admin can only update own district
    if (role === 'DISTRICT_USER') {
      if (!userDistCode) return res.status(400).json({ success: false, message: 'No district assigned to your account.' });
      distCode = userDistCode;
    }

    if (!distCode) {
      return res.status(400).json({ success: false, message: 'distCode is required.' });
    }

    // Ensure district exists (auto-provision if needed)
    const district = await prisma.district.findUnique({ where: { distCode } });
    if (!district) {
      return res.status(404).json({ success: false, message: 'District not found.' });
    }

    const sanitize = (num) => {
      if (!num) return null;
      return String(num).replace(/\D/g, ''); // strip non-digits
    };

    const settings = await prisma.districtNotificationSettings.upsert({
      where: { distCode },
      update: {
        primaryWhatsApp: sanitize(primaryWhatsApp),
        secondaryWhatsApp: sanitize(secondaryWhatsApp),
        alertsEnabled: alertsEnabled !== undefined ? Boolean(alertsEnabled) : true,
      },
      create: {
        distCode,
        primaryWhatsApp: sanitize(primaryWhatsApp),
        secondaryWhatsApp: sanitize(secondaryWhatsApp),
        alertsEnabled: alertsEnabled !== undefined ? Boolean(alertsEnabled) : true,
      },
      include: { district: true }
    });

    res.status(200).json({ success: true, message: 'Settings saved.', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// GET /api/notifications/history
// - DISTRICT_USER: own district history only
// - STATE_ADMIN: all history (or ?distCode=xxx for filtering)
export const getHistory = async (req, res) => {
  try {
    const { role, distCode: userDistCode } = req.user;
    const { distCode: queryDistCode, limit = 100 } = req.query;

    const where = {};
    if (role === 'DISTRICT_USER') {
      if (!userDistCode) return res.status(400).json({ success: false, message: 'No district assigned.' });
      where.distCode = userDistCode;
    } else if (queryDistCode) {
      where.distCode = queryDistCode;
    }

    const history = await prisma.notificationHistory.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: parseInt(limit, 10),
      include: { district: { select: { distName: true } } }
    });

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

