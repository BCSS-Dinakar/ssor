import { Router } from 'express';
import { streamMediaRaw } from '../controllers/media.controller.js';

const router = Router();

// Public route: authorization is the signed token in the query string, not a cookie.
router.get('/:id/raw', streamMediaRaw);

export default router;
