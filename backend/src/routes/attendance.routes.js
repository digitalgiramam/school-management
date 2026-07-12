const router = require('express').Router();
const ctrl = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const TEACHERS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'];

// GET /attendance?sectionId=&date= — get attendance for a section on a date
router.get('/', ctrl.getBySection);
// POST /attendance/bulk — mark bulk attendance
router.post('/bulk', authorize(...TEACHERS), ctrl.markBulk);
// GET /attendance/student/:studentId
router.get('/student/:studentId', ctrl.getStudentAttendance);

module.exports = router;
