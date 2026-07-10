import { Router } from 'express';
import { requireAuth, requirePolice } from '../middleware/auth.middleware.js';
import { 
  getLogs, 
  getOrganizations, 
  getOrganizationById, 
  updateOrganizationStatus, 
  getDocument, 
  getDashboardStats, 
  getVerifications, 
  getVerificationById, 
  updateVerificationStatus, 
  scanVerificationById,
  generateVerificationReport
} from '../controllers/police.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requirePolice);

router.get('/dashboard', getDashboardStats);
router.get('/logs', getLogs);
router.get('/organizations', getOrganizations);
router.get('/organizations/:id', getOrganizationById);
router.put('/organizations/:id/status', updateOrganizationStatus);
router.get('/documents/:filename', getDocument);

router.get('/verifications', getVerifications);
router.get('/verifications/:id', getVerificationById);
router.put('/verifications/:id/status', updateVerificationStatus);
router.post('/verifications/:id/scan', scanVerificationById);
router.post('/verifications/:id/report', generateVerificationReport);

export default router;

