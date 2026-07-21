const router = require('express').Router();
const ctrl = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

const STAFF = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'];

// Must come before /:param routes
router.get('/my-sections', ctrl.getMySections);

// GET /attendance?sectionId=&date=
router.get('/', ctrl.getBySection);

// POST /attendance/bulk
router.post('/bulk', authorize(...STAFF), ctrl.markBulk);

// GET /attendance/student/:studentId
router.get('/student/:studentId', ctrl.getStudentAttendance);

module.exports = router;
