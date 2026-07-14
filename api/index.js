// Vercel Serverless Function entry point.
// Vercel injects env vars automatically — no dotenv needed.
// For local dev use `vercel dev` which reads .env.vercel.local
module.exports = require('../backend/src/app');
