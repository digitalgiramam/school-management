// Vercel Serverless Function entry point.
// Vercel automatically injects env vars in production.
// For local `vercel dev`, dotenv loads backend/.env.
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

module.exports = require('../backend/src/app');
