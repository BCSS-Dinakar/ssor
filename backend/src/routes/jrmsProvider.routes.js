// Routes exposed to the JRMS third-party integration.
// Add every new API given to the JRMS provider here.
import express from 'express';
import { getSections, postReleaseAlerts, getReleaseAlerts, getPoliceStations } from '../controllers/jrmsProvider.controller.js';

const router = express.Router();

router.get('/ssor_sections', getSections);
router.post('/eprisoners_release_alerts', postReleaseAlerts);
router.get('/eprisoners_release_alerts', getReleaseAlerts);
router.get('/police_stations', getPoliceStations);

export default router;
