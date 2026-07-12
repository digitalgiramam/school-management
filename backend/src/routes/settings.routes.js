const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

router.use(authenticate);

const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];

// ── Profile (all roles) ─────────────────────────────────────────
/**
 * @swagger
 * /settings/profile:
 *   get:
 *     tags: [Settings]
 *     summary: Get current user profile
 *   put:
 *     tags: [Settings]
 *     summary: Update current user profile
 */
router.get('/profile', ctrl.getProfile);
router.put('/profile', ctrl.updateProfile);
router.post('/profile/photo',
  upload('photo', ['image/jpeg', 'image/png', 'image/webp']),
  ctrl.updateProfilePhoto
);

// ── Password ────────────────────────────────────────────────────
router.post('/change-password',
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Min 8 characters')
      .matches(/(?=.*[A-Z])(?=.*[0-9])/).withMessage('Must contain uppercase and number')
      .custom((val, { req }) => {
        if (val === req.body.currentPassword) throw new Error('New password must differ from current');
        return true;
      }),
    body('confirmPassword').custom((val, { req }) => {
      if (val !== req.body.newPassword) throw new Error('Passwords do not match');
      return true;
    }),
  ],
  ctrl.changePassword
);

// ── School settings (admin only) ─────────────────────────────────
router.get('/school', ctrl.getSchoolSettings);
router.put('/school', authorize(...ADMINS), ctrl.updateSchoolSettings);

// ── Grade settings (admin only) ──────────────────────────────────
router.get('/grades', ctrl.getGradeSettings);
router.post('/grades', authorize(...ADMINS), ctrl.upsertGrade);
router.delete('/grades/:id', authorize(...ADMINS), ctrl.deleteGrade);

// ── Academic years (admin only) ──────────────────────────────────
router.get('/academic-years', ctrl.getAcademicYears);
router.post('/academic-years', authorize(...ADMINS), ctrl.createAcademicYear);
router.patch('/academic-years/:id/set-current', authorize(...ADMINS), ctrl.setCurrentAcademicYear);
router.delete('/academic-years/:id', authorize(...ADMINS), ctrl.deleteAcademicYear);

// ── Branches (admin only) ────────────────────────────────────────
router.get('/branches', ctrl.getBranches);
router.post('/branches', authorize(...ADMINS), ctrl.upsertBranch);
router.delete('/branches/:id', authorize(...ADMINS), ctrl.deleteBranch);

module.exports = router;
