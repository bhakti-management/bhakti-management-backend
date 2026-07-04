import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

// Initialize the Prisma MariaDB/MySQL driver adapter directly with the connection URL
const adapter = new PrismaMariaDb(connectionString);

// Export a single PrismaClient instance for use across the application
export const prisma = new PrismaClient({ adapter });
