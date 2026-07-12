const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/attendance-trend', ctrl.getAttendanceTrend);
router.get('/fee-trend', ctrl.getFeeCollectionTrend);

module.exports = router;
