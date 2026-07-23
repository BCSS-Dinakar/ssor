import express from 'express';
import { verifyCertificate } from '../controllers/verify.controller.js';

const router = express.Router();

// Public endpoint — intentionally NOT behind requireAuth (scanned by anyone).
router.get('/:token', verifyCertificate);

export default router;
