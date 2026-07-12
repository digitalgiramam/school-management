const prisma = require('../config/prisma');
const { AppError } = require('../utils/errors');
const { parsePaginationParams } = require('../utils/pagination');

const hostelService = {
  async getAll(query) {
    const { page, limit, skip, search } = parsePaginationParams(query);
    const where = {
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };
    const [items, total] = await Promise.all([
      prisma.hostel.findMany({
        where, skip, take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { rooms: true } },
          rooms: {
            select: {
              id: true,
              capacity: true,
              // leaveDate is the correct schema field (not endDate)
              allocations: { where: { leaveDate: null }, select: { id: true } },
            },
          },
        },
      }),
      prisma.hostel.count({ where }),
    ]);

    const data = items.map((h) => {
      const totalCapacity = h.rooms.reduce((s, r) => s + r.capacity, 0);
      const occupied = h.rooms.reduce((s, r) => s + r.allocations.length, 0);
      return { ...h, totalCapacity, occupied, available: totalCapacity - occupied };
    });

    return { data, total, page, limit };
  },

  async create(data) {
    const { name, type, address, capacity } = data;
    return prisma.hostel.create({
      data: { name, type, address, capacity: parseInt(capacity) || 0 },
    });
  },

  async update(id, data) {
    return prisma.hostel.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        address: data.address,
        ...(data.capacity && { capacity: parseInt(data.capacity) }),
      },
    });
  },

  async getRooms(hostelId) {
    return prisma.hostelRoom.findMany({
      where: { hostelId },
      orderBy: [{ floor: 'asc' }, { roomNo: 'asc' }],
      include: {
        allocations: {
          where: { leaveDate: null },
          select: { id: true, studentId: true },
        },
      },
    });
  },

  async addRoom(hostelId, data) {
    const { roomNo, floor, capacity, type } = data;
    const exists = await prisma.hostelRoom.findUnique({
      where: { hostelId_roomNo: { hostelId, roomNo } },
    });
    if (exists) throw new AppError('Room number already exists in this hostel', 400);
    return prisma.hostelRoom.create({
      data: {
        hostelId, roomNo,
        floor: parseInt(floor) || 1,
        capacity: parseInt(capacity) || 4,
        type: type || 'SHARED',
      },
    });
  },

  async allocate(data) {
    const { studentId, roomId, joinDate } = data;

    const existing = await prisma.hostelAllocation.findFirst({
      where: { studentId, leaveDate: null },
    });
    if (existing) throw new AppError('Student is already allocated to a room', 400);

    const room = await prisma.hostelRoom.findUnique({
      where: { id: roomId },
      include: { allocations: { where: { leaveDate: null } } },
    });
    if (!room) throw new AppError('Room not found', 404);
    if (room.allocations.length >= room.capacity) throw new AppError('Room is full', 400);

    return prisma.hostelAllocation.create({
      data: {
        studentId,
        roomId,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
      },
      include: {
        room: { include: { hostel: { select: { name: true } } } },
        student: { select: { firstName: true, lastName: true, admissionNumber: true } },
      },
    });
  },

  async getAllocations(query) {
    const { page, limit, skip } = parsePaginationParams(query);
    const { hostelId, roomId, activeOnly } = query;

    const where = {
      ...(activeOnly !== 'false' && { leaveDate: null }),
      ...(roomId && { roomId }),
      ...(hostelId && { room: { hostelId } }),
    };

    const [items, total] = await Promise.all([
      prisma.hostelAllocation.findMany({
        where, skip, take: limit,
        orderBy: { joinDate: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          room: { include: { hostel: { select: { name: true } } } },
        },
      }),
      prisma.hostelAllocation.count({ where }),
    ]);
    return { data: items, total, page, limit };
  },

  async vacate(allocationId) {
    const alloc = await prisma.hostelAllocation.findUnique({ where: { id: allocationId } });
    if (!alloc) throw new AppError('Allocation not found', 404);
    if (alloc.leaveDate) throw new AppError('Student has already vacated', 400);
    return prisma.hostelAllocation.update({
      where: { id: allocationId },
      data: { leaveDate: new Date() },
    });
  },
};

module.exports = hostelService;
