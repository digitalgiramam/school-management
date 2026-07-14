// Entry point for Railway and local development.
// Vercel uses api/index.js instead.
const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');

const PORT = config.port || 8080;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running in ${config.env} mode on port ${PORT}`);
  if (config.env !== 'production') {
    logger.info(`API docs: http://localhost:${PORT}/api-docs`);
  }
});
