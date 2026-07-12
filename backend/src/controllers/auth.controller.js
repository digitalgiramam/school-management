const authService = require('../services/auth.service');
const { success } = require('../utils/response');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errors');

const validate = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 422);
};

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

const authController = {
  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags: [Auth]
   *     summary: Login and receive JWT tokens
   *     security: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email: { type: string, format: email }
   *               password: { type: string }
   *     responses:
   *       200:
   *         description: Login successful
   *       401:
   *         description: Invalid credentials
   */
  async login(req, res, next) {
    try {
      validate(req);
      const result = await authService.login(req.body.email, req.body.password, req);
      success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id, req);
      success(res, {}, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req, res, next) {
    try {
      validate(req);
      const tokens = await authService.refreshToken(req.body.refreshToken);
      success(res, tokens, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      validate(req);
      await authService.forgotPassword(req.body.email);
      success(res, {}, 'If that email exists, a reset link has been sent.');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      validate(req);
      await authService.resetPassword(req.body.token, req.body.password);
      success(res, {}, 'Password reset successfully');
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      validate(req);
      await authService.changePassword(
        req.user.id,
        req.body.currentPassword,
        req.body.newPassword
      );
      success(res, {}, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      const prisma = require('../config/prisma');
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true, email: true, role: true, profilePhoto: true,
          lastLoginAt: true, createdAt: true,
        },
      });
      success(res, user, 'Profile fetched');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
