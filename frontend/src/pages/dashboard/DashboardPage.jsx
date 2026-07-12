import React, { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, Avatar, Chip,
  CircularProgress, Divider,
} from '@mui/material';
import {
  People, School, EventAvailable, Payment, Assignment,
  Cake, PersonAdd, Warning,
} from '@mui/icons-material';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { dashboardApi } from '../../api/axios';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" fontWeight={500} mb={0.5}>{title}</Typography>
          <Typography variant="h4" fontWeight={700}>{value ?? '—'}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, width: 48, height: 48 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [feeTrend, setFeeTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, at, ft] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getAttendanceTrend(7),
          dashboardApi.getFeeCollectionTrend(6),
        ]);
        setStats(s.data.data);
        setAttendanceTrend(at.data.data);
        setFeeTrend(ft.data.data);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  const attendanceChartData = {
    labels: attendanceTrend.map((d) => d.date),
    datasets: [
      { label: 'Present', data: attendanceTrend.map((d) => d.present), borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)', fill: true, tension: 0.4 },
      { label: 'Absent', data: attendanceTrend.map((d) => d.absent), borderColor: '#F44336', backgroundColor: 'rgba(244,67,54,0.1)', fill: true, tension: 0.4 },
    ],
  };

  const feeChartData = {
    labels: feeTrend.map((d) => d.month),
    datasets: [
      { label: 'Collection (₹)', data: feeTrend.map((d) => d.amount), backgroundColor: '#1565C0', borderRadius: 6 },
    ],
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Dashboard Overview</Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Students" value={stats?.totalStudents} icon={<People />} color="primary" subtitle="Active enrolments" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Teachers" value={stats?.totalTeachers} icon={<School />} color="success" subtitle="Active staff" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Present Today" value={stats?.presentToday} icon={<EventAvailable />} color="info" subtitle="Student attendance" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Fee Collection" value={`₹${(stats?.feeCollectionToday || 0).toLocaleString()}`} icon={<Payment />} color="warning" subtitle="Today" />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Attendance Trend (Last 7 Days)</Typography>
              <Line data={attendanceChartData} options={chartOptions} height={80} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Fee Collection (6 Months)</Typography>
              <Bar data={feeChartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Upcoming Exams */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Assignment color="primary" />
                <Typography variant="h6">Upcoming Exams</Typography>
              </Box>
              {stats?.upcomingExams?.length ? (
                stats.upcomingExams.map((exam, i) => (
                  <Box key={i} sx={{ mb: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600}>{exam.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(exam.startDate).toLocaleDateString()} • {exam.examType?.name}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary" variant="body2">No upcoming exams</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Admissions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PersonAdd color="success" />
                <Typography variant="h6">Recent Admissions</Typography>
              </Box>
              {stats?.recentAdmissions?.map((s, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark', fontSize: 13 }}>
                    {s.firstName[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(s.admissionDate).toLocaleDateString()}</Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Fees & Birthdays */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Warning color="warning" />
                <Typography variant="h6">Alerts</Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: 'warning.light', borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" fontWeight={600} color="warning.dark">
                  {stats?.pendingFeesCount} Pending Fee Invoices
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Cake color="secondary" />
                <Typography variant="subtitle2">Birthdays Today ({stats?.birthdaysToday?.length})</Typography>
              </Box>
              {stats?.birthdaysToday?.map((s, i) => (
                <Chip key={i} label={`${s.firstName} ${s.lastName}`} size="small" color="secondary" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
              {!stats?.birthdaysToday?.length && (
                <Typography variant="caption" color="text.secondary">No birthdays today</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
