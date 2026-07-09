import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

// Create a connection pool for PostgreSQL
const isLocal = connectionString.includes('localhost') || 
                connectionString.includes('127.0.0.1') || 
                connectionString.includes('db:'); // Matches docker service container name

const pool = new Pool({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
});

// Initialize the Prisma pg driver adapter (required by Prisma 7 for direct DB connections)
const adapter = new PrismaPg(pool);

// Export a single PrismaClient instance for use across the application
export const prisma = new PrismaClient({ adapter });
export { pool };