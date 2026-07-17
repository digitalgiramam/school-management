jest.mock('../../config/prisma');
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_pw'),
  compare: jest.fn(),
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_access_token'),
  verify: jest.fn(),
}));
jest.mock('../../config/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({}),
  emailTemplates: { resetPassword: jest.fn().mockReturnValue('<html>reset</html>') },
}));
jest.mock('../../utils/audit', () => ({ audit: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../config', () => ({
  env: 'test',
  bcrypt: { rounds: 1 },
  jwt: {
    secret: 'jwt_secret',
    expiresIn: '1d',
    refreshSecret: 'refresh_secret',
    refreshExpiresIn: '7d',
  },
  clientUrl: 'http://localhost:3000',
  auth: { maxFailedLogins: 5, lockDurationMinutes: 30 },
  email: {},
}));

const prisma = require('../../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../../services/auth.service');
const { AppError } = require('../../utils/errors');

const mockUser = {
  id: 'u1',
  email: 'admin@school.com',
  password: 'hashed_pw',
  role: 'SCHOOL_ADMIN',
  isActive: true,
  failedLoginCount: 0,
  lockedUntil: null,
  refreshToken: null,
};

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── login ──────────────────────────────────────────────────────
  describe('login', () => {
    it('returns tokens on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({ ...mockUser, refreshToken: 'mock_access_token' });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await authService.login('admin@school.com', 'password123', {});

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('admin@school.com');
    });

    it('throws 401 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('nope@school.com', 'pw', {})).rejects.toThrow(
        new AppError('Invalid email or password', 401)
      );
    });

    it('throws 401 when account is deactivated', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(authService.login('admin@school.com', 'pw', {})).rejects.toThrow(
        new AppError('Account is deactivated', 401)
      );
    });

    it('throws 423 when account is locked', async () => {
      const future = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, lockedUntil: future });

      await expect(authService.login('admin@school.com', 'pw', {})).rejects.toThrow(/locked/i);
    });

    it('throws 401 when password is wrong and increments failedLoginCount', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, failedLoginCount: 0 });
      bcrypt.compare.mockResolvedValue(false);
      prisma.user.update.mockResolvedValue({});

      await expect(authService.login('admin@school.com', 'wrong', {})).rejects.toThrow(
        new AppError('Invalid email or password', 401)
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ failedLoginCount: 1 }) })
      );
    });

    it('locks account after max failed logins', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, failedLoginCount: 4 });
      bcrypt.compare.mockResolvedValue(false);
      prisma.user.update.mockResolvedValue({});

      await expect(authService.login('admin@school.com', 'wrong', {})).rejects.toThrow();

      const [[{ data }]] = prisma.user.update.mock.calls;
      expect(data.lockedUntil).toBeInstanceOf(Date);
      expect(data.failedLoginCount).toBe(0);
    });
  });

  // ── refreshToken ───────────────────────────────────────────────
  describe('refreshToken', () => {
    it('returns new tokens on valid refresh token', async () => {
      jwt.verify.mockReturnValue({ id: 'u1' });
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      const result = await authService.refreshToken('valid_refresh');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('throws 401 on invalid token', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

      await expect(authService.refreshToken('bad_token')).rejects.toThrow(
        new AppError('Invalid or expired refresh token', 401)
      );
    });

    it('throws 401 when token not found in database', async () => {
      jwt.verify.mockReturnValue({ id: 'u1' });
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.refreshToken('orphan_token')).rejects.toThrow(
        new AppError('Invalid refresh token', 401)
      );
    });
  });

  // ── logout ─────────────────────────────────────────────────────
  describe('logout', () => {
    it('clears refreshToken in database', async () => {
      prisma.user.update.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      await authService.logout('u1', {});

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { refreshToken: null },
      });
    });
  });

  // ── forgotPassword ─────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('stores reset token and sends email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});
      const { sendMail } = require('../../config/mailer');

      await authService.forgotPassword('admin@school.com');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resetToken: expect.any(String),
            resetTokenExpiry: expect.any(Date),
          }),
        })
      );
      expect(sendMail).toHaveBeenCalled();
    });

    it('silently ignores unknown email (no enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const { sendMail } = require('../../config/mailer');

      await authService.forgotPassword('unknown@school.com');

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(sendMail).not.toHaveBeenCalled();
    });
  });

  // ── resetPassword ──────────────────────────────────────────────
  describe('resetPassword', () => {
    it('updates password and clears reset token', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({});

      await authService.resetPassword('valid_token', 'NewPass@123');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_pw',
            resetToken: null,
            resetTokenExpiry: null,
          }),
        })
      );
    });

    it('throws 400 when token is invalid or expired', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(authService.resetPassword('expired_token', 'NewPass@123')).rejects.toThrow(
        new AppError('Invalid or expired reset token', 400)
      );
    });
  });
});
