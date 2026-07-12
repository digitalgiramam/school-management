const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

/**
 * Attach a unique request ID to every request so log lines from the same
 * request can be correlated across services / log files.
 *
 * The ID is sourced from the X-Request-ID header when present (useful for
 * distributed tracing from a gateway), otherwise a UUID is generated.
 */
const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};

/**
 * Structured HTTP request logger.
 * Logs after the response finishes so we can capture the final status code.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
      : 'http';

    logger[level]({
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      ...(req.user && { userId: req.user.id, role: req.user.role }),
    });
  });

  next();
};

module.exports = { requestId, requestLogger };
