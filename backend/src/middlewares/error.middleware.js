const { Prisma } = require('@prisma/client');
const logger = require('../config/logger');

const PRISMA_ERRORS = {
  P2000: (e) => ({ status: 400, message: `Value too long for field: ${e.meta?.column_name || 'unknown'}` }),
  P2001: (e) => ({ status: 404, message: `Record not found: ${e.meta?.cause || ''}` }),
  P2002: (e) => {
    const fields = Array.isArray(e.meta?.target) ? e.meta.target.join(', ') : e.meta?.target || 'field';
    return { status: 409, message: `Duplicate value for unique field: ${fields}` };
  },
  P2003: (e) => ({ status: 400, message: `Foreign key constraint failed on field: ${e.meta?.field_name || 'unknown'}` }),
  P2004: ()  => ({ status: 400, message: 'A constraint failed on the database' }),
  P2005: (e) => ({ status: 400, message: `Invalid value for field: ${e.meta?.field_name || 'unknown'}` }),
  P2006: (e) => ({ status: 400, message: `Invalid value provided for ${e.meta?.model || ''}.${e.meta?.field || ''}` }),
  P2011: (e) => ({ status: 400, message: `Null constraint violation on: ${e.meta?.constraint || 'unknown'}` }),
  P2012: (e) => ({ status: 400, message: `Missing required value: ${e.meta?.path || 'unknown'}` }),
  P2014: (e) => ({ status: 400, message: `Relation violation: ${e.meta?.relation_name || 'unknown'}` }),
  P2025: (e) => ({ status: 404, message: e.meta?.cause || 'Record not found' }),
};

const errorHandler = (err, req, res, next) => {
  const requestId = req.id;

  // ── Prisma known errors ──────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const handler = PRISMA_ERRORS[err.code];
    if (handler) {
      const { status, message } = handler(err);
      logger.warn({ message, requestId, code: err.code });
      return res.status(status).json({ success: false, message, requestId });
    }
  }

  // ── Prisma validation errors ─────────────────────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    const message = 'Invalid data sent to database';
    logger.warn({ message, requestId, detail: err.message });
    return res.status(400).json({ success: false, message, requestId });
  }

  if (err.code && err.code.startsWith('P')) {
    logger.warn({ message: err.message, requestId, code: err.code });
    return res.status(400).json({ success: false, message: err.message, requestId });
  }

  // ── JWT errors ───────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token has expired', requestId });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token', requestId });
  }
  if (err.name === 'NotBeforeError') {
    return res.status(401).json({ success: false, message: 'Token not yet active', requestId });
  }

  // ── Multer errors ────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large', requestId });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, message: 'Unexpected file field', requestId });
  }

  // ── Malformed JSON ───────────────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Malformed JSON in request body', requestId });
  }

  // ── express-validator array ──────────────────────────────────
  if (Array.isArray(err)) {
    const errors = err.map((e) => ({ field: e.param, message: e.msg }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors, requestId });
  }

  // ── Operational / AppError ───────────────────────────────────
  if (err.isOperational) {
    logger.warn({ message: err.message, requestId, statusCode: err.statusCode });
    return res.status(err.statusCode || 400).json({ success: false, message: err.message, requestId });
  }

  // ── Unexpected error ─────────────────────────────────────────
  console.error('=== UNHANDLED ERROR ===', err.name, err.message, err.stack);
  logger.error({ message: err.message || 'Internal Server Error', requestId, stack: err.stack });
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    requestId,
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.id,
  });
};

module.exports = { errorHandler, notFound };
