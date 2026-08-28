import express from 'express';
import {
  listSections,
  createSection,
  updateSection,
  deleteSection,
  WRITE_ROLES,
} from '../controllers/riskTier.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

const readRoles = ['organization', 'police', 'STATE_ADMIN', 'DISTRICT_USER'];

router.get('/', requireAuth, requireRoles(readRoles), listSections);
router.post('/', requireAuth, requireRoles(WRITE_ROLES), createSection);
router.put('/:id', requireAuth, requireRoles(WRITE_ROLES), updateSection);
router.delete('/:id', requireAuth, requireRoles(WRITE_ROLES), deleteSection);

export default router;
