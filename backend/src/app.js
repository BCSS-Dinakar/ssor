import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import healthRoutes from './routes/health.route.js';
import authRoutes from './routes/auth.route.js';
import otpRoutes from './routes/otp.route.js';
import policeRoutes from './routes/police.route.js';
import organizationRoutes from './routes/organization.route.js';
import mediaRoutes from './routes/media.route.js';
import epettyRoutes from './routes/epetty.route.js';
import eprisonsRoutes from './routes/eprisons.js';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security & Performance Middlewares
app.use(helmet()); // Sets secure HTTP headers
app.use(compression()); // GZIP compression for JSON payloads

// Rate Limiting (Production Only)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
  });
  app.use('/api', limiter);
}

// Global Middlewares
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? (process.env.FRONTEND_URL || false) // In prod, strictly use env var (or fail securely)
  : (process.env.FRONTEND_URL || 'http://localhost:3000'); // In dev, default to localhost

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/police', policeRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/e-petty', epettyRoutes);
app.use('/api/eprisons', eprisonsRoutes);
app.use('/api/e-prisons', eprisonsRoutes);
app.get('/', (req, res) => {
  res.send('SSOR Backend Running');
});

// Fallback 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Upload errors (bad type / too large) → clean 400, not a 500.
  if (err && (err.name === 'MulterError' || err.code === 'UNSUPPORTED_FILE_TYPE')) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum size is 5MB.'
      : err.message || 'Invalid file upload.';
    return res.status(400).json({ success: false, message });
  }

  logger.error('[UnhandledError]', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
