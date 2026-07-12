/**
 * Comprehensive Seed — Academic Year 2025-2026
 * Run: node prisma/seed.js
 * Password for all accounts: Admin@1234
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for 2025-2026...\n');

  const PASSWORD = await bcrypt.hash('Admin@1234', 12);

  // ── ACADEMIC YEAR ─────────────────────────────────────────────
  const ay = await prisma.academicYear.upsert({
    where: { name: '2025-2026' },
    update: { isCurrent: true },
    create: { name: '2025-2026', startDate: new Date('2025-06-01'), endDate: new Date('2026-04-30'), isCurrent: true },
  });
  console.log('✓ Academic year 2025-2026');

  // ── BRANCH ────────────────────────────────────────────────────
  const branch = await prisma.branch.upsert({
    where: { id: 'branch-main' },
    update: {},
    create: {
      id: 'branch-main',
      name: 'Main Campus',
      address: '123 School Road, T. Nagar, Chennai - 600017',
      phone: '+91 44 2345 6789',
      email: 'main@springdaleschool.com',
    },
  });
  console.log('✓ Branch');

  // ── DEPARTMENTS ───────────────────────────────────────────────
  const depts = {};
  for (const [key, name] of Object.entries({
    science: 'Science & Technology',
    maths: 'Mathematics',
    humanities: 'Humanities',
    cs: 'Computer Science',
  })) {
    depts[key] = await prisma.department.upsert({
      where: { id: `dept-${key}` },
      update: {},
      create: { id: `dept-${key}`, name },
    });
  }
  console.log('✓ 4 departments');

  // ── CLASSES (Grade 6 – 10) ────────────────────────────────────
  const classes = {};
  for (const grade of [6, 7, 8, 9, 10]) {
    classes[grade] = await prisma.class.upsert({
      where: { name_academicYearId_branchId: { name: `Grade ${grade}`, academicYearId: ay.id, branchId: branch.id } },
      update: {},
      create: { name: `Grade ${grade}`, academicYearId: ay.id, branchId: branch.id },
    });
  }

  // ── SECTIONS (A & B per class) ────────────────────────────────
  const sections = {};
  for (const grade of [6, 7, 8, 9, 10]) {
    sections[grade] = {};
    for (const sec of ['A', 'B']) {
      sections[grade][sec] = await prisma.section.upsert({
        where: { name_classId: { name: sec, classId: classes[grade].id } },
        update: {},
        create: { name: sec, classId: classes[grade].id, capacity: 40 },
      });
    }
  }
  console.log('✓ 5 classes, 10 sections');

  // ── SUBJECTS ──────────────────────────────────────────────────
  const subjectList = [
    { code: 'MATH6',  name: 'Mathematics',     dept: 'maths',      grade: 6  },
    { code: 'ENG6',   name: 'English',          dept: 'humanities', grade: 6  },
    { code: 'SCI6',   name: 'Science',          dept: 'science',    grade: 6  },
    { code: 'SST6',   name: 'Social Studies',   dept: 'humanities', grade: 6  },
    { code: 'CS6',    name: 'Computer Science', dept: 'cs',         grade: 6  },
    { code: 'MATH7',  name: 'Mathematics',      dept: 'maths',      grade: 7  },
    { code: 'ENG7',   name: 'English',          dept: 'humanities', grade: 7  },
    { code: 'SCI7',   name: 'Science',          dept: 'science',    grade: 7  },
    { code: 'SST7',   name: 'Social Studies',   dept: 'humanities', grade: 7  },
    { code: 'CS7',    name: 'Computer Science', dept: 'cs',         grade: 7  },
    { code: 'MATH8',  name: 'Mathematics',      dept: 'maths',      grade: 8  },
    { code: 'ENG8',   name: 'English',          dept: 'humanities', grade: 8  },
    { code: 'SCI8',   name: 'Science',          dept: 'science',    grade: 8  },
    { code: 'SST8',   name: 'Social Studies',   dept: 'humanities', grade: 8  },
    { code: 'CS8',    name: 'Computer Science', dept: 'cs',         grade: 8  },
    { code: 'MATH9',  name: 'Mathematics',      dept: 'maths',      grade: 9  },
    { code: 'ENG9',   name: 'English',          dept: 'humanities', grade: 9  },
    { code: 'PHY9',   name: 'Physics',          dept: 'science',    grade: 9  },
    { code: 'CHEM9',  name: 'Chemistry',        dept: 'science',    grade: 9  },
    { code: 'CS9',    name: 'Computer Science', dept: 'cs',         grade: 9  },
    { code: 'MATH10', name: 'Mathematics',      dept: 'maths',      grade: 10 },
    { code: 'ENG10',  name: 'English',          dept: 'humanities', grade: 10 },
    { code: 'PHY10',  name: 'Physics',          dept: 'science',    grade: 10 },
    { code: 'CHEM10', name: 'Chemistry',        dept: 'science',    grade: 10 },
    { code: 'CS10',   name: 'Computer Science', dept: 'cs',         grade: 10 },
  ];
  const subjects = {};
  for (const s of subjectList) {
    subjects[s.code] = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: { code: s.code, name: s.name, departmentId: depts[s.dept].id, totalMark: 100, passMark: 40 },
    });
  }
  console.log(`✓ ${subjectList.length} subjects`);

  // ── GRADE SETTINGS ────────────────────────────────────────────
  const gradeSettingDefs = [
    { id: 'gs-A+', grade: 'A+', minMark: 90, maxMark: 100, gradePoint: 10.0 },
    { id: 'gs-A',  grade: 'A',  minMark: 80, maxMark: 89,  gradePoint: 9.0  },
    { id: 'gs-B+', grade: 'B+', minMark: 70, maxMark: 79,  gradePoint: 8.0  },
    { id: 'gs-B',  grade: 'B',  minMark: 60, maxMark: 69,  gradePoint: 7.0  },
    { id: 'gs-C',  grade: 'C',  minMark: 50, maxMark: 59,  gradePoint: 6.0  },
    { id: 'gs-D',  grade: 'D',  minMark: 40, maxMark: 49,  gradePoint: 5.0  },
    { id: 'gs-F',  grade: 'F',  minMark: 0,  maxMark: 39,  gradePoint: 0.0  },
  ];
  for (const g of gradeSettingDefs) {
    await prisma.gradeSetting.upsert({ where: { id: g.id }, update: {}, create: g });
  }
  console.log('✓ Grade settings');

  // ── ADMIN USERS ───────────────────────────────────────────────
  const superUser = await prisma.user.upsert({
    where: { email: 'super@school.com' },
    update: {},
    create: { email: 'super@school.com', password: PASSWORD, role: 'SUPER_ADMIN', isActive: true, isEmailVerified: true },
  });
  await prisma.user.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: { email: 'admin@school.com', password: PASSWORD, role: 'SCHOOL_ADMIN', isActive: true, isEmailVerified: true },
  });
  await prisma.user.upsert({
    where: { email: 'principal@school.com' },
    update: {},
    create: { email: 'principal@school.com', password: PASSWORD, role: 'PRINCIPAL', isActive: true, isEmailVerified: true },
  });
  console.log('✓ Admin users');

  // ── TEACHERS ─────────────────────────────────────────────────
  const teacherDefs = [
    { email: 'teacher1@school.com', empId: 'EMP001', first: 'Rajesh',  last: 'Kumar',    dept: 'science',    gender: 'MALE',   qual: 'M.Sc Physics',      exp: 8  },
    { email: 'teacher2@school.com', empId: 'EMP002', first: 'Priya',   last: 'Patel',    dept: 'maths',      gender: 'FEMALE', qual: 'M.Sc Mathematics',   exp: 6  },
    { email: 'teacher3@school.com', empId: 'EMP003', first: 'Anita',   last: 'Singh',    dept: 'humanities', gender: 'FEMALE', qual: 'M.A. English',       exp: 10 },
    { email: 'teacher4@school.com', empId: 'EMP004', first: 'Suresh',  last: 'Mehta',    dept: 'humanities', gender: 'MALE',   qual: 'M.A. History',       exp: 5  },
    { email: 'teacher5@school.com', empId: 'EMP005', first: 'Kavita',  last: 'Reddy',    dept: 'cs',         gender: 'FEMALE', qual: 'M.Tech CS',          exp: 7  },
    { email: 'teacher6@school.com', empId: 'EMP006', first: 'Mohan',   last: 'Das',      dept: 'maths',      gender: 'MALE',   qual: 'M.Sc Mathematics',   exp: 12 },
    { email: 'teacher7@school.com', empId: 'EMP007', first: 'Deepa',   last: 'Nair',     dept: 'science',    gender: 'FEMALE', qual: 'M.Sc Chemistry',     exp: 4  },
  ];

  const teachers = {};
  for (const td of teacherDefs) {
    const u = await prisma.user.upsert({
      where: { email: td.email },
      update: {},
      create: { email: td.email, password: PASSWORD, role: 'TEACHER', isActive: true, isEmailVerified: true },
    });
    teachers[td.empId] = await prisma.teacher.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        employeeId: td.empId,
        firstName: td.first,
        lastName: td.last,
        gender: td.gender,
        departmentId: depts[td.dept].id,
        qualification: td.qual,
        experience: td.exp,
        joiningDate: new Date('2020-06-01'),
      },
    });
  }

  // Assign class teachers
  const classTeacherAssignments = [
    [10, 'A', 'EMP001'], [10, 'B', 'EMP002'],
    [9,  'A', 'EMP003'], [9,  'B', 'EMP004'],
    [8,  'A', 'EMP005'], [8,  'B', 'EMP006'],
    [7,  'A', 'EMP007'],
  ];
  for (const [grade, sec, empId] of classTeacherAssignments) {
    await prisma.section.update({
      where: { id: sections[grade][sec].id },
      data: { teacherId: teachers[empId].id },
    });
  }
  console.log(`✓ ${teacherDefs.length} teachers`);

  // ── STAFF ─────────────────────────────────────────────────────
  const staffDefs = [
    { email: 'accountant@school.com', empId: 'STF001', first: 'Ramesh', last: 'Gupta',    role: 'ACCOUNTANT', sysRole: 'ACCOUNTANT', basic: 30000 },
    { email: 'librarian@school.com',  empId: 'STF002', first: 'Leela',  last: 'Krishnan', role: 'LIBRARIAN',  sysRole: 'LIBRARIAN',  basic: 28000 },
  ];
  const staffMembers = {};
  for (const sd of staffDefs) {
    const u = await prisma.user.upsert({
      where: { email: sd.email },
      update: {},
      create: { email: sd.email, password: PASSWORD, role: sd.sysRole, isActive: true, isEmailVerified: true },
    });
    staffMembers[sd.empId] = await prisma.staff.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        employeeId: sd.empId,
        firstName: sd.first,
        lastName: sd.last,
        role: sd.role,
        branchId: branch.id,
        joiningDate: new Date('2021-06-01'),
      },
    });
  }
  console.log('✓ Staff (accountant, librarian)');

  // ── PARENTS ───────────────────────────────────────────────────
  const parentDefs = [
    { email: 'parent1@school.com',  first: 'Suresh',  last: 'Sharma',   phone: '+91 98001 00001', occ: 'Engineer',         rel: 'Father' },
    { email: 'parent2@school.com',  first: 'Meena',   last: 'Gupta',    phone: '+91 98001 00002', occ: 'Doctor',           rel: 'Mother' },
    { email: 'parent3@school.com',  first: 'Arjun',   last: 'Verma',    phone: '+91 98001 00003', occ: 'Teacher',          rel: 'Father' },
    { email: 'parent4@school.com',  first: 'Sunita',  last: 'Rao',      phone: '+91 98001 00004', occ: 'Homemaker',        rel: 'Mother' },
    { email: 'parent5@school.com',  first: 'Vikram',  last: 'Patel',    phone: '+91 98001 00005', occ: 'Businessman',      rel: 'Father' },
    { email: 'parent6@school.com',  first: 'Rekha',   last: 'Mehta',    phone: '+91 98001 00006', occ: 'Nurse',            rel: 'Mother' },
    { email: 'parent7@school.com',  first: 'Dinesh',  last: 'Kumar',    phone: '+91 98001 00007', occ: 'Accountant',       rel: 'Father' },
    { email: 'parent8@school.com',  first: 'Kavitha', last: 'Nair',     phone: '+91 98001 00008', occ: 'Lawyer',           rel: 'Mother' },
    { email: 'parent9@school.com',  first: 'Ramesh',  last: 'Pillai',   phone: '+91 98001 00009', occ: 'Farmer',           rel: 'Father' },
    { email: 'parent10@school.com', first: 'Anitha',  last: 'Das',      phone: '+91 98001 00010', occ: 'Pharmacist',       rel: 'Mother' },
  ];
  const parents = [];
  for (const pd of parentDefs) {
    const u = await prisma.user.upsert({
      where: { email: pd.email },
      update: {},
      create: { email: pd.email, password: PASSWORD, role: 'PARENT', isActive: true, isEmailVerified: true },
    });
    const p = await prisma.parent.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, firstName: pd.first, lastName: pd.last, phone: pd.phone, occupation: pd.occ, relationship: pd.rel },
    });
    parents.push(p);
  }
  console.log(`✓ ${parents.length} parents`);

  // ── STUDENTS ──────────────────────────────────────────────────
  const studentDefs = [
    // Grade 10A (5 students)
    { email: 'student1@school.com',  admNo: 'ADM2025001', roll: '01', first: 'Arjun',   last: 'Sharma',  dob: '2010-03-15', gender: 'MALE',   blood: 'O_POSITIVE',  grade: 10, sec: 'A', pi: 0 },
    { email: 'student2@school.com',  admNo: 'ADM2025002', roll: '02', first: 'Priya',   last: 'Gupta',   dob: '2010-07-22', gender: 'FEMALE', blood: 'A_POSITIVE',  grade: 10, sec: 'A', pi: 1 },
    { email: 'student3@school.com',  admNo: 'ADM2025003', roll: '03', first: 'Rahul',   last: 'Verma',   dob: '2010-01-10', gender: 'MALE',   blood: 'B_POSITIVE',  grade: 10, sec: 'A', pi: 2 },
    { email: 'student4@school.com',  admNo: 'ADM2025004', roll: '04', first: 'Sneha',   last: 'Rao',     dob: '2010-09-05', gender: 'FEMALE', blood: 'AB_POSITIVE', grade: 10, sec: 'A', pi: 3 },
    { email: 'student5@school.com',  admNo: 'ADM2025005', roll: '05', first: 'Karan',   last: 'Patel',   dob: '2010-12-20', gender: 'MALE',   blood: 'O_NEGATIVE',  grade: 10, sec: 'A', pi: 4 },
    // Grade 10B (4 students)
    { email: 'student6@school.com',  admNo: 'ADM2025006', roll: '01', first: 'Ananya',  last: 'Mehta',   dob: '2010-04-18', gender: 'FEMALE', blood: 'A_NEGATIVE',  grade: 10, sec: 'B', pi: 5 },
    { email: 'student7@school.com',  admNo: 'ADM2025007', roll: '02', first: 'Rohit',   last: 'Kumar',   dob: '2010-06-30', gender: 'MALE',   blood: 'B_NEGATIVE',  grade: 10, sec: 'B', pi: 6 },
    { email: 'student8@school.com',  admNo: 'ADM2025008', roll: '03', first: 'Divya',   last: 'Nair',    dob: '2010-11-12', gender: 'FEMALE', blood: 'O_POSITIVE',  grade: 10, sec: 'B', pi: 7 },
    { email: 'student9@school.com',  admNo: 'ADM2025009', roll: '04', first: 'Aditya',  last: 'Pillai',  dob: '2010-02-28', gender: 'MALE',   blood: 'A_POSITIVE',  grade: 10, sec: 'B', pi: 8 },
    // Grade 9A (4 students)
    { email: 'student10@school.com', admNo: 'ADM2025010', roll: '01', first: 'Lakshmi', last: 'Das',     dob: '2011-05-14', gender: 'FEMALE', blood: 'B_POSITIVE',  grade: 9,  sec: 'A', pi: 9 },
    { email: 'student11@school.com', admNo: 'ADM2025011', roll: '02', first: 'Vikram',  last: 'Sharma',  dob: '2011-08-22', gender: 'MALE',   blood: 'AB_POSITIVE', grade: 9,  sec: 'A', pi: 0 },
    { email: 'student12@school.com', admNo: 'ADM2025012', roll: '03', first: 'Pooja',   last: 'Singh',   dob: '2011-03-17', gender: 'FEMALE', blood: 'O_POSITIVE',  grade: 9,  sec: 'A', pi: 1 },
    { email: 'student13@school.com', admNo: 'ADM2025013', roll: '04', first: 'Nikhil',  last: 'Reddy',   dob: '2011-10-09', gender: 'MALE',   blood: 'A_NEGATIVE',  grade: 9,  sec: 'A', pi: 2 },
    // Grade 9B (3 students)
    { email: 'student14@school.com', admNo: 'ADM2025014', roll: '01', first: 'Ishaan',  last: 'Gupta',   dob: '2011-01-25', gender: 'MALE',   blood: 'B_POSITIVE',  grade: 9,  sec: 'B', pi: 3 },
    { email: 'student15@school.com', admNo: 'ADM2025015', roll: '02', first: 'Riya',    last: 'Patel',   dob: '2011-07-11', gender: 'FEMALE', blood: 'O_NEGATIVE',  grade: 9,  sec: 'B', pi: 4 },
    { email: 'student16@school.com', admNo: 'ADM2025016', roll: '03', first: 'Aarav',   last: 'Mehta',   dob: '2011-12-03', gender: 'MALE',   blood: 'A_POSITIVE',  grade: 9,  sec: 'B', pi: 5 },
    // Grade 8A (4 students)
    { email: 'student17@school.com', admNo: 'ADM2025017', roll: '01', first: 'Sanya',   last: 'Kumar',   dob: '2012-02-19', gender: 'FEMALE', blood: 'AB_NEGATIVE', grade: 8,  sec: 'A', pi: 6 },
    { email: 'student18@school.com', admNo: 'ADM2025018', roll: '02', first: 'Dev',     last: 'Nair',    dob: '2012-06-08', gender: 'MALE',   blood: 'B_POSITIVE',  grade: 8,  sec: 'A', pi: 7 },
    { email: 'student19@school.com', admNo: 'ADM2025019', roll: '03', first: 'Tanya',   last: 'Pillai',  dob: '2012-09-27', gender: 'FEMALE', blood: 'O_POSITIVE',  grade: 8,  sec: 'A', pi: 8 },
    { email: 'student20@school.com', admNo: 'ADM2025020', roll: '04', first: 'Kartik',  last: 'Das',     dob: '2012-04-14', gender: 'MALE',   blood: 'A_POSITIVE',  grade: 8,  sec: 'A', pi: 9 },
    // Grade 8B (2 students)
    { email: 'student21@school.com', admNo: 'ADM2025021', roll: '01', first: 'Nisha',   last: 'Verma',   dob: '2012-11-30', gender: 'FEMALE', blood: 'B_NEGATIVE',  grade: 8,  sec: 'B', pi: 0 },
    { email: 'student22@school.com', admNo: 'ADM2025022', roll: '02', first: 'Aryan',   last: 'Rao',     dob: '2012-07-16', gender: 'MALE',   blood: 'O_POSITIVE',  grade: 8,  sec: 'B', pi: 1 },
    // Grade 7A (2 students)
    { email: 'student23@school.com', admNo: 'ADM2025023', roll: '01', first: 'Meera',   last: 'Sharma',  dob: '2013-03-22', gender: 'FEMALE', blood: 'A_POSITIVE',  grade: 7,  sec: 'A', pi: 2 },
    { email: 'student24@school.com', admNo: 'ADM2025024', roll: '02', first: 'Rohan',   last: 'Patel',   dob: '2013-08-05', gender: 'MALE',   blood: 'AB_POSITIVE', grade: 7,  sec: 'A', pi: 3 },
    // Grade 6A (2 students)
    { email: 'student25@school.com', admNo: 'ADM2025025', roll: '01', first: 'Sara',    last: 'Gupta',   dob: '2014-01-18', gender: 'FEMALE', blood: 'O_NEGATIVE',  grade: 6,  sec: 'A', pi: 4 },
    { email: 'student26@school.com', admNo: 'ADM2025026', roll: '02', first: 'Nitin',   last: 'Kumar',   dob: '2014-05-30', gender: 'MALE',   blood: 'B_POSITIVE',  grade: 6,  sec: 'A', pi: 5 },
  ];

  const students = [];
  const studentUserIds = {};
  for (const sd of studentDefs) {
    const u = await prisma.user.upsert({
      where: { email: sd.email },
      update: {},
      create: { email: sd.email, password: PASSWORD, role: 'STUDENT', isActive: true, isEmailVerified: true },
    });
    const s = await prisma.student.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        admissionNumber: sd.admNo,
        rollNumber: sd.roll,
        firstName: sd.first,
        lastName: sd.last,
        dateOfBirth: new Date(sd.dob),
        gender: sd.gender,
        bloodGroup: sd.blood,
        sectionId: sections[sd.grade][sd.sec].id,
        parentId: parents[sd.pi].id,
        admissionDate: new Date('2025-06-01'),
        isActive: true,
      },
    });
    students.push({ ...s, grade: sd.grade, sec: sd.sec, userId: u.id });
    studentUserIds[s.id] = u.id;
  }
  console.log(`✓ ${students.length} students`);

  // ── ATTENDANCE — last 21 working days ────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const workDays = [];
  const cursor = new Date(today);
  while (workDays.length < 21) {
    cursor.setDate(cursor.getDate() - 1);
    if (cursor.getDay() !== 0) workDays.push(new Date(cursor));
  }

  for (const day of workDays) {
    for (const s of students) {
      const r = Math.random();
      const status = r < 0.88 ? 'PRESENT' : r < 0.96 ? 'ABSENT' : 'LATE';
      await prisma.attendance.upsert({
        where: { studentId_date: { studentId: s.id, date: day } },
        update: {},
        create: { studentId: s.id, sectionId: sections[s.grade][s.sec].id, date: day, status, markedBy: teachers['EMP001'].id },
      }).catch(() => {});
    }
  }
  console.log('✓ Attendance (21 days × 26 students)');

  // ── FEE CATEGORIES ────────────────────────────────────────────
  const feeCats = {};
  for (const [name, desc] of [
    ['Tuition Fee', 'Annual tuition charges'],
    ['Examination Fee', 'Term examination charges'],
    ['Sports Fee', 'Annual sports & activities fee'],
    ['Lab Fee', 'Laboratory usage charges'],
  ]) {
    feeCats[name] = await prisma.feeCategory.upsert({
      where: { name },
      update: {},
      create: { name, description: desc },
    });
  }

  // ── FEE STRUCTURES ────────────────────────────────────────────
  const tuitionByGrade = { 6: 28000, 7: 30000, 8: 33000, 9: 36000, 10: 40000 };
  for (const grade of [6, 7, 8, 9, 10]) {
    await prisma.feeStructure.upsert({
      where: { classId_feeCategoryId_academicYearId: { classId: classes[grade].id, feeCategoryId: feeCats['Tuition Fee'].id, academicYearId: ay.id } },
      update: {},
      create: { classId: classes[grade].id, feeCategoryId: feeCats['Tuition Fee'].id, academicYearId: ay.id, amount: tuitionByGrade[grade], frequency: 'ANNUALLY', dueDate: new Date('2025-07-31') },
    });
    await prisma.feeStructure.upsert({
      where: { classId_feeCategoryId_academicYearId: { classId: classes[grade].id, feeCategoryId: feeCats['Examination Fee'].id, academicYearId: ay.id } },
      update: {},
      create: { classId: classes[grade].id, feeCategoryId: feeCats['Examination Fee'].id, academicYearId: ay.id, amount: 2500, frequency: 'ANNUALLY' },
    });
  }
  console.log('✓ Fee structures');

  // ── FEE INVOICES + PAYMENTS ───────────────────────────────────
  // Spread payments across last 6 months for trend chart
  const paidCount = 18, partialCount = 4;
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const amount = tuitionByGrade[s.grade];
    const isPaid = i < paidCount;
    const isPartial = !isPaid && i < paidCount + partialCount;
    const status = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'UNPAID';

    const inv = await prisma.feeInvoice.create({
      data: {
        studentId: s.id,
        amount,
        discount: 0,
        fine: 0,
        totalAmount: amount,
        dueDate: new Date('2025-07-31'),
        status,
        description: `Annual Tuition Fee 2025-2026`,
      },
    });

    if (isPaid) {
      // Spread over 6 months for trend
      const monthsAgo = Math.floor(i / 3);
      const paidAt = new Date(today);
      paidAt.setMonth(paidAt.getMonth() - monthsAgo);
      paidAt.setDate(5 + (i % 20));
      await prisma.payment.create({
        data: {
          invoiceId: inv.id,
          amount,
          method: ['CASH', 'ONLINE', 'CHEQUE', 'ONLINE', 'ONLINE'][i % 5],
          paidAt,
          transactionId: `TXN${paidAt.getFullYear()}${String(paidAt.getMonth() + 1).padStart(2,'0')}${String(i + 1).padStart(4,'0')}`,
        },
      });
    } else if (isPartial) {
      await prisma.payment.create({
        data: {
          invoiceId: inv.id,
          amount: Math.floor(amount / 2),
          method: 'ONLINE',
          paidAt: new Date(),
        },
      });
    }
  }
  console.log('✓ Fee invoices and payments (6-month trend data)');

  // ── EXAM TYPES ────────────────────────────────────────────────
  const midTermType = await prisma.examType.upsert({
    where: { id: 'extype-midterm' },
    update: {},
    create: { id: 'extype-midterm', name: 'Mid-Term Exam', academicYearId: ay.id, weightage: 40 },
  });
  const finalType = await prisma.examType.upsert({
    where: { id: 'extype-final' },
    update: {},
    create: { id: 'extype-final', name: 'Annual Exam', academicYearId: ay.id, weightage: 60 },
  });

  // ── MID-TERM EXAM (completed, with marks for Grade 10A) ───────
  const midExam = await prisma.exam.upsert({
    where: { id: 'exam-mid-2025' },
    update: {},
    create: {
      id: 'exam-mid-2025',
      name: 'Mid-Term Examination Sep 2025',
      examTypeId: midTermType.id,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-10'),
      status: 'COMPLETED',
      description: 'First mid-term assessment for all grades',
    },
  });

  const midExamSubjectCodes = ['MATH10', 'ENG10', 'PHY10', 'CHEM10'];
  const examSubjectRecords = [];
  for (let idx = 0; idx < midExamSubjectCodes.length; idx++) {
    const code = midExamSubjectCodes[idx];
    const es = await prisma.examSubject.upsert({
      where: { examId_subjectId_sectionId: { examId: midExam.id, subjectId: subjects[code].id, sectionId: sections[10]['A'].id } },
      update: {},
      create: {
        examId: midExam.id,
        subjectId: subjects[code].id,
        sectionId: sections[10]['A'].id,
        date: new Date(`2025-09-0${idx + 2}`),
        startTime: '09:00',
        endTime: '12:00',
        maxMark: 100,
        passMark: 40,
      },
    });
    examSubjectRecords.push(es);
  }

  const grade10AStudents = students.filter(s => s.grade === 10 && s.sec === 'A');
  const baseScores = [88, 74, 92, 66, 79];
  for (const es of examSubjectRecords) {
    for (let i = 0; i < grade10AStudents.length; i++) {
      const base = baseScores[i] || 70;
      const score = Math.max(35, Math.min(100, base + Math.floor(Math.random() * 8) - 4));
      const gs = gradeSettingDefs.find(g => score >= g.minMark && score <= g.maxMark);
      await prisma.mark.upsert({
        where: { studentId_examSubjectId: { studentId: grade10AStudents[i].id, examSubjectId: es.id } },
        update: {},
        create: {
          studentId: grade10AStudents[i].id,
          examSubjectId: es.id,
          marksObtained: score,
          grade: gs ? gs.grade : 'F',
          gradePoint: gs ? gs.gradePoint : 0,
          isAbsent: false,
        },
      });
    }
  }
  console.log('✓ Mid-term exam with marks (Grade 10A)');

  // ── UPCOMING FINAL EXAM ───────────────────────────────────────
  await prisma.exam.upsert({
    where: { id: 'exam-final-2026' },
    update: {},
    create: {
      id: 'exam-final-2026',
      name: 'Annual Final Examination 2026',
      examTypeId: finalType.id,
      startDate: new Date('2026-02-16'),
      endDate: new Date('2026-03-01'),
      status: 'PUBLISHED',
      description: 'Annual examination for all grades (Grade 6-10)',
    },
  });
  console.log('✓ Final exam (upcoming)');

  // ── PAYROLL — last 3 months ───────────────────────────────────
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const teacherBasic = { EMP001: 45000, EMP002: 42000, EMP003: 40000, EMP004: 38000, EMP005: 43000, EMP006: 48000, EMP007: 38000 };

  for (let mo = 0; mo < 3; mo++) {
    let month = currentMonth - mo;
    let year = currentYear;
    if (month <= 0) { month += 12; year--; }

    for (const [empId, basic] of Object.entries(teacherBasic)) {
      const t = teachers[empId];
      if (!t) continue;
      const existing = await prisma.salary.findFirst({ where: { teacherId: t.id, month, year } });
      if (!existing) {
        await prisma.salary.create({ data: {
          teacherId: t.id, employeeType: 'TEACHER', month, year,
          basicSalary: basic, allowances: 5000, deductions: 2000,
          netSalary: basic + 3000,
          isPaid: mo > 0,
          paidAt: mo > 0 ? new Date(year, month - 1, 5) : null,
        }});
      }
    }
    for (const [empId, basic] of [['STF001', 30000], ['STF002', 28000]]) {
      const s = staffMembers[empId];
      if (!s) continue;
      const existing = await prisma.salary.findFirst({ where: { staffId: s.id, month, year } });
      if (!existing) {
        await prisma.salary.create({ data: {
          staffId: s.id, employeeType: 'STAFF', month, year,
          basicSalary: basic, allowances: 3000, deductions: 1500,
          netSalary: basic + 1500,
          isPaid: mo > 0,
          paidAt: mo > 0 ? new Date(year, month - 1, 5) : null,
        }});
      }
    }
  }
  console.log('✓ Payroll (3 months)');

  // ── LIBRARY ───────────────────────────────────────────────────
  const libCats = {};
  for (const name of ['Science', 'Mathematics', 'Literature', 'Reference', 'Computer Science']) {
    libCats[name] = await prisma.bookCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const bookDefs = [
    { isbn: '9781234560001', title: 'Concepts of Physics Vol. 1',        cat: 'Science',          publisher: 'Bharati Bhawan', copies: 15 },
    { isbn: '9781234560002', title: 'Concepts of Physics Vol. 2',        cat: 'Science',          publisher: 'Bharati Bhawan', copies: 12 },
    { isbn: '9781234560003', title: 'NCERT Mathematics — Class 10',      cat: 'Mathematics',      publisher: 'NCERT',          copies: 25 },
    { isbn: '9781234560004', title: 'NCERT Mathematics — Class 9',       cat: 'Mathematics',      publisher: 'NCERT',          copies: 25 },
    { isbn: '9781234560005', title: 'Organic Chemistry — Morrison & Boyd',cat: 'Science',          publisher: 'Prentice Hall',  copies: 8  },
    { isbn: '9781234560006', title: 'Wings of Fire — A.P.J. Abdul Kalam',cat: 'Literature',       publisher: 'Universities Press', copies: 10 },
    { isbn: '9781234560007', title: 'The Alchemist',                     cat: 'Literature',       publisher: 'HarperCollins',  copies: 8  },
    { isbn: '9781234560008', title: 'Britannica Encyclopedia Vol. 1',    cat: 'Reference',        publisher: 'Britannica',     copies: 3  },
    { isbn: '9781234560009', title: 'NCERT Chemistry — Class 12',        cat: 'Science',          publisher: 'NCERT',          copies: 20 },
    { isbn: '9781234560010', title: 'Introduction to Algorithms (CLRS)', cat: 'Computer Science', publisher: 'MIT Press',      copies: 6  },
    { isbn: '9781234560011', title: 'Python Programming for Beginners',  cat: 'Computer Science', publisher: 'O\'Reilly',      copies: 10 },
    { isbn: '9781234560012', title: 'Mathematics — R.D. Sharma Class 10',cat: 'Mathematics',      publisher: 'Dhanpat Rai',    copies: 20 },
  ];

  const books = [];
  for (const bd of bookDefs) {
    const b = await prisma.book.upsert({
      where: { isbn: bd.isbn },
      update: {},
      create: {
        title: bd.title,
        isbn: bd.isbn,
        publisher: bd.publisher,
        totalCopies: bd.copies,
        available: bd.copies - 2,
        status: 'AVAILABLE',
        categoryId: libCats[bd.cat].id,
      },
    });
    books.push(b);
  }

  // Issue books — borrowerId is the student's userId
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  for (let i = 0; i < 6 && i < students.length; i++) {
    await prisma.bookIssue.create({
      data: {
        bookId: books[i % books.length].id,
        borrowerId: students[i].userId,
        dueDate,
      },
    }).catch(() => {});
  }
  console.log(`✓ ${books.length} books, 6 active issues`);

  // ── TRANSPORT ─────────────────────────────────────────────────
  const driver1 = await prisma.driver.upsert({
    where: { licenseNo: 'TN01 2022 0001' },
    update: {},
    create: { name: 'Muthu Raja', phone: '+91 98765 00001', licenseNo: 'TN01 2022 0001' },
  });
  const driver2 = await prisma.driver.upsert({
    where: { licenseNo: 'TN01 2022 0002' },
    update: {},
    create: { name: 'Selvam Krishnan', phone: '+91 98765 00002', licenseNo: 'TN01 2022 0002' },
  });

  const bus1 = await prisma.bus.upsert({
    where: { busNumber: 'BUS-001' },
    update: {},
    create: { busNumber: 'BUS-001', registrationNo: 'TN01AB1234', capacity: 45, driverId: driver1.id },
  });
  const bus2 = await prisma.bus.upsert({
    where: { busNumber: 'BUS-002' },
    update: {},
    create: { busNumber: 'BUS-002', registrationNo: 'TN01AB5678', capacity: 45, driverId: driver2.id },
  });

  const route1 = await prisma.route.upsert({
    where: { id: 'route-north' },
    update: {},
    create: {
      id: 'route-north',
      name: 'North Route — Anna Nagar',
      busId: bus1.id,
      startPoint: 'Anna Nagar Tower',
      endPoint: 'School Main Gate',
      distance: 12.5,
      monthlyFee: 1500,
      stops: { create: [
        { name: 'Anna Nagar Tower',   order: 1, time: '07:00' },
        { name: 'Koyambedu Bus Stand', order: 2, time: '07:15' },
        { name: 'CMBT',               order: 3, time: '07:25' },
        { name: 'School Main Gate',   order: 4, time: '07:45' },
      ]},
    },
  });

  const route2 = await prisma.route.upsert({
    where: { id: 'route-south' },
    update: {},
    create: {
      id: 'route-south',
      name: 'South Route — Adyar',
      busId: bus2.id,
      startPoint: 'Adyar Signal',
      endPoint: 'School Main Gate',
      distance: 15.0,
      monthlyFee: 1800,
      stops: { create: [
        { name: 'Adyar Signal',     order: 1, time: '07:10' },
        { name: 'Thiruvanmiyur',    order: 2, time: '07:20' },
        { name: 'Velachery',        order: 3, time: '07:35' },
        { name: 'School Main Gate', order: 4, time: '07:50' },
      ]},
    },
  });

  for (let i = 0; i < 5 && i < students.length; i++) {
    await prisma.busAllocation.create({
      data: {
        studentId: students[i].id,
        routeId: i < 3 ? route1.id : route2.id,
        busId: i < 3 ? bus1.id : bus2.id,
        validFrom: new Date('2025-06-01'),
      },
    }).catch(() => {});
  }
  console.log('✓ Transport (2 buses, 2 routes, 5 allocations)');

  // ── HOSTEL ────────────────────────────────────────────────────
  const hostel = await prisma.hostel.upsert({
    where: { id: 'hostel-boys-a' },
    update: {},
    create: { id: 'hostel-boys-a', name: 'Boys Hostel — Block A', type: 'BOYS', address: 'School Campus, North Wing', capacity: 60 },
  });

  const rooms = [];
  for (let floor = 1; floor <= 3; floor++) {
    for (let rm = 1; rm <= 4; rm++) {
      const roomNo = `${floor}0${rm}`;
      const room = await prisma.hostelRoom.upsert({
        where: { hostelId_roomNo: { hostelId: hostel.id, roomNo } },
        update: {},
        create: { hostelId: hostel.id, roomNo, floor, capacity: 4, type: 'SHARED' },
      });
      rooms.push(room);
    }
  }

  const maleStudents = students.filter(s => s.gender === 'MALE').slice(0, 4);
  for (let i = 0; i < maleStudents.length; i++) {
    await prisma.hostelAllocation.upsert({
      where: { studentId: maleStudents[i].id },
      update: {},
      create: { studentId: maleStudents[i].id, roomId: rooms[i].id, joinDate: new Date('2025-06-01') },
    });
  }
  console.log('✓ Hostel (12 rooms, 4 students allocated)');

  // ── ANNOUNCEMENTS ─────────────────────────────────────────────
  const announcementDefs = [
    { title: 'Mid-Term Results Published', content: 'Mid-term examination results for Grade 6-10 are now available in the student portal. Parents are requested to review and sign the report card.', targetRole: 'STUDENT' },
    { title: 'Annual Sports Day — 15 Jan 2026', content: 'Annual Sports Day will be held on January 15, 2026. All students are encouraged to register for at least one event. Registration deadline: December 31.', targetRole: null },
    { title: 'Fee Payment Reminder', content: 'Annual tuition fee for 2025-2026 is due by July 31. Students with outstanding dues may contact the accounts office. Late payment attracts ₹100/day fine.', targetRole: 'PARENT' },
    { title: 'Winter Break: Dec 24 – Jan 2', content: 'School will remain closed from December 24, 2025 to January 2, 2026 for winter break. Classes resume on January 3, 2026.', targetRole: null },
    { title: 'New Library Books Available', content: 'The library has received 50 new books across Science, Mathematics and Literature sections. Students may borrow up to 2 books for 14 days.', targetRole: 'STUDENT' },
  ];
  for (const ad of announcementDefs) {
    await prisma.announcement.create({
      data: {
        title: ad.title,
        content: ad.content,
        targetRole: ad.targetRole,
        publishedBy: superUser.id,
        publishedAt: new Date(),
      },
    });
  }
  console.log('✓ 5 announcements');

  // ── HOLIDAYS ─────────────────────────────────────────────────
  const holidayDefs = [
    { id: 'hol-indep',    name: 'Independence Day',       date: new Date('2025-08-15'), description: 'National holiday' },
    { id: 'hol-gandhi',   name: 'Gandhi Jayanti',         date: new Date('2025-10-02'), description: 'National holiday' },
    { id: 'hol-diwali',   name: 'Diwali',                 date: new Date('2025-10-20'), description: 'Festival of Lights' },
    { id: 'hol-xmas',     name: 'Christmas',              date: new Date('2025-12-25'), description: 'Festival' },
    { id: 'hol-pongal',   name: 'Pongal',                 date: new Date('2026-01-14'), description: 'Harvest festival' },
    { id: 'hol-republic', name: 'Republic Day',           date: new Date('2026-01-26'), description: 'National holiday' },
    { id: 'hol-holi',     name: 'Holi',                   date: new Date('2026-03-03'), description: 'Festival of Colours' },
  ];
  for (const h of holidayDefs) {
    await prisma.holiday.upsert({
      where: { id: h.id },
      update: {},
      create: { id: h.id, name: h.name, date: h.date, description: h.description, isPublic: true },
    });
  }
  console.log('✓ 7 holidays');

  // ── HOMEWORK ─────────────────────────────────────────────────
  const hwDue = new Date(today);
  hwDue.setDate(hwDue.getDate() + 4);
  const hw = await prisma.homework.create({
    data: {
      title: 'Chapter 5 – Laws of Motion: Numericals',
      description: 'Solve all exercise numericals from Chapter 5. Show full working. Submit in the portal.',
      subjectId: subjects['PHY10'].id,
      sectionId: sections[10]['A'].id,
      teacherId: teachers['EMP001'].id,
      dueDate: hwDue,
      attachments: [],
    },
  });
  // 3 submissions
  for (let i = 0; i < 3 && i < grade10AStudents.length; i++) {
    await prisma.homeworkSubmission.create({
      data: {
        homeworkId: hw.id,
        studentId: grade10AStudents[i].id,
        content: 'Completed all problems. Please check.',
        status: 'SUBMITTED',
      },
    }).catch(() => {});
  }
  console.log('✓ Homework (1 assignment, 3 submissions)');

  // ── LEAVE APPLICATIONS ────────────────────────────────────────
  await prisma.leave.create({
    data: {
      teacherId: teachers['EMP003'].id,
      employeeType: 'TEACHER',
      type: 'SICK',
      startDate: new Date(today.getTime() - 5 * 86400000),
      endDate: new Date(today.getTime() - 3 * 86400000),
      reason: 'Fever — medical certificate attached',
      status: 'APPROVED',
      approvedBy: teachers['EMP001'].id,
    },
  });
  await prisma.leave.create({
    data: {
      teacherId: teachers['EMP005'].id,
      employeeType: 'TEACHER',
      type: 'CASUAL',
      startDate: new Date(today.getTime() + 7 * 86400000),
      endDate: new Date(today.getTime() + 9 * 86400000),
      reason: 'Personal — family function',
      status: 'PENDING',
    },
  });
  await prisma.leave.create({
    data: {
      staffId: staffMembers['STF001'].id,
      employeeType: 'STAFF',
      type: 'ANNUAL',
      startDate: new Date(today.getTime() + 14 * 86400000),
      endDate: new Date(today.getTime() + 18 * 86400000),
      reason: 'Annual vacation',
      status: 'PENDING',
    },
  });
  console.log('✓ Leave applications');

  // ── FINAL SUMMARY ─────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('📊 Data summary:');
  console.log('   Academic Year : 2025-2026 (current)');
  console.log('   Classes       : Grade 6-10 (2 sections each)');
  console.log('   Departments   : 4');
  console.log('   Teachers      : 7');
  console.log('   Staff         : 2 (accountant, librarian)');
  console.log('   Students      : 26');
  console.log('   Parents       : 10');
  console.log('   Attendance    : 21 days');
  console.log('   Invoices      : 26 (18 paid, 4 partial, 4 unpaid)');
  console.log('   Books         : 12 titles, 6 active issues');
  console.log('   Exams         : 1 completed (with marks), 1 upcoming');
  console.log('   Payroll       : 3 months (7 teachers + 2 staff)');
  console.log('   Transport     : 2 buses, 2 routes');
  console.log('   Hostel        : 12 rooms, 4 students');
  console.log('\n📋 Login credentials (password: Admin@1234):');
  console.log('   super@school.com       → SUPER_ADMIN');
  console.log('   admin@school.com       → SCHOOL_ADMIN');
  console.log('   principal@school.com   → PRINCIPAL');
  console.log('   teacher1@school.com    → TEACHER  (Rajesh Kumar — Physics)');
  console.log('   teacher2@school.com    → TEACHER  (Priya Patel — Mathematics)');
  console.log('   student1@school.com    → STUDENT  (Arjun Sharma — Grade 10A)');
  console.log('   parent1@school.com     → PARENT   (Suresh Sharma)');
  console.log('   accountant@school.com  → ACCOUNTANT');
  console.log('   librarian@school.com   → LIBRARIAN');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
