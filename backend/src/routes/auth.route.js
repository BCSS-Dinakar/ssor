import { Router } from 'express';
import { register, login, logout, getMe, deleteAccount, getDocument, requestLoginOtp, verifyLoginOtp } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Accept multipart form data for org registration
router.post('/register', upload.fields([
  { name: 'authLetter', maxCount: 1 },
  { name: 'govCert', maxCount: 1 },
  { name: 'supportingDocs', maxCount: 5 },
  { name: 'policeDocs', maxCount: 5 }
]), register);
router.post('/login', login);
router.post('/login-otp-request', requestLoginOtp);
router.post('/login-otp-verify', verifyLoginOtp);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.delete('/delete', requireAuth, deleteAccount);
router.get('/documents/:filename', requireAuth, getDocument);

export default router;
