import express from 'express';
import { getDistricts, syncDistricts } from '../controllers/district.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getDistricts);
router.post('/sync', requireRoles(['STATE_ADMIN']), syncDistricts);

export default router;
