import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { streamDocument, statObject, removeObject, getPresignedUrl, SIGNED_URL_EXPIRY_SECONDS } from '../services/storage.service.js';
import { mediaFromFile, resolveObjectKey } from '../services/media.service.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Remove already-persisted uploads from storage (used when registration fails
// after files were pushed to MinIO by persistUploads). Fire-and-forget: never throws.
const cleanupFiles = (files) => {
  if (!files) return;
  Object.values(files).forEach((fileArray) => {
    fileArray.forEach((file) => {
      const key = file.filename || file.key;
      if (key) removeObject(key);
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
      let docsMediaIds = [];
      if (req.files && req.files.policeDocs) {
        // Register each file in Media; store the reference ids (int).
        docsMediaIds = await Promise.all(req.files.policeDocs.map(f => mediaFromFile(f, 'police_doc', null)));
      }

      userData.policeProfile = {
        create: { name, badgeId, rank, empId, department, wing, jurisdiction, joiningDate, email, mobile, altPhone, station, district, state, country, clearanceLevel, docsMediaIds }
      };
    } else if (role === 'organization') {
      const { orgName, orgType, country, state, district, city, address, pinCode, officialEmail, officialPhone, adminName, designation, empId, adminEmail, mobile, parentOrg, department, jurisdiction, altPhone, website } = req.body;

      if (!orgName || !orgType || !country || !state || !district || !city || !address || !pinCode || !officialEmail || !officialPhone || !adminName || !designation || !empId || !adminEmail || !mobile) {
        cleanupFiles(req.files);
        return res.status(400).json({ success: false, message: 'Missing required organization fields.' });
      }

      let authLetterMediaId = null;
      let govCertMediaId = null;
      let supportingDocsMediaIds = [];

      if (req.files) {
        // Register each file in Media; store the reference ids (int).
        if (req.files.authLetter) authLetterMediaId = await mediaFromFile(req.files.authLetter[0], 'auth_letter', null);
        if (req.files.govCert) govCertMediaId = await mediaFromFile(req.files.govCert[0], 'gov_cert', null);
        if (req.files.supportingDocs) {
          supportingDocsMediaIds = await Promise.all(req.files.supportingDocs.map(f => mediaFromFile(f, 'supporting_doc', null)));
        }
      }

      userData.organizationProfile = {
        create: {
          orgName, orgType, parentOrg, department, jurisdiction, country, state, district, city, address, pinCode, officialEmail, officialPhone, altPhone, website, adminName, designation, empId, adminEmail, mobile,
          authLetterMediaId, govCertMediaId, supportingDocsMediaIds
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

// `ref` is a Media id (or legacy key). Resolves to the object key for metadata,
// and includes a fresh signed `url` so the client can open it directly.
const getFileMetadata = async (ref) => {
  if (!ref) return null;
  try {
    const objectKey = await resolveObjectKey(ref);
    if (!objectKey) return null;
    const stat = await statObject(objectKey);
    if (!stat) return null;
    const sizeInMB = (stat.size / (1024 * 1024)).toFixed(2) + ' MB';
    const ext = objectKey.split('.').pop().toLowerCase();
    let type = 'Document';
    if (ext === 'pdf') type = 'PDF Document';
    if (['jpg', 'jpeg', 'png'].includes(ext)) type = 'Image File';
    return {
      name: objectKey,
      size: sizeInMB,
      date: stat.lastModified ? stat.lastModified.toLocaleDateString() : 'N/A',
      type,
      url: await getPresignedUrl(objectKey, SIGNED_URL_EXPIRY_SECONDS, objectKey),
    };
  } catch (e) {
    return { name: ref, size: 'Unknown', date: 'N/A', type: 'File' };
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
    const docKeys = [];
    if (userProfile.organizationProfile) {
      const o = userProfile.organizationProfile;
      userProfile.name = o.adminName;
      userProfile.clearance = o.designation || 'Org Admin';
      if (o.authLetterMediaId) docKeys.push(o.authLetterMediaId);
      if (o.govCertMediaId) docKeys.push(o.govCertMediaId);
      if (o.supportingDocsMediaIds) docKeys.push(...o.supportingDocsMediaIds);
    }

    if (userProfile.policeProfile) {
      const p = userProfile.policeProfile;
      userProfile.name = p.name;
      userProfile.clearance = p.clearanceLevel || p.rank || 'Police Officer';
      if (p.docsMediaIds) docKeys.push(...p.docsMediaIds);
    }

    // Resolve metadata for all document keys in parallel
    await Promise.all(docKeys.map(async (key) => {
      userProfile.documentMetadata[key] = await getFileMetadata(key);
    }));

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

    // Reject path traversal in the reference
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(403).json({ success: false, message: 'Forbidden access' });
    }

    const objectKey = await resolveObjectKey(filename);
    if (!objectKey) return res.status(404).json({ success: false, message: 'File not found' });
    await streamDocument(res, objectKey);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error.', error: error.message });
    }
  }
};

/**
 * Permanent-link endpoint: returns a fresh, time-limited signed URL for a stored
 * document key. Only the permanent key lives in the DB; the URL is transient.
 * Response: { success, url, expiresIn }
 */
export const getDocumentSignedUrl = async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(403).json({ success: false, message: 'Forbidden access' });
    }

    const objectKey = await resolveObjectKey(filename);
    if (!objectKey || !(await statObject(objectKey))) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const url = await getPresignedUrl(objectKey, SIGNED_URL_EXPIRY_SECONDS, objectKey);
    res.status(200).json({ success: true, url, expiresIn: SIGNED_URL_EXPIRY_SECONDS });
  } catch (error) {
    console.error('[getDocumentSignedUrl Error]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating document link' });
    }
  }
};
