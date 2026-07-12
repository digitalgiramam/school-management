import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar, Button,
  Tab, Tabs, Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Divider, LinearProgress,
} from '@mui/material';
import { ArrowBack, Edit, School, Home, DirectionsBus, Hotel } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { studentApi } from '../../api/axios';
import toast from 'react-hot-toast';

const TabPanel = ({ value, index, children }) =>
  value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', py: 0.75 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
  </Box>
);

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    studentApi.getById(id)
      .then(({ data }) => setStudent(data.data || data))
      .catch(() => { toast.error('Student not found'); navigate('/students'); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 1) {
      const now = new Date();
      studentApi.attendanceSummary(id, { month: now.getMonth() + 1, year: now.getFullYear() })
        .then(({ data }) => setAttendance(data.data || data))
        .catch(() => {});
    }
  }, [tab, id]);

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;
  if (!student) return null;

  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/students')}>Back</Button>
        <Typography variant="h5" fontWeight={700}>Student Profile</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar src={student.user?.profilePhoto}
                sx={{ width: 96, height: 96, fontSize: 32, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                {initials}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{fullName}</Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>{student.user?.email}</Typography>
              <Chip label={student.isActive ? 'Active' : 'Inactive'}
                color={student.isActive ? 'success' : 'default'} size="small" sx={{ mb: 2 }} />

              <Divider sx={{ my: 2 }} />
              <InfoRow label="Admission No." value={student.admissionNumber} />
              <InfoRow label="Roll No." value={student.rollNumber} />
              <InfoRow label="Class" value={student.section ? `${student.section.class?.name} — ${student.section.name}` : null} />
              <InfoRow label="Gender" value={student.gender} />
              <InfoRow label="Date of Birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : null} />
              <InfoRow label="Blood Group" value={student.bloodGroup} />
              <InfoRow label="Phone" value={student.phone} />
              <InfoRow label="Category" value={student.category} />
              <InfoRow label="Joined" value={student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : null} />
            </CardContent>
          </Card>

          {/* Parent Card */}
          {student.parent && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Parent / Guardian</Typography>
                <InfoRow label="Name" value={`${student.parent.firstName} ${student.parent.lastName}`} />
                <InfoRow label="Phone" value={student.parent.phone} />
                <InfoRow label="Email" value={student.parent.email} />
                <InfoRow label="Occupation" value={student.parent.occupation} />
              </CardContent>
            </Card>
          )}

          {/* Transport */}
          {student.busAllocations?.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <DirectionsBus fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={700}>Transport</Typography>
                </Box>
                {student.busAllocations.map(a => (
                  <Box key={a.id}>
                    <InfoRow label="Bus" value={a.bus?.busNumber} />
                    <InfoRow label="Route" value={a.route?.name} />
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Hostel */}
          {student.hostelAllocation && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Hotel fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={700}>Hostel</Typography>
                </Box>
                <InfoRow label="Hostel" value={student.hostelAllocation.room?.hostel?.name} />
                <InfoRow label="Room" value={student.hostelAllocation.room?.roomNo} />
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Tabs */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                <Tab label="Overview" />
                <Tab label="Attendance" />
                <Tab label="Documents" />
              </Tabs>
            </Box>
            <CardContent>
              {/* Overview */}
              <TabPanel value={tab} index={0}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Address</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>{student.address || '—'}</Typography>

                {student.medicalInfo && (
                  <>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Medical Information</Typography>
                    <Grid container spacing={1}>
                      {student.medicalInfo.allergies && (
                        <Grid item xs={12}>
                          <Typography variant="body2"><strong>Allergies:</strong> {student.medicalInfo.allergies}</Typography>
                        </Grid>
                      )}
                      {student.medicalInfo.conditions && (
                        <Grid item xs={12}>
                          <Typography variant="body2"><strong>Conditions:</strong> {student.medicalInfo.conditions}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Academic Path</Typography>
                <InfoRow label="Academic Year" value={student.section?.class?.academicYear?.name} />
                <InfoRow label="Previous School" value={student.previousSchool} />
              </TabPanel>

              {/* Attendance */}
              <TabPanel value={tab} index={1}>
                {!attendance ? (
                  <Box textAlign="center" py={4}><CircularProgress size={28} /></Box>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} mb={2}>This Month's Attendance</Typography>
                    <Grid container spacing={2} mb={3}>
                      {[
                        { label: 'Present', value: attendance.PRESENT, color: 'success.main' },
                        { label: 'Absent', value: attendance.ABSENT, color: 'error.main' },
                        { label: 'Late', value: attendance.LATE, color: 'warning.main' },
                        { label: 'Total Days', value: attendance.total, color: 'text.primary' },
                      ].map(s => (
                        <Grid item xs={6} sm={3} key={s.label}>
                          <Card variant="outlined">
                            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                              <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 100 }}>
                        {attendance.percentage?.toFixed(1)}%
                      </Typography>
                      <LinearProgress variant="determinate" value={attendance.percentage || 0}
                        color={attendance.percentage >= 75 ? 'success' : 'error'}
                        sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                    </Box>
                  </Box>
                )}
              </TabPanel>

              {/* Documents */}
              <TabPanel value={tab} index={2}>
                {student.documents?.length ? (
                  <Table size="small">
                    <TableHead><TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Uploaded</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {student.documents.map(d => (
                        <TableRow key={d.id} hover>
                          <TableCell>{d.name}</TableCell>
                          <TableCell><Chip label={d.type} size="small" /></TableCell>
                          <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="text.secondary" textAlign="center" py={4}>No documents uploaded</Typography>
                )}
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDetailPage;
