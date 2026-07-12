const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const config = require('../config');
const { AppError } = require('../utils/errors');

// School settings stored as a JSON file (no extra DB table needed)
const SETTINGS_FILE = path.join(__dirname, '..', '..', 'school-settings.json');

const defaultSchoolSettings = {
  name: 'My School',
  tagline: 'Excellence in Education',
  address: '',
  phone: '',
  email: '',
  website: '',
  logo: null,
  currency: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  sessionStartMonth: 6,
  finePerDay: 5,
  maxBooksPerStudent: 3,
  bookReturnDays: 14,
};

const readSchoolSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch {}
  return defaultSchoolSettings;
};

const writeSchoolSettings = (data) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
};

const settingsService = {
  // ── User Profile ──────────────────────────────────────────────
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, role: true, profilePhoto: true,
        lastLoginAt: true, createdAt: true, isEmailVerified: true,
        student: {
          select: {
            id: true, firstName: true, lastName: true, phone: true,
            address: true, dateOfBirth: true, gender: true, bloodGroup: true,
            admissionNumber: true,
            section: { include: { class: { include: { academicYear: true } } } },
          },
        },
        teacher: {
          select: {
            id: true, firstName: true, lastName: true, phone: true,
            address: true, qualification: true, experience: true,
            employeeId: true, gender: true,
            department: { select: { name: true } },
          },
        },
        parent: {
          select: {
            id: true, firstName: true, lastName: true, phone: true,
            occupation: true, relationship: true, address: true,
          },
        },
        staff: {
          select: {
            id: true, firstName: true, lastName: true, phone: true,
            employeeId: true, role: true,
          },
        },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  },

  async updateProfile(userId, role, data) {
    const { firstName, lastName, phone, address, qualification,
            experience, occupation, relationship } = data;

    const updatesByRole = {
      STUDENT: () =>
        prisma.student.update({
          where: { userId },
          data: { firstName, lastName, phone, address },
        }),
      TEACHER: () =>
        prisma.teacher.update({
          where: { userId },
          data: { firstName, lastName, phone, address, qualification, experience: experience ? parseInt(experience) : undefined },
        }),
      PARENT: () =>
        prisma.parent.update({
          where: { userId },
          data: { firstName, lastName, phone, address, occupation, relationship },
        }),
      STAFF: () =>
        prisma.staff.update({
          where: { userId },
          data: { firstName, lastName, phone },
        }),
    };

    if (updatesByRole[role]) {
      await updatesByRole[role]();
    }

    return settingsService.getProfile(userId);
  },

  async updateProfilePhoto(userId, photoUrl) {
    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: photoUrl },
    });
    return { photoUrl };
  },

  // ── Password ──────────────────────────────────────────────────
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new AppError('Current password is incorrect', 400);
    if (currentPassword === newPassword)
      throw new AppError('New password must be different from current password', 400);

    const hashed = await bcrypt.hash(newPassword, config.bcrypt.rounds);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed, passwordChangedAt: new Date() },
    });
  },

  // ── School Settings ───────────────────────────────────────────
  async getSchoolSettings() {
    return readSchoolSettings();
  },

  async updateSchoolSettings(data) {
    const current = readSchoolSettings();
    const updated = { ...current, ...data };
    writeSchoolSettings(updated);
    return updated;
  },

  // ── Grade Settings ────────────────────────────────────────────
  async getGradeSettings() {
    return prisma.gradeSetting.findMany({ orderBy: { minMark: 'desc' } });
  },

  async upsertGrade(data) {
    const { id, grade, minMark, maxMark, gradePoint, description } = data;

    // Validate no overlapping ranges (excluding the record being updated)
    const existing = await prisma.gradeSetting.findMany({
      where: id ? { id: { not: id } } : {},
    });
    const overlap = existing.find(
      (g) => !(maxMark <= g.minMark || minMark >= g.maxMark)
    );
    if (overlap) throw new AppError(`Mark range overlaps with grade ${overlap.grade}`, 400);

    if (id) {
      return prisma.gradeSetting.update({
        where: { id },
        data: { grade, minMark: parseFloat(minMark), maxMark: parseFloat(maxMark), gradePoint: parseFloat(gradePoint), description },
      });
    }
    return prisma.gradeSetting.create({
      data: { grade, minMark: parseFloat(minMark), maxMark: parseFloat(maxMark), gradePoint: parseFloat(gradePoint), description },
    });
  },

  async deleteGrade(id) {
    return prisma.gradeSetting.delete({ where: { id } });
  },

  // ── Academic Years ────────────────────────────────────────────
  async getAcademicYears() {
    return prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } });
  },

  async createAcademicYear(data) {
    return prisma.academicYear.create({ data });
  },

  async setCurrentAcademicYear(id) {
    // Unset all, then set the chosen one
    await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    return prisma.academicYear.update({ where: { id }, data: { isCurrent: true } });
  },

  async deleteAcademicYear(id) {
    const year = await prisma.academicYear.findUnique({
      where: { id },
      include: { _count: { select: { classes: true } } },
    });
    if (!year) throw new AppError('Academic year not found', 404);
    if (year._count.classes > 0)
      throw new AppError('Cannot delete academic year with existing classes', 400);
    if (year.isCurrent)
      throw new AppError('Cannot delete the current academic year', 400);
    return prisma.academicYear.delete({ where: { id } });
  },

  // ── Branches ──────────────────────────────────────────────────
  async getBranches() {
    return prisma.branch.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { classes: true, staff: true } } },
    });
  },

  async upsertBranch(data) {
    const { id, ...rest } = data;
    if (id) return prisma.branch.update({ where: { id }, data: rest });
    return prisma.branch.create({ data: rest });
  },

  async deleteBranch(id) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: { _count: { select: { classes: true } } },
    });
    if (!branch) throw new AppError('Branch not found', 404);
    if (branch._count.classes > 0)
      throw new AppError('Cannot delete branch with existing classes', 400);
    return prisma.branch.delete({ where: { id } });
  },
};

module.exports = settingsService;
