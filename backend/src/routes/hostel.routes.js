const router = require('express').Router();
const ctrl = require('../controllers/hostel.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
router.get('/', ctrl.getAll);
router.post('/', authorize(...ADMINS), ctrl.create);
router.put('/:id', authorize(...ADMINS), ctrl.update);
router.get('/:id/rooms', ctrl.getRooms);
router.post('/:id/rooms', authorize(...ADMINS), ctrl.addRoom);
router.get('/allocations', ctrl.getAllocations);
router.post('/allocate', authorize(...ADMINS), ctrl.allocate);
router.patch('/allocations/:id/vacate', authorize(...ADMINS), ctrl.vacate);
module.exports = router;
