const router = require('express').Router();
const ctrl = require('../controllers/timetable.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'];
router.get('/', ctrl.getBySection);
router.post('/', authorize(...ADMINS), ctrl.upsert);
router.post('/:id/slots', authorize(...ADMINS), ctrl.addSlot);
router.put('/slots/:slotId', authorize(...ADMINS), ctrl.updateSlot);
router.delete('/slots/:slotId', authorize(...ADMINS), ctrl.deleteSlot);
module.exports = router;
