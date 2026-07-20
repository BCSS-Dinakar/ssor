import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { submitVerification, getVerifications, getVerificationById, getTickets, createTicket, addTicketMessage, getDashboardStats, generateConsentTemplate, getDocument } from '../controllers/organization.controller.js';

const router = express.Router();

router.use(requireAuth); // All organization routes require active session

import { upload } from '../middleware/upload.middleware.js';

router.get('/dashboard', getDashboardStats);
router.post(
  '/verify-candidate',
  upload.fields([{ name: 'candidateImage', maxCount: 1 }, { name: 'consentFile', maxCount: 1 }]),
  submitVerification
);
router.post('/generate-consent-template', upload.single('candidateImage'), generateConsentTemplate);
router.get('/documents/:filename', getDocument);
router.get('/verifications', getVerifications);
router.get('/verifications/:id', getVerificationById);

router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.post('/tickets/:id/messages', addTicketMessage);

export default router;
