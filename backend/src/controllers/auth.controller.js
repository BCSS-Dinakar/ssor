import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const cleanupFiles = (files) => {
  if (!files) return;
  Object.values(files).forEach((fileArray) => {
    fileArray.forEach((file) => {
      try {
        if (file.path) fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Failed to cleanup file:', file.path, err);
      }
    });
  });
};

export const register = async (req, res) => {
  try {
    const { loginId, password, role } = req.body;

    if (!loginId || !password || !role) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Login ID, password, and role are required.' });
    }

    if (!['police', 'organization'].includes(role)) {
      cleanupFiles(req.files);
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { loginId } });
    if (existingUser) {
      cleanupFiles(req.files);
      return res.status(409).json({ success: false, message: 'Login ID already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let userData = {
      loginId,
      passwordHash,
      role,
    };

    if (role === 'police') {
      userData.status = 'approved'; // Police are auto-approved for now
      const { name, badgeId, rank, empId, department, wing, jurisdiction, joiningDate, email, mobile, altPhone, station, district, state, country, clearanceLevel } = req.body;
      if (!name) {
        cleanupFiles(req.files);
        return res.status(400).json({ success: false, message: 'Police name is required.' });
      }
      let docsPaths = [];
      if (req.files && req.files.policeDocs) {
        docsPaths = req.files.policeDocs.map(f => f.filename);
      }
      
      userData.policeProfile = {
        create: { name, badgeId, rank, empId, department, wing, jurisdiction, joiningDate, email, mobile, altPhone, station, district, state, country, clearanceLevel, docsPaths }
      };
    } else if (role === 'organization') {
      const { orgName, orgType, country, state, district, city, address, pinCode, officialEmail, officialPhone, adminName, designation, empId, adminEmail, mobile, parentOrg, department, jurisdiction, altPhone, website } = req.body;

      if (!orgName || !orgType || !country || !state || !district || !city || !address || !pinCode || !officialEmail || !officialPhone || !adminName || !designation || !empId || !adminEmail || !mobile) {
        cleanupFiles(req.files);
        return res.status(400).json({ success: false, message: 'Missing required organization fields.' });
      }

      let authLetterPath = null;
      let govCertPath = null;
      let supportingDocsPaths = [];

      if (req.files) {
        if (req.files.authLetter) authLetterPath = req.files.authLetter[0].filename;
        if (req.files.govCert) govCertPath = req.files.govCert[0].filename;
        if (req.files.supportingDocs) {
          supportingDocsPaths = req.files.supportingDocs.map(f => f.filename);
        }
      }

      userData.organizationProfile = {
        create: {
          orgName, orgType, parentOrg, department, jurisdiction, country, state, district, city, address, pinCode, officialEmail, officialPhone, altPhone, website, adminName, designation, empId, adminEmail, mobile,
          authLetterPath, govCertPath, supportingDocsPaths
        }
      };
    }

    const newUser = await prisma.user.create({
      data: userData,
      include: {
        policeProfile: true,
        organizationProfile: true,
      }
    });

    const { passwordHash: ph, ...userProfile } = newUser;
    // Format response to have a top level name depending on role
    if (userProfile.role === 'police' && userProfile.policeProfile) {
      userProfile.name = userProfile.policeProfile.name;
    } else if (userProfile.role === 'organization' && userProfile.organizationProfile) {
      userProfile.name = userProfile.organizationProfile.adminName;
    }

    res.status(201).json({ success: true, message: 'User created successfully.', user: userProfile });
  } catch (error) {
    cleanupFiles(req.files);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { loginId, password, role } = req.body;

    if (!loginId || !password || !role) {
      return res.status(400).json({ success: false, message: 'Login ID, password, and role are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { loginId },
      include: { policeProfile: true, organizationProfile: true }
    });
    if (!user || user.role !== role) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or role mismatch.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ success: false, message: `Login failed: Account is ${user.status}.` });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, COOKIE_OPTIONS);

    const { passwordHash, ...userProfile } = user;
    if (userProfile.role === 'police' && userProfile.policeProfile) {
      userProfile.name = userProfile.policeProfile.name;
      userProfile.clearance = userProfile.policeProfile.clearanceLevel || userProfile.policeProfile.rank || 'Police Officer';
    } else if (userProfile.role === 'organization' && userProfile.organizationProfile) {
      userProfile.name = userProfile.organizationProfile.adminName;
      userProfile.clearance = userProfile.organizationProfile.designation || 'Org Admin';
    }

    res.status(200).json({ success: true, user: userProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

const getFileMetadata = (filename) => {
  if (!filename) return null;
  const filePath = path.resolve(process.cwd(), 'storage', 'documents', filename);
  try {
    if (!fs.existsSync(filePath)) return null;
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
    const ext = filename.split('.').pop().toLowerCase();
    let type = 'Document';
    if (ext === 'pdf') type = 'PDF Document';
    if (['jpg', 'jpeg', 'png'].includes(ext)) type = 'Image File';
    return { 
      name: filename, 
      size: sizeInMB, 
      date: stats.mtime.toLocaleDateString(), 
      type 
    };
  } catch (e) {
    return { name: filename, size: 'Unknown', date: 'N/A', type: 'File' };
  }
};

export const getMe = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { policeProfile: true, organizationProfile: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { passwordHash, ...userProfile } = user;
    
    // Attach document metadata
    userProfile.documentMetadata = {};
    if (userProfile.organizationProfile) {
      const o = userProfile.organizationProfile;
      userProfile.name = o.adminName;
      userProfile.clearance = o.designation || 'Org Admin';
      if (o.authLetterPath) userProfile.documentMetadata[o.authLetterPath] = getFileMetadata(o.authLetterPath);
      if (o.govCertPath) userProfile.documentMetadata[o.govCertPath] = getFileMetadata(o.govCertPath);
      if (o.supportingDocsPaths) {
        o.supportingDocsPaths.forEach(p => {
          userProfile.documentMetadata[p] = getFileMetadata(p);
        });
      }
    }
    
    if (userProfile.policeProfile) {
      const p = userProfile.policeProfile;
      userProfile.name = p.name;
      userProfile.clearance = p.clearanceLevel || p.rank || 'Police Officer';
      if (p.docsPaths) {
        p.docsPaths.forEach(p => {
          userProfile.documentMetadata[p] = getFileMetadata(p);
        });
      }
    }

    res.status(200).json({ success: true, user: userProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    // Allows user to delete their own account
    await prisma.user.delete({ where: { id: req.user.id } });
    res.clearCookie('token', COOKIE_OPTIONS);
    res.status(200).json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const getDocument = async (req, res) => {
  try {
    const { filename } = req.params;
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
