import express from 'express';
import {
  listDefinitions,
  createDefinition,
  updateDefinition,
  deleteDefinition,
  WRITE_ROLES,
} from '../controllers/riskTier.controller.js';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

const readRoles = ['organization', 'police', 'STATE_ADMIN', 'DISTRICT_USER'];

router.get('/', requireAuth, requireRoles(readRoles), listDefinitions);
router.post('/', requireAuth, requireRoles(WRITE_ROLES), createDefinition);
router.put('/:id', requireAuth, requireRoles(WRITE_ROLES), updateDefinition);
router.delete('/:id', requireAuth, requireRoles(WRITE_ROLES), deleteDefinition);

export default router;
