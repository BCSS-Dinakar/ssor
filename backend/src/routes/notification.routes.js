import express from 'express';
import { getSettings, upsertSettings, getHistory } from '../controllers/notification.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles(['STATE_ADMIN', 'DISTRICT_USER']));

// Settings
router.get('/settings', getSettings);
router.put('/settings', upsertSettings);

// History
router.get('/history', getHistory);


export default router;
