import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import 'dotenv/config';

import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import candidateRoutes from './routes/candidates';
import enquiryRoutes from './routes/enquiries';
import { errorHandler } from './middleware/error';
import { prisma, pool } from './config/db';
import { logger, loggerStream } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. Security Middleware Setup
// ==========================================

// Secure HTTP headers
app.use(helmet());

// CORS configuration - Allow admin panel requests
const allowedOrigins = [
  'http://localhost:5173', // Default Vite development port
  'http://localhost:3000', // Alternative React port
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or matching origins
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allow cookies to be sent along with requests
  })
);

// Body Parser & Cookie Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: loggerStream }));
}

// Global API Rate Limiting (100 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Specific rate limiting for login endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 login attempts per windowMs
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

// ==========================================
// 2. Static Files (Uploads)
// ==========================================
// Serve uploads directory for resume files (only authenticated admins should access in production, 
// but we will implement download endpoints in the router rather than serving raw files statically if possible.
// However, exposing it statically is okay for testing, but let's expose it with a safety path.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// 3. Mount Routes
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/enquiries', enquiryRoutes);

// Fallback for unmapped API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Serve built React dashboard static files
app.use(express.static(path.join(__dirname, '../client/dist')));

// Wildcard fallback for client SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// ==========================================
// 4. Global Error Handler
// ==========================================
app.use(errorHandler);

// ==========================================
// 5. Start Server & Graceful Shutdown
// ==========================================
const server = app.listen(PORT, () => {
  logger.info(`🚀 Bhakti Management backend running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close Express server
  server.close(() => {
    logger.info('✔ Express server closed.');
  });

  try {
    // Disconnect Prisma Client
    await prisma.$disconnect();
    logger.info('✔ Prisma Client disconnected.');

    // Close pg connection pool
    await pool.end();
    logger.info('✔ PostgreSQL connection pool closed.');

    logger.info('👋 Graceful shutdown complete. Exiting.');
    process.exit(0);
  } catch (err) {
    logger.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
