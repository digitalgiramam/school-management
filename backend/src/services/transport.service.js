const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const transportService = {
  async getBuses(query) {
    const { page, limit, skip, search } = parsePaginationParams(query);
    const where = {
      ...(search && {
        OR: [
          { busNumber: { contains: search, mode: 'insensitive' } },
          { registrationNo: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      prisma.bus.findMany({
        where, skip, take: limit,
        orderBy: { busNumber: 'asc' },
        include: {
          driver: { select: { name: true, phone: true } },
          _count: { select: { routes: true, allocations: true } },
        },
      }),
      prisma.bus.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async createBus(data) {
    const { busNumber, registrationNo, capacity, gpsDeviceId,
            driverName, driverPhone, driverLicense } = data;

    let driverId = null;
    if (driverName) {
      const driver = await prisma.driver.create({
        data: { name: driverName, phone: driverPhone || '', licenseNo: driverLicense || '' },
      });
      driverId = driver.id;
    }

    return prisma.bus.create({
      data: { busNumber, registrationNo, capacity: parseInt(capacity), gpsDeviceId, driverId },
      include: { driver: true },
    });
  },

  async updateBus(id, data) {
    const { busNumber, registrationNo, capacity, isActive, gpsDeviceId } = data;
    return prisma.bus.update({
      where: { id },
      data: {
        busNumber, registrationNo,
        capacity: capacity ? parseInt(capacity) : undefined,
        isActive, gpsDeviceId,
      },
    });
  },

  async getRoutes(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const { busId } = query;
    const where = { ...(busId && { busId }) };
    const [items, total] = await Promise.all([
      prisma.route.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
        include: {
          bus: { select: { busNumber: true } },
          stops: { orderBy: { order: 'asc' } },
          _count: { select: { allocations: true } },
        },
      }),
      prisma.route.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async createRoute(data) {
    const { name, busId, startPoint, endPoint, distance, monthlyFee, stops = [] } = data;
    return prisma.route.create({
      data: {
        name, busId, startPoint, endPoint,
        distance: distance ? parseFloat(distance) : null,
        monthlyFee: parseFloat(monthlyFee) || 0,
        stops: {
          create: stops.map((s, i) => ({ name: s.name, order: i + 1, time: s.time || s.arrivalTime || null })),
        },
      },
      include: { bus: { select: { busNumber: true } }, stops: true },
    });
  },

  async updateRoute(id, data) {
    return prisma.route.update({
      where: { id },
      data: {
        name: data.name,
        startPoint: data.startPoint,
        endPoint: data.endPoint,
        distance: data.distance ? parseFloat(data.distance) : undefined,
        monthlyFee: data.monthlyFee ? parseFloat(data.monthlyFee) : undefined,
      },
    });
  },

  async deleteRoute(id) {
    const route = await prisma.route.findUnique({
      where: { id }, include: { _count: { select: { allocations: true } } },
    });
    if (!route) throw new AppError('Route not found', 404);
    if (route._count.allocations > 0) throw new AppError('Route has active student allocations', 400);
    return prisma.route.delete({ where: { id } });
  },

  async allocate(data) {
    const { studentId, routeId, stopId, busId, validFrom } = data;

    const existing = await prisma.busAllocation.findFirst({
      where: { studentId, validTo: null },
    });
    if (existing) throw new AppError('Student already allocated to a route', 400);

    let resolvedBusId = busId;
    if (!resolvedBusId) {
      const route = await prisma.route.findUnique({ where: { id: routeId }, select: { busId: true } });
      if (!route) throw new AppError('Route not found', 404);
      resolvedBusId = route.busId;
    }

    return prisma.busAllocation.create({
      data: {
        studentId,
        routeId,
        busId: resolvedBusId,
        stopId: stopId || null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
      },
      include: {
        route: { select: { name: true, bus: { select: { busNumber: true } } } },
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
      },
    });
  },

  async getAllocations(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const { routeId, activeOnly } = query;
    const where = {
      ...(activeOnly !== 'false' && { validTo: null }),
      ...(routeId && { routeId }),
    };
    const [items, total] = await Promise.all([
      prisma.busAllocation.findMany({
        where, skip, take: limit,
        orderBy: { validFrom: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          route: { include: { bus: { select: { busNumber: true } }, stops: { orderBy: { order: 'asc' } } } },
        },
      }),
      prisma.busAllocation.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async deallocate(allocationId) {
    const alloc = await prisma.busAllocation.findUnique({ where: { id: allocationId } });
    if (!alloc) throw new AppError('Allocation not found', 404);
    if (alloc.validTo) throw new AppError('Allocation already ended', 400);
    return prisma.busAllocation.update({
      where: { id: allocationId },
      data: { validTo: new Date() },
    });
  },
};

module.exports = transportService;
