// Routes exposed to the JRMS third-party integration.
// Add every new API given to the JRMS provider here.
import express from 'express';
import { getSections, postReleaseAlerts, getReleaseAlerts, getPoliceStations } from '../controllers/jrmsProvider.controller.js';

const router = express.Router();

// Middleware to check authentication token
const authenticateJrms = (req, res, next) => {
    const token = req.headers['x-api-key'] || req.headers['authorization'];
    const validToken = process.env.SSOR_TO_JRMS_TOKEN_ACCESS;

    if (!validToken) {
        return res.status(500).json({ error: 'JRMS authentication not configured on server.' });
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication token required' });
    }

    const providedToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    if (providedToken !== validToken) {
        return res.status(403).json({ error: 'Invalid authentication token' });
    }

    next();
};

// Apply the middleware to all JRMS routes
router.use(authenticateJrms);

router.get('/ssor_sections', getSections);
router.post('/eprisoners_release_alerts', postReleaseAlerts);
router.get('/eprisoners_release_alerts', getReleaseAlerts);
router.get('/police_stations', getPoliceStations);

export default router;
