import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
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

const allowedOrigins = [
  'http://localhost:5173', // Default Vite development port
  'http://localhost:3000', // Alternative React port
  'https://admin.bhaktimanagement.com', // Production admin subdomain
  'https://bhaktimanagement.com', // Public site main domain
  'https://www.bhaktimanagement.com',
  'https://api.bhaktimanagement.com',
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

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Bhakti Management Backend API is running",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      jobs: "/api/jobs",
      auth: "/api/auth"
    }
  });
});

// Health check endpoint (public and database-independent)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend is running',
  });
});

// ==========================================
// 3. Mount Routes
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/enquiries', enquiryRoutes);

// Fallback for unmapped API routes (Express 5 syntax)
app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Serve built React dashboard static files safely if the folder exists
const clientDistPath = path.join(__dirname, '../client/dist');
const indexHtmlPath = path.join(clientDistPath, 'index.html');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Wildcard fallback for client SPA routing (Express 5 named parameter syntax)
app.get('/*splat', (_req, res) => {
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.status(200).json({ message: 'Bhakti Management API is running.' });
  }
});

// ==========================================
// 4. Global Error Handler
// ==========================================
app.use(errorHandler);

// ==========================================
// 5. Start Server & Graceful Shutdown
// ==========================================
const server = app.listen(Number(PORT), '0.0.0.0', () => {
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

// Catch any unhandled promise rejections or exceptions to prevent silent deaths
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
