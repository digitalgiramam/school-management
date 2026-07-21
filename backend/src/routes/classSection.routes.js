const router = require('express').Router();
const ctrl = require('../controllers/classSection.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

router.get('/',  ctrl.getByClass);
router.post('/', authorize(...ADMINS), ctrl.saveMapping);

module.exports = router;
