import { Router } from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';
import { getEpettyCaseByNumber, searchEpettyCases } from '../controllers/epetty.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requireRoles(['STATE_ADMIN', 'DISTRICT_USER', 'police']));

router.post('/search', searchEpettyCases);
router.get('/cases/:caseNumber', getEpettyCaseByNumber);

export default router;
