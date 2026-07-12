const router = require('express').Router();
const ctrl = require('../controllers/transport.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
const ADMINS = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
router.get('/buses', ctrl.getBuses);
router.post('/buses', authorize(...ADMINS), ctrl.createBus);
router.put('/buses/:id', authorize(...ADMINS), ctrl.updateBus);
router.get('/routes', ctrl.getRoutes);
router.post('/routes', authorize(...ADMINS), ctrl.createRoute);
router.put('/routes/:id', authorize(...ADMINS), ctrl.updateRoute);
router.delete('/routes/:id', authorize(...ADMINS), ctrl.deleteRoute);
router.get('/allocations', ctrl.getAllocations);
router.post('/allocate', authorize(...ADMINS), ctrl.allocate);
router.patch('/allocations/:id/deallocate', authorize(...ADMINS), ctrl.deallocate);
module.exports = router;
