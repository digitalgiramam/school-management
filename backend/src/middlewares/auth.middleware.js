const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');

/**
 * Verify JWT and attach user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true, lockedUntil: true },
    });

    if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('Account is locked. Try again later.', 423);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError('Token expired', 401));
    if (err.name === 'JsonWebTokenError') return next(new AppError('Invalid token', 401));
    next(err);
  }
};

/**
 * Restrict access to specified roles.
 * Usage: authorize('TEACHER', 'SCHOOL_ADMIN')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};

module.exports = { authenticate, authorize };
