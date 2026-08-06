import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';

// Get all District Admin users only (for User Management page)
export const getDistrictAdmins = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['DISTRICT_USER', 'STATE_ADMIN'] } },
      include: {
        policeProfile: true,
        district: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Get all users (internal use / future expansion)
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['STATE_ADMIN', 'DISTRICT_USER', 'police'] }
      },
      include: {
        policeProfile: true,
        district: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Create a new District Admin account
// Role is hardcoded to DISTRICT_USER; status auto-set to approved.
// Business rule: one District Admin per district.
export const createDistrictAdmin = async (req, res) => {
  try {
    const { loginId, password, name, distCode } = req.body;

    if (!loginId || !password || !name || !distCode) {
      return res.status(400).json({ success: false, message: 'Login ID, password, name, and district are required.' });
    }

    // Check Login ID uniqueness
    const existingUser = await prisma.user.findUnique({ where: { loginId } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Login ID already exists.' });
    }

    // One-district-one-admin rule: check if distCode already has an assigned admin
    const existingDistrictAdmin = await prisma.user.findFirst({
      where: { role: 'DISTRICT_USER', distCode }
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
          create: { name }
        }
      },
      include: {
        policeProfile: true,
        district: true
      }
    });

    const { passwordHash: _ph, ...safeUser } = newUser;
    res.status(201).json({ success: true, message: 'District Admin created successfully', user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Create user (kept for backwards compat / potential state admin creation flows)
export const createUser = async (req, res) => {
  try {
    const { loginId, password, role, distCode, name, email, mobile, badgeId, rank } = req.body;

    if (!['STATE_ADMIN', 'DISTRICT_USER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (role === 'DISTRICT_USER' && !distCode) {
      return res.status(400).json({ success: false, message: 'District code is required for DISTRICT_USER' });
    }

    if (role === 'DISTRICT_USER') {
      const existingDistrictAdmin = await prisma.user.findFirst({
        where: { role: 'DISTRICT_USER', distCode }
      });
      if (existingDistrictAdmin) {
        return res.status(409).json({ success: false, message: 'A District Admin already exists for the selected district.' });
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { loginId } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Login ID already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        loginId,
        passwordHash,
        role,
        distCode: role === 'DISTRICT_USER' ? distCode : null,
        status: 'approved',
        policeProfile: {
          create: { name, email, mobile, badgeId, rank }
        }
      }
    });

    res.status(201).json({ success: true, message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: { status }
    });

    res.status(200).json({ success: true, message: 'Status updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Update a District Admin account.
// Enforces one-district-one-admin rule when changing district.
export const updateDistrictAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { name, loginId, distCode, status } = req.body;

    // Fetch existing user
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser || existingUser.role !== 'DISTRICT_USER') {
      return res.status(404).json({ success: false, message: 'District Admin not found.' });
    }

    // If changing loginId, check uniqueness
    if (loginId && loginId !== existingUser.loginId) {
      const conflict = await prisma.user.findUnique({ where: { loginId } });
      if (conflict) {
        return res.status(409).json({ success: false, message: 'Login ID already exists.' });
      }
    }

    // If changing district, enforce one-district-one-admin rule
    if (distCode && distCode !== existingUser.distCode) {
      const districtConflict = await prisma.user.findFirst({
        where: { role: 'DISTRICT_USER', distCode, id: { not: userId } }
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
      include: { policeProfile: true, district: true }
    });

    const { passwordHash: _ph, ...safeUser } = updatedUser;
    res.status(200).json({ success: true, message: 'District Admin updated successfully', user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Reset password for a District Admin
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
      data: { passwordHash }
    });

    res.status(200).json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, distCode, name, email, mobile, badgeId, rank, status } = req.body;

    if (role && !['STATE_ADMIN', 'DISTRICT_USER', 'police'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (role === 'DISTRICT_USER' && !distCode) {
      return res.status(400).json({ success: false, message: 'District code is required for DISTRICT_USER' });
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (role === 'DISTRICT_USER') {
      updateData.distCode = distCode;
    } else if (role === 'STATE_ADMIN') {
      updateData.distCode = null;
    }

    const policeProfileUpdate = {};
    if (name !== undefined) policeProfileUpdate.name = name;
    if (email !== undefined) policeProfileUpdate.email = email;
    if (mobile !== undefined) policeProfileUpdate.mobile = mobile;
    if (badgeId !== undefined) policeProfileUpdate.badgeId = badgeId;
    if (rank !== undefined) policeProfileUpdate.rank = rank;

    if (Object.keys(policeProfileUpdate).length > 0) {
      updateData.policeProfile = { update: policeProfileUpdate };
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
      include: { policeProfile: true, district: true }
    });

    res.status(200).json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};