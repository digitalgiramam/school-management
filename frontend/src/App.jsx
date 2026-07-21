import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Students
import StudentsPage from './pages/students/StudentsPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import AddStudentPage from './pages/students/AddStudentPage';

// Teachers
import TeachersPage from './pages/teachers/TeachersPage';
import TeacherDetailPage from './pages/teachers/TeacherDetailPage';

// Classes
import ClassesPage from './pages/classes/ClassesPage';
import ClassSubjectsPage from './pages/classsubjects/ClassSubjectsPage';

// Attendance
import AttendancePage from './pages/attendance/AttendancePage';

// Exams
import ExamsPage from './pages/exams/ExamsPage';
import MarksEntryPage from './pages/exams/MarksEntryPage';
import ReportCardPage from './pages/exams/ReportCardPage';

// Fees
import FeesPage from './pages/fees/FeesPage';
import FeeInvoicesPage from './pages/fees/FeeInvoicesPage';

// Library
import LibraryPage from './pages/library/LibraryPage';

// Timetable
import TimetablePage from './pages/timetable/TimetablePage';

// Transport
import TransportPage from './pages/transport/TransportPage';

// Hostel
import HostelPage from './pages/hostel/HostelPage';

// Payroll
import PayrollPage from './pages/payroll/PayrollPage';

// Parents
import ParentsPage from './pages/parents/ParentsPage';

// Homework
import HomeworkPage from './pages/homework/HomeworkPage';

// Leave
import LeavePage from './pages/leave/LeavePage';

// Announcements
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';

// Notifications
import NotificationsPage from './pages/notifications/NotificationsPage';

// Reports
import ReportsPage from './pages/reports/ReportsPage';

// Settings
import SettingsPage from './pages/settings/SettingsPage';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        <Route path="students" element={<StudentsPage />} />
        <Route path="students/new" element={<AddStudentPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />

        <Route path="teachers" element={<TeachersPage />} />
        <Route path="teachers/:id" element={<TeacherDetailPage />} />

        <Route path="classes" element={<ClassesPage />} />
        <Route path="class-subjects" element={<ClassSubjectsPage />} />
        <Route path="parents" element={<ParentsPage />} />
        <Route path="attendance" element={<AttendancePage />} />

        <Route path="exams" element={<ExamsPage />} />
        <Route path="exams/:id/marks" element={<MarksEntryPage />} />
        <Route path="exams/report-card" element={<ReportCardPage />} />

        <Route path="fees" element={<FeesPage />} />
        <Route path="fees/invoices" element={<FeeInvoicesPage />} />

        <Route path="library" element={<LibraryPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="transport" element={<TransportPage />} />
        <Route path="hostel" element={<HostelPage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="leave" element={<LeavePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
