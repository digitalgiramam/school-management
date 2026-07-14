const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

// Explicitly supply the DB URL so Prisma reads from process.env directly.
// This is required in Vercel serverless where schema-level env() resolution
// can fail even when the variable is set in the Vercel dashboard.
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not set in environment variables');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
  });
}

prisma.$on('error', (e) => logger.error('Prisma error:', e));
prisma.$on('warn', (e) => logger.warn('Prisma warning:', e));

module.exports = prisma;
