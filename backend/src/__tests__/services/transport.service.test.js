jest.mock('../../config/prisma');
const prisma = require('../../config/prisma');
const transportService = require('../../services/transport.service');
const { AppError } = require('../../utils/errors');

describe('transportService', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── createBus ──────────────────────────────────────────────────
  describe('createBus', () => {
    it('parses capacity string to integer', async () => {
      prisma.driver.create.mockResolvedValue({ id: 'dr1' });
      prisma.bus.create.mockResolvedValue({ id: 'b1', capacity: 40 });

      await transportService.createBus({
        busNumber: 'BUS-01',
        registrationNo: 'TN01A1234',
        capacity: '40',  // string from form
        driverName: 'Ram',
        driverPhone: '9999999999',
      });

      const [[{ data }]] = prisma.bus.create.mock.calls;
      expect(data.capacity).toBe(40);
      expect(typeof data.capacity).toBe('number');
    });

    it('creates driver when driverName is provided', async () => {
      prisma.driver.create.mockResolvedValue({ id: 'dr1' });
      prisma.bus.create.mockResolvedValue({ id: 'b1' });

      await transportService.createBus({
        busNumber: 'BUS-01',
        registrationNo: 'TN01A1234',
        capacity: '40',
        driverName: 'Ram',
        driverPhone: '9999999999',
        driverLicense: 'LIC123',
      });

      expect(prisma.driver.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Ram', licenseNo: 'LIC123' }),
        })
      );
    });

    it('skips driver creation when driverName not provided', async () => {
      prisma.bus.create.mockResolvedValue({ id: 'b1' });

      await transportService.createBus({
        busNumber: 'BUS-01',
        registrationNo: 'TN01A1234',
        capacity: '40',
      });

      expect(prisma.driver.create).not.toHaveBeenCalled();
    });
  });

  // ── updateBus ──────────────────────────────────────────────────
  describe('updateBus', () => {
    it('coerces isActive string to boolean', async () => {
      prisma.bus.update.mockResolvedValue({ id: 'b1' });

      await transportService.updateBus('b1', { isActive: 'false' });

      const [[{ data }]] = prisma.bus.update.mock.calls;
      expect(data.isActive).toBe(false);
    });

    it('coerces isActive boolean true', async () => {
      prisma.bus.update.mockResolvedValue({ id: 'b1' });

      await transportService.updateBus('b1', { isActive: true });

      const [[{ data }]] = prisma.bus.update.mock.calls;
      expect(data.isActive).toBe(true);
    });

    it('parses capacity string to int', async () => {
      prisma.bus.update.mockResolvedValue({ id: 'b1' });

      await transportService.updateBus('b1', { capacity: '50' });

      const [[{ data }]] = prisma.bus.update.mock.calls;
      expect(data.capacity).toBe(50);
    });
  });

  // ── createRoute ────────────────────────────────────────────────
  describe('createRoute', () => {
    it('parses distance and monthlyFee as floats', async () => {
      prisma.route.create.mockResolvedValue({ id: 'r1' });

      await transportService.createRoute({
        name: 'Route A',
        busId: 'b1',
        startPoint: 'School',
        endPoint: 'Town',
        distance: '12.5',     // string from form
        monthlyFee: '500',    // string from form
        stops: [],
      });

      const [[{ data }]] = prisma.route.create.mock.calls;
      expect(data.distance).toBe(12.5);
      expect(data.monthlyFee).toBe(500);
      expect(typeof data.distance).toBe('number');
      expect(typeof data.monthlyFee).toBe('number');
    });

    it('creates route stops in order', async () => {
      prisma.route.create.mockResolvedValue({ id: 'r1' });

      await transportService.createRoute({
        name: 'Route A',
        busId: 'b1',
        startPoint: 'School',
        endPoint: 'Town',
        monthlyFee: '500',
        stops: [
          { name: 'Stop 1', time: '08:00' },
          { name: 'Stop 2', time: '08:15' },
        ],
      });

      const [[{ data }]] = prisma.route.create.mock.calls;
      expect(data.stops.create[0].order).toBe(1);
      expect(data.stops.create[1].order).toBe(2);
    });
  });

  // ── allocate ───────────────────────────────────────────────────
  describe('allocate', () => {
    it('throws 400 when student already allocated', async () => {
      prisma.busAllocation.findFirst.mockResolvedValue({ id: 'alloc1' });

      await expect(
        transportService.allocate({ studentId: 'st1', routeId: 'r1', busId: 'b1' })
      ).rejects.toThrow(new AppError('Student already allocated to a route', 400));
    });

    it('converts validFrom string to Date', async () => {
      prisma.busAllocation.findFirst.mockResolvedValue(null);
      prisma.busAllocation.create.mockResolvedValue({ id: 'alloc1' });

      await transportService.allocate({
        studentId: 'st1',
        routeId: 'r1',
        busId: 'b1',
        validFrom: '2026-01-15',
      });

      const [[{ data }]] = prisma.busAllocation.create.mock.calls;
      expect(data.validFrom).toBeInstanceOf(Date);
    });

    it('uses current date when validFrom not provided', async () => {
      prisma.busAllocation.findFirst.mockResolvedValue(null);
      prisma.busAllocation.create.mockResolvedValue({ id: 'alloc1' });

      await transportService.allocate({ studentId: 'st1', routeId: 'r1', busId: 'b1' });

      const [[{ data }]] = prisma.busAllocation.create.mock.calls;
      expect(data.validFrom).toBeInstanceOf(Date);
    });
  });

  // ── deallocate ─────────────────────────────────────────────────
  describe('deallocate', () => {
    it('sets validTo to current date', async () => {
      prisma.busAllocation.findUnique.mockResolvedValue({ id: 'a1', validTo: null });
      prisma.busAllocation.update.mockResolvedValue({ id: 'a1' });

      await transportService.deallocate('a1');

      const [[{ data }]] = prisma.busAllocation.update.mock.calls;
      expect(data.validTo).toBeInstanceOf(Date);
    });

    it('throws 404 when allocation not found', async () => {
      prisma.busAllocation.findUnique.mockResolvedValue(null);
      await expect(transportService.deallocate('x')).rejects.toThrow(
        new AppError('Allocation not found', 404)
      );
    });

    it('throws 400 when already deallocated', async () => {
      prisma.busAllocation.findUnique.mockResolvedValue({
        id: 'a1',
        validTo: new Date('2026-01-01'),
      });
      await expect(transportService.deallocate('a1')).rejects.toThrow(
        new AppError('Allocation already ended', 400)
      );
    });
  });
});
