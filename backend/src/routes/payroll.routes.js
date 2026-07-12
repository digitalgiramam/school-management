const router = require('express').Router();
const ctrl = require('../controllers/payroll.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'];
router.get('/', ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.post('/generate', authorize(...ADMINS), ctrl.generate);
router.patch('/:id/pay', authorize(...ADMINS), ctrl.markPaid);
module.exports = router;
