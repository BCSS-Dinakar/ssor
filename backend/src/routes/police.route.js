import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { getLogs, getOrganizations, getOrganizationById, updateOrganizationStatus, getDocument } from '../controllers/police.controller.js';

const router = Router();

// Middleware to ensure only police can access these routes
const requirePolice = (req, res, next) => {
  if (req.user && req.user.role === 'police') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden. Police access only.' });
  }
};

router.use(requireAuth);
router.use(requirePolice);

router.get('/logs', getLogs);
router.get('/organizations', getOrganizations);
router.get('/organizations/:id', getOrganizationById);
router.put('/organizations/:id/status', updateOrganizationStatus);
router.get('/documents/:filename', getDocument);

export default router;
