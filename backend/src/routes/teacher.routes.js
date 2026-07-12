const router = require('express').Router();
const ctrl = require('../controllers/teacher.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/attendance', ctrl.getAttendance);
router.post('/', authorize(...ADMINS), ctrl.create);
router.put('/:id', authorize(...ADMINS), ctrl.update);
router.put('/:id/subjects', authorize(...ADMINS), ctrl.assignSubjects);
router.delete('/:id', authorize(...ADMINS), ctrl.deactivate);

module.exports = router;
