/**
 * Parse pagination / sorting / search params from the request query.
 */
const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  const search = query.search?.trim() || '';
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return { page, limit, skip, search, sortBy, sortOrder };
};

module.exports = { parsePaginationParams };
