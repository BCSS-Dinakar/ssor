import express from 'express';
import {
  getDistrictAdmins,
  createDistrictAdmin,
  updateDistrictAdmin,
  resetDistrictAdminPassword,
} from '../controllers/admin.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles(['STATE_ADMIN']));

router.get('/district-admins', getDistrictAdmins);
router.post('/district-admins', createDistrictAdmin);
router.put('/district-admins/:id', updateDistrictAdmin);
router.post('/district-admins/:id/reset-password', resetDistrictAdminPassword);

export default router;
