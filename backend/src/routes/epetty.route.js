import { Router } from 'express';
import { requireAuth, requirePolice } from '../middleware/auth.middleware.js';
import { getEpettyCaseByNumber, searchEpettyCases } from '../controllers/epetty.controller.js';

const router = Router();

router.use(requireAuth);
router.use(requirePolice);

router.post('/search', searchEpettyCases);
router.get('/cases/:caseNumber', getEpettyCaseByNumber);

export default router;
