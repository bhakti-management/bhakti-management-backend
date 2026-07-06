import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

// Create a connection pool for PostgreSQL
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Initialize the Prisma pg driver adapter (required by Prisma 7 for direct DB connections)
const adapter = new PrismaPg(pool);

// Export a single PrismaClient instance for use across the application
export const prisma = new PrismaClient({ adapter });
export { pool };