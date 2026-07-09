import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { submitVerification, getVerifications, getVerificationById, getTickets, createTicket, addTicketMessage, getDashboardStats } from '../controllers/organization.controller.js';

const router = express.Router();

router.use(requireAuth); // All organization routes require active session

router.get('/dashboard', getDashboardStats);
router.post('/verify-candidate', submitVerification);
router.get('/verifications', getVerifications);
router.get('/verifications/:id', getVerificationById);

router.get('/tickets', getTickets);
router.post('/tickets', createTicket);
router.post('/tickets/:id/messages', addTicketMessage);

export default router;
