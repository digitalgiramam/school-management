const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const forgotValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const resetValidation = [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[A-Z])(?=.*[0-9])/)
    .withMessage('Password must contain at least one uppercase letter and one number'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
];

// Public routes
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', refreshValidation, authController.refreshToken);
router.post('/forgot-password', forgotValidation, authController.forgotPassword);
router.post('/reset-password', resetValidation, authController.resetPassword);

// Protected routes
router.use(authenticate);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.post('/change-password', changePasswordValidation, authController.changePassword);

module.exports = router;
