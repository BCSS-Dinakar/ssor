import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

export const getDistrictAdmins = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['DISTRICT_USER', 'STATE_ADMIN'] } },
      include: {
        policeProfile: true,
        district: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const createDistrictAdmin = async (req, res) => {
  try {
    const { loginId, password, name, distCode } = req.body;

    if (!loginId || !password || !name || !distCode) {
      return res.status(400).json({ success: false, message: 'Login ID, password, name, and district are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { loginId } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Login ID already exists.' });
    }

    const existingDistrictAdmin = await prisma.user.findFirst({
      where: { role: 'DISTRICT_USER', distCode },
    });
    if (existingDistrictAdmin) {
      return res.status(409).json({ success: false, message: 'A District Admin already exists for the selected district.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        loginId,
        passwordHash,
        role: 'DISTRICT_USER',
        distCode,
        status: 'approved',
        policeProfile: {
          create: { name },
        },
      },
      include: {
        policeProfile: true,
        district: true,
      },
    });

    const { passwordHash: _ph, ...safeUser } = newUser;
    res.status(201).json({ success: true, message: 'District Admin created successfully', user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const updateDistrictAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { name, loginId, distCode, status } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser || existingUser.role !== 'DISTRICT_USER') {
      return res.status(404).json({ success: false, message: 'District Admin not found.' });
    }

    if (loginId && loginId !== existingUser.loginId) {
      const conflict = await prisma.user.findUnique({ where: { loginId } });
      if (conflict) {
        return res.status(409).json({ success: false, message: 'Login ID already exists.' });
      }
    }

    if (distCode && distCode !== existingUser.distCode) {
      const districtConflict = await prisma.user.findFirst({
        where: { role: 'DISTRICT_USER', distCode, id: { not: userId } },
      });
      if (districtConflict) {
        return res.status(409).json({ success: false, message: 'A District Admin already exists for the selected district.' });
      }
    }

    const updateData = {};
    if (loginId) updateData.loginId = loginId;
    if (distCode) updateData.distCode = distCode;
    if (status) updateData.status = status;

    if (name) {
      updateData.policeProfile = { update: { name } };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { policeProfile: true, district: true },
    });

    const { passwordHash: _ph, ...safeUser } = updatedUser;
    res.status(200).json({ success: true, message: 'District Admin updated successfully', user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const resetDistrictAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { passwordHash },
    });

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};
