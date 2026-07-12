/**
 * Wraps an async Express handler so any rejected promise is forwarded
 * to next() — eliminates repetitive try/catch in every controller.
 *
 * Usage:
 *   router.get('/items', catchAsync(async (req, res) => {
 *     const items = await itemService.getAll();
 *     res.json({ success: true, data: items });
 *   }));
 */
const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = catchAsync;
