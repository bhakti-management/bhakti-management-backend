import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Create a connection pool for PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize the Prisma pg driver adapter
const adapter = new PrismaPg(pool);

// Export a single PrismaClient instance for use across the application
export const prisma = new PrismaClient({ adapter });

export { pool };
