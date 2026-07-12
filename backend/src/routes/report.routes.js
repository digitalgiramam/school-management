const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'ACCOUNTANT'];
router.get('/students', ctrl.getStudentReport);
router.get('/attendance', ctrl.getAttendanceReport);
router.get('/fees', authorize(...ADMINS), ctrl.getFeeReport);
router.get('/payroll', authorize(...ADMINS), ctrl.getPayrollReport);
module.exports = router;
