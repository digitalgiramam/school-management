const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const config = require('../config');
const { AppError } = require('../utils/errors');
const { sendMail, emailTemplates } = require('../config/mailer');
const { audit } = require('../utils/audit');

/** Generate access + refresh token pair */
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ id: userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

const authService = {
  // ── Login ──────────────────────────────────────────────────────
  async login(email, password, req) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) throw new AppError('Invalid email or password', 401);
    if (!user.isActive) throw new AppError('Account is deactivated', 401);

    // Account lock check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil - new Date()) / 60000);
      throw new AppError(`Account locked. Try again in ${mins} minute(s).`, 423);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const newCount = user.failedLoginCount + 1;
      const update = { failedLoginCount: newCount };

      if (newCount >= config.auth.maxFailedLogins) {
        update.lockedUntil = new Date(Date.now() + config.auth.lockDurationMinutes * 60 * 1000);
        update.failedLoginCount = 0;
      }

      await prisma.user.update({ where: { id: user.id }, data: update });
      throw new AppError('Invalid email or password', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    await audit(user.id, 'LOGIN', 'User', user.id, null, req);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  },

  // ── Refresh token ──────────────────────────────────────────────
  async refreshToken(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, refreshToken: token },
    });
    if (!user) throw new AppError('Invalid refresh token', 401);

    const tokens = generateTokens(user.id, user.role);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return tokens;
  },

  // ── Logout ─────────────────────────────────────────────────────
  async logout(userId, req) {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
    await audit(userId, 'LOGOUT', 'User', userId, null, req);
  },

  // ── Forgot password ────────────────────────────────────────────
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond the same way to prevent email enumeration
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const resetLink = `${config.clientUrl}/reset-password?token=${resetToken}`;
    const name = user.email.split('@')[0];
    await sendMail(email, 'Password Reset Request', emailTemplates.resetPassword(name, resetLink));
  },

  // ── Reset password ─────────────────────────────────────────────
  async resetPassword(token, newPassword) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashed = await bcrypt.hash(newPassword, config.bcrypt.rounds);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
        passwordChangedAt: new Date(),
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });
  },

  // ── Change password ────────────────────────────────────────────
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, config.bcrypt.rounds);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, passwordChangedAt: new Date() },
    });
  },
};

module.exports = authService;
