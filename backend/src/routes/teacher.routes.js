const router = require('express').Router();
const ctrl = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/upload.middleware');

router.use(authenticate);

const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/attendance', ctrl.getAttendance);
router.post('/', authorize(...ADMINS), ctrl.create);
router.put('/:id', authorize(...ADMINS), ctrl.update);
router.put('/:id/subjects', authorize(...ADMINS), ctrl.assignSubjects);
router.delete('/:id', authorize(...ADMINS), ctrl.deactivate);
router.post('/:id/photo', authorize(...ADMINS), upload('photo', ['image/jpeg', 'image/png', 'image/webp']), ctrl.uploadPhoto);

module.exports = router;
