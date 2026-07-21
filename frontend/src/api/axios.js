import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    console.error('[API] Request setup error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: refresh on 401, log errors
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status   = error.response?.status;
    const reqId    = error.response?.headers?.['x-request-id'];

    if (status === 401 && !original._retry && original.url !== '/auth/refresh-token') {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/v1/auth/refresh-token', { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    const method  = original?.method?.toUpperCase() || '?';
    const url     = original?.url || '?';
    const message = error.response?.data?.message || error.message;

    if (status >= 500 || !error.response) {
      console.error(`[API] ${method} ${url} => ${status ?? 'NETWORK'}`, { requestId: reqId, message });
    } else if (status >= 400) {
      console.warn(`[API] ${method} ${url} => ${status}`, { requestId: reqId, message });
    }

    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const studentApi = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  deactivate: (id) => api.delete(`/students/${id}`),
  promote: (id, data) => api.post(`/students/${id}/promote`, data),
  attendanceSummary: (id, params) => api.get(`/students/${id}/attendance-summary`, { params }),
  uploadPhoto: (id, file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/students/${id}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const teacherApi = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  assignSubjects: (id, subjectIds) => api.put(`/teachers/${id}/subjects`, { subjectIds }),
  getAttendance: (id, params) => api.get(`/teachers/${id}/attendance`, { params }),
  remove: (id) => api.delete(`/teachers/${id}`),
  uploadPhoto: (id, file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/teachers/${id}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const departmentApi = {
  getAll: (params) => api.get('/departments', { params }),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  remove: (id) => api.delete(`/departments/${id}`),
};

export const classApi = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  remove: (id) => api.delete(`/classes/${id}`),
};

export const sectionApi = {
  getAll: (params) => api.get('/sections', { params }),
  getById: (id) => api.get(`/sections/${id}`),
  create: (data) => api.post('/sections', data),
  update: (id, data) => api.put(`/sections/${id}`, data),
  remove: (id) => api.delete(`/sections/${id}`),
};

export const subjectApi = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  remove: (id) => api.delete(`/subjects/${id}`),
};

export const timetableApi = {
  getBySection: (sectionId, academicYearId) => api.get('/timetables', { params: { sectionId, academicYearId } }),
  upsert: (data) => api.post('/timetables', data),
  addSlot: (timetableId, data) => api.post(`/timetables/${timetableId}/slots`, data),
  updateSlot: (slotId, data) => api.put(`/timetables/slots/${slotId}`, data),
  deleteSlot: (slotId) => api.delete(`/timetables/slots/${slotId}`),
};

export const transportApi = {
  getBuses: (params) => api.get('/transport/buses', { params }),
  createBus: (data) => api.post('/transport/buses', data),
  updateBus: (id, data) => api.put(`/transport/buses/${id}`, data),
  getRoutes: (params) => api.get('/transport/routes', { params }),
  createRoute: (data) => api.post('/transport/routes', data),
  updateRoute: (id, data) => api.put(`/transport/routes/${id}`, data),
  deleteRoute: (id) => api.delete(`/transport/routes/${id}`),
  allocate: (data) => api.post('/transport/allocate', data),
  getAllocations: (params) => api.get('/transport/allocations', { params }),
};

export const hostelApi = {
  getAll: (params) => api.get('/hostel', { params }),
  create: (data) => api.post('/hostel', data),
  update: (id, data) => api.put(`/hostel/${id}`, data),
  getRooms: (hostelId) => api.get(`/hostel/${hostelId}/rooms`),
  addRoom: (hostelId, data) => api.post(`/hostel/${hostelId}/rooms`, data),
  allocate: (data) => api.post('/hostel/allocate', data),
  getAllocations: (params) => api.get('/hostel/allocations', { params }),
};

export const payrollApi = {
  getAll: (params) => api.get('/payroll', { params }),
  generate: (data) => api.post('/payroll/generate', data),
  markPaid: (id) => api.patch(`/payroll/${id}/pay`),
  getSummary: (params) => api.get('/payroll/summary', { params }),
};

export const leaveApi = {
  getAll: (params) => api.get('/leaves', { params }),
  apply: (data) => api.post('/leaves', data),
  approve: (id, data) => api.patch(`/leaves/${id}/approve`, data),
  getMyLeaves: (params) => api.get('/leaves/my', { params }),
};

export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export const announcementApi = {
  getAll: (params) => api.get('/announcements', { params }),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  remove: (id) => api.delete(`/announcements/${id}`),
};

export const reportApi = {
  getStudentReport: (params) => api.get('/reports/students', { params }),
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
  getFeeReport: (params) => api.get('/reports/fees', { params }),
  getExamReport: (params) => api.get('/reports/exams', { params }),
  getPayrollReport: (params) => api.get('/reports/payroll', { params }),
};

export const holidayApi = {
  getAll: (params) => api.get('/holidays', { params }),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  remove: (id) => api.delete(`/holidays/${id}`),
};

export const attendanceApi = {
  getMySections: () => api.get('/attendance/my-sections'),
  getBySection: (sectionId, date) => api.get('/attendance', { params: { sectionId, date } }),
  markBulk: (data) => api.post('/attendance/bulk', data),
  getStudentAttendance: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
};

export const examApi = {
  getAll: (params) => api.get('/exams', { params }),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  remove: (id) => api.delete(`/exams/${id}`),
  saveBulkMarks: (examSubjectId, data) => api.post(`/exams/${examSubjectId}/marks`, data),
  getReportCard: (studentId, examId) => api.get('/exams/report-card', { params: { studentId, examId } }),
  getRankList: (params) => api.get('/exams/rank-list', { params }),
};

export const feeApi = {
  getStructures: (params) => api.get('/fees/structures', { params }),
  createStructure: (data) => api.post('/fees/structures', data),
  updateStructure: (id, data) => api.put(`/fees/structures/${id}`, data),
  deleteStructure: (id) => api.delete(`/fees/structures/${id}`),
  getInvoices: (params) => api.get('/fees/invoices', { params }),
  getInvoiceById: (id) => api.get(`/fees/invoices/${id}`),
  createInvoice: (data) => api.post('/fees/invoices', data),
  recordPayment: (invoiceId, data) => api.post(`/fees/invoices/${invoiceId}/payment`, data),
  getCollectionReport: (params) => api.get('/fees/collection-report', { params }),
  getPendingFees: (params) => api.get('/fees/pending', { params }),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getAttendanceTrend: (days) => api.get('/dashboard/attendance-trend', { params: { days } }),
  getFeeCollectionTrend: (months) => api.get('/dashboard/fee-trend', { params: { months } }),
};

export const libraryApi = {
  getBooks: (params) => api.get('/library/books', { params }),
  createBook: (data) => api.post('/library/books', data),
  updateBook: (id, data) => api.put(`/library/books/${id}`, data),
  deleteBook: (id) => api.delete(`/library/books/${id}`),
  issueBook: (data) => api.post('/library/issue', data),
  returnBook: (issueId) => api.post(`/library/return/${issueId}`),
  getActiveIssues: (params) => api.get('/library/issues', { params }),
};

export const homeworkApi = {
  getAll: (params) => api.get('/homework', { params }),
  getById: (id) => api.get(`/homework/${id}`),
  create: (data) => api.post('/homework', data),
  update: (id, data) => api.put(`/homework/${id}`, data),
  remove: (id) => api.delete(`/homework/${id}`),
  submit: (homeworkId, data) => api.post(`/homework/${homeworkId}/submit`, data),
  grade: (homeworkId, submissionId, data) => api.patch(`/homework/${homeworkId}/submissions/${submissionId}/grade`, data),
};

export const classSubjectApi = {
  getByClass: (classId) => api.get('/class-subjects', { params: { classId } }),
  assign: (classId, subjectId) => api.post('/class-subjects', { classId, subjectId }),
  remove: (classId, subjectId) => api.delete('/class-subjects', { data: { classId, subjectId } }),
};

export const settingsApi = {
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data) => api.put('/settings/profile', data),
  updateProfilePhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.post('/settings/profile/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  changePassword: (data) => api.post('/settings/change-password', data),
  getSchoolSettings: () => api.get('/settings/school'),
  updateSchoolSettings: (data) => api.put('/settings/school', data),
  getGradeSettings: () => api.get('/settings/grades'),
  upsertGrade: (data) => api.post('/settings/grades', data),
  deleteGrade: (id) => api.delete(`/settings/grades/${id}`),
  getAcademicYears: () => api.get('/settings/academic-years'),
  createAcademicYear: (data) => api.post('/settings/academic-years', data),
  setCurrentAcademicYear: (id) => api.patch(`/settings/academic-years/${id}/set-current`),
  deleteAcademicYear: (id) => api.delete(`/settings/academic-years/${id}`),
  getBranches: () => api.get('/settings/branches'),
  upsertBranch: (data) => api.post('/settings/branches', data),
  deleteBranch: (id) => api.delete(`/settings/branches/${id}`),
};
