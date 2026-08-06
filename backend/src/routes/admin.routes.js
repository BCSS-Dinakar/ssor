import express from 'express';
import { getUsers, getDistrictAdmins, createUser, createDistrictAdmin, updateUserStatus, updateUser, updateDistrictAdmin, resetDistrictAdminPassword } from '../controllers/admin.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles(['STATE_ADMIN'])); // Only State Admin can manage users

// District Admin management (new focused endpoints)
router.get('/district-admins', getDistrictAdmins);
router.post('/district-admins', createDistrictAdmin);
router.put('/district-admins/:id', updateDistrictAdmin);
router.post('/district-admins/:id/reset-password', resetDistrictAdminPassword);

// General user management (kept for backwards compat)
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id', updateUser);

export default router;
