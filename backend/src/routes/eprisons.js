import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, requireRoles } from '../middleware/auth.middleware.js';
import { processReleaseBatch } from '../services/release-alert.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.use(requireAuth);
router.use(requireRoles(['STATE_ADMIN', 'DISTRICT_USER', 'police']));

let TELANGANA_POLICE_STATIONS = [];
try { TELANGANA_POLICE_STATIONS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'policestations.json'), 'utf8')); } catch (e) { console.error('Failed to load policestations.json:', e); } 
export { TELANGANA_POLICE_STATIONS };

const loadMockData = (filename) => {
    try {
        const filePath = path.join(__dirname, '..', '..', 'data', filename);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading mock data ${filename}:`, err);
        return [];
    }
};

router.get('/stations', (req, res) => {
    return res.json({ status: true, data: TELANGANA_POLICE_STATIONS });
});

router.get('/today', (req, res) => {
    const todayStr = () => {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        return `${d}/${m}/${y}`;
    };

    let todaysAlerts = loadMockData('todays_alerts.json');
    
    // Replace [TODAY] with actual today's date
    todaysAlerts = todaysAlerts.map(alert => {
        if (alert.releaseDate === '[TODAY]') {
            alert.releaseDate = todayStr();
        }
        return alert;
    });

    // Optionally trigger alerts
    processReleaseBatch(todaysAlerts);

    return res.json({ status: true, data: todaysAlerts, stations: TELANGANA_POLICE_STATIONS });
});

router.post('/history', (req, res) => {
    const { psCode = 'ALL', fromDate, toDate, district } = req.body || {};
    
    let targetStations = TELANGANA_POLICE_STATIONS;
    if (psCode && psCode !== 'ALL') {
        targetStations = TELANGANA_POLICE_STATIONS.filter(s => s.code === psCode);
    }
    
    if (district && district !== 'ALL' && district !== 'STATE') {
        const normDist = String(district).toLowerCase().replace(/[-_]/g, ' ').trim();
        targetStations = targetStations.filter(s => {
            const normStationDist = s.district.toLowerCase().replace(/[-_]/g, ' ').trim();
            return normStationDist === normDist || normStationDist.includes(normDist) || normDist.includes(normStationDist);
        });
    }

    let historyAlerts = loadMockData('history_alerts.json');
    
    // Filter by target stations
    const validStationCodes = new Set(targetStations.map(s => s.code));
    historyAlerts = historyAlerts.filter(alert => validStationCodes.has(alert.psCode));

    // Could add strict date filtering here if needed, but for mock data we just return the filtered set
    
    return res.json({ status: true, data: historyAlerts, stations: targetStations });
});

export default router;
