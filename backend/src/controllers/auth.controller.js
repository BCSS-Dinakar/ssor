import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { streamDocument, statObject, removeObject, getPresignedUrl, SIGNED_URL_EXPIRY_SECONDS } from '../services/storage.service.js';
import { mediaFromFile, resolveObjectKey, guardDocumentAccess, deleteMediaByObjectKey } from '../services/media.service.js';
import { setCache, getCache, deleteCache } from '../config/redis.js';
import logger from '../utils/logger.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Remove already-persisted uploads (MinIO object + Media row) when registration
// fails after files were pushed by persistUploads. Fire-and-forget: never throws.
const cleanupFiles = (files) => {
  if (!files) return;
  Object.values(files).forEach((fileArray) => {
    fileArray.forEach((file) => {
      const key = file.filename || file.key;
      if (key) {
        removeObject(key);
        deleteMediaByObjectKey(key);
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
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    // Allows user to delete their own account
    await prisma.user.delete({ where: { id: req.user.id } });
    res.clearCookie('token', COOKIE_OPTIONS);
    res.status(200).json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

export const getDocument = async (req, res) => {
  try {
    const guard = await guardDocumentAccess(req.user, req.params.filename);
    if (guard.error) return res.status(guard.error.status).json({ success: false, message: guard.error.message });
    await streamDocument(res, guard.objectKey);
  } catch (error) {
    logger.error('[getDocument]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error.' });
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
    const guard = await guardDocumentAccess(req.user, req.params.filename);
    if (guard.error) return res.status(guard.error.status).json({ success: false, message: guard.error.message });

    const url = await getPresignedUrl(guard.objectKey, SIGNED_URL_EXPIRY_SECONDS, guard.objectKey);
    res.status(200).json({ success: true, url, expiresIn: SIGNED_URL_EXPIRY_SECONDS });
  } catch (error) {
    logger.error('[getDocumentSignedUrl]', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating document link' });
    }
  }
};

export const requestLoginOtp = async (req, res) => {
  try {
    const { loginId, role } = req.body;
    if (!loginId || !role) {
      return res.status(400).json({ success: false, message: 'Login ID and role are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { loginId },
      include: { policeProfile: true, organizationProfile: true }
    });

    if (!user || user.role !== role) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or role mismatch.' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ success: false, message: `Login failed: Account is ${user.status}.` });
    }

    let mobile = null;
    if (role === 'police' && user.policeProfile) {
      mobile = user.policeProfile.mobile;
    } else if (role === 'organization' && user.organizationProfile) {
      mobile = user.organizationProfile.mobile;
    }

    if (!mobile) {
      return res.status(400).json({ success: false, message: 'No registered mobile number found for this account.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const redisKey = `login-otp:${loginId.trim()}`;

    await setCache(redisKey, otp, 120); // 2 minutes valid for login

    console.log(`🔑 Login OTP for ${loginId} (${mobile}): ${otp}`);

    const maskedMobile = mobile.slice(0, 2) + '******' + mobile.slice(-2);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${maskedMobile}.`,
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    });
  } catch (error) {
    console.error('requestLoginOtp Error:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const verifyLoginOtp = async (req, res) => {
  try {
    const { loginId, role, otp } = req.body;

    if (!loginId || !role || !otp) {
      return res.status(400).json({ success: false, message: 'Login ID, role, and OTP are required.' });
    }

    const redisKey = `login-otp:${loginId.trim()}`;
    const storedOtp = await getCache(redisKey);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested. Please request a new OTP.' });
    }

    if (storedOtp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // OTP matched, delete it from redis
    await deleteCache(redisKey);

    const user = await prisma.user.findUnique({
      where: { loginId },
      include: { policeProfile: true, organizationProfile: true }
    });

    if (!user || user.role !== role || user.status !== 'approved') {
      return res.status(401).json({ success: false, message: 'Invalid request.' });
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
    console.error('verifyLoginOtp Error:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

export const recoverRequest = async (req, res) => {
  try {
    const { role, mobile } = req.body;
    if (!role || !mobile) {
      return res.status(400).json({ success: false, message: 'Role and mobile number are required.' });
    }

    let user = null;
    if (role === 'police') {
      const profile = await prisma.policeProfile.findFirst({ where: { mobile } });
      if (profile) user = await prisma.user.findUnique({ where: { id: profile.userId } });
    } else if (role === 'organization') {
      const profile = await prisma.organizationProfile.findFirst({ where: { mobile } });
      if (profile) user = await prisma.user.findUnique({ where: { id: profile.userId } });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found for this mobile number.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const redisKey = `recover-otp:${mobile.trim()}`;

    await setCache(redisKey, otp, 300); // 5 mins

    console.log(`🔑 Recovery OTP for ${mobile}: ${otp}`);
    const maskedMobile = mobile.slice(0, 2) + '******' + mobile.slice(-2);

    res.status(200).json({
      success: true,
      message: `Recovery OTP sent to ${maskedMobile}.`,
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    });
  } catch (error) {
    console.error('recoverRequest Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const recoverVerify = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP are required.' });
    }

    const redisKey = `recover-otp:${mobile.trim()}`;
    const storedOtp = await getCache(redisKey);

    if (!storedOtp) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested.' });
    }
    if (storedOtp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
    }

    await deleteCache(redisKey);

    let user = null;
    const policeProfile = await prisma.policeProfile.findFirst({ where: { mobile } });
    if (policeProfile) user = await prisma.user.findUnique({ where: { id: policeProfile.userId } });
    else {
      const orgProfile = await prisma.organizationProfile.findFirst({ where: { mobile } });
      if (orgProfile) user = await prisma.user.findUnique({ where: { id: orgProfile.userId } });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    // Generate short-lived recovery token for password reset
    const recoveryToken = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: '15m' });

    res.status(200).json({ success: true, loginId: user.loginId, recoveryToken });
  } catch (error) {
    console.error('recoverVerify Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { recoveryToken, newPassword } = req.body;
    if (!recoveryToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Recovery token and new password are required.' });
    }

    const decoded = jwt.verify(recoveryToken, env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(400).json({ success: false, message: 'Invalid or expired recovery token.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash }
    });

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('resetPassword Error:', error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(400).json({ success: false, message: 'Recovery session expired. Please verify OTP again.' });
    }
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
