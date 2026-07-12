const router = require('express').Router();
const ctrl = require('../controllers/student.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management
 */

router.get('/', authorize('SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','TEACHER'), ctrl.getAll);
router.get('/:id', authorize('SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','TEACHER','STUDENT','PARENT'), ctrl.getById);
router.post('/', authorize('SUPER_ADMIN','SCHOOL_ADMIN','RECEPTIONIST'), ctrl.create);
router.put('/:id', authorize('SUPER_ADMIN','SCHOOL_ADMIN'), ctrl.update);
router.delete('/:id', authorize('SUPER_ADMIN','SCHOOL_ADMIN'), ctrl.deactivate);
router.post('/:id/promote', authorize('SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL'), ctrl.promote);
router.get('/:id/attendance-summary', authorize('SUPER_ADMIN','SCHOOL_ADMIN','PRINCIPAL','TEACHER','STUDENT','PARENT'), ctrl.attendanceSummary);
router.post('/:id/photo', authorize('SUPER_ADMIN','SCHOOL_ADMIN'), upload('photo', ['image/jpeg','image/png','image/webp']), ctrl.uploadPhoto);

module.exports = router;
