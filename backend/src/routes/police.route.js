import { Router } from 'express';
import { requireAuth, requirePolice } from '../middleware/auth.middleware.js';
import { getLogs, getOrganizations, getOrganizationById, updateOrganizationStatus, getDocument, getDashboardStats, getVerifications, getVerificationById, updateVerificationStatus, getTickets, updateTicketStatus, addTicketMessage, scanVerificationById, getOffendersList, getOffenderById } from '../controllers/police.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requirePolice);

router.get('/dashboard', getDashboardStats);
router.get('/offenders', getOffendersList);
router.get('/offenders/:id', getOffenderById);
router.get('/logs', getLogs);
router.get('/organizations', getOrganizations);
router.get('/organizations/:id', getOrganizationById);
router.put('/organizations/:id/status', updateOrganizationStatus);
router.get('/documents/:filename', getDocument);

router.get('/verifications', getVerifications);
router.get('/verifications/:id', getVerificationById);
router.put('/verifications/:id/status', updateVerificationStatus);
router.post('/verifications/:id/scan', scanVerificationById);

router.get('/tickets', getTickets);
router.put('/tickets/:id/status', updateTicketStatus);
router.post('/tickets/:id/messages', addTicketMessage);

export default router;
