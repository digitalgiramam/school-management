import React, { useEffect, useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, Typography, Avatar, Chip,
  Tab, Tabs, Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Divider, IconButton, Tooltip,
} from '@mui/material';
import { ArrowBack, Email, Phone, LocationOn, School, Work } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherApi } from '../../api/axios';
import toast from 'react-hot-toast';

const TabPanel = ({ children, value, index }) =>
  value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TeacherDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      teacherApi.getById(id),
      teacherApi.getAttendance(id, {}),
    ])
      .then(([t, a]) => {
        setTeacher(t.data.data);
        setAttendance(a.data.data);
      })
      .catch(() => toast.error('Failed to load teacher'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;
  if (!teacher) return <Typography>Teacher not found</Typography>;

  const fullName = `${teacher.firstName} ${teacher.lastName}`;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBack /></IconButton>
        <Typography variant="h5" fontWeight={700}>Teacher Profile</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left — Profile card */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', pt: 4, pb: 3 }}>
              <Avatar
                src={teacher.user?.profilePhoto}
                sx={{ width: 90, height: 90, mx: 'auto', mb: 2, bgcolor: 'secondary.main', fontSize: 32 }}
              >
                {teacher.firstName[0]}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{fullName}</Typography>
              <Chip
                label={teacher.isActive ? 'Active' : 'Inactive'}
                size="small"
                color={teacher.isActive ? 'success' : 'default'}
                sx={{ mt: 0.5, mb: 2 }}
              />
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ textAlign: 'left', '& > *': { mb: 1.5 } }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{teacher.user?.email}</Typography>
                </Box>
                {teacher.phone && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Phone fontSize="small" color="action" />
                    <Typography variant="body2">{teacher.phone}</Typography>
                  </Box>
                )}
                {teacher.address && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">{teacher.address}</Typography>
                  </Box>
                )}
                {teacher.department && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <School fontSize="small" color="action" />
                    <Typography variant="body2">{teacher.department.name}</Typography>
                  </Box>
                )}
                {teacher.qualification && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Work fontSize="small" color="action" />
                    <Typography variant="body2">{teacher.qualification}
                      {teacher.experience && ` · ${teacher.experience} yrs`}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Stats */}
          <Grid container spacing={1} sx={{ mt: 0 }}>
            {[
              { label: 'Sections', value: teacher._count?.sections || 0, color: 'primary' },
              { label: 'Subjects', value: teacher._count?.subjects || 0, color: 'secondary' },
              { label: 'Homeworks', value: teacher._count?.homeworks || 0, color: 'info' },
            ].map((s) => (
              <Grid item xs={4} key={s.label}>
                <Card sx={{ textAlign: 'center', py: 1.5 }}>
                  <Typography variant="h6" fontWeight={700} color={`${s.color}.main`}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Right — Tabs */}
        <Grid item xs={12} md={9}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
                <Tab label="Subjects" sx={{ textTransform: 'none' }} />
                <Tab label="Class Sections" sx={{ textTransform: 'none' }} />
                <Tab label="Attendance" sx={{ textTransform: 'none' }} />
                <Tab label="Salary History" sx={{ textTransform: 'none' }} />
                <Tab label="Leaves" sx={{ textTransform: 'none' }} />
              </Tabs>
            </Box>
            <CardContent>
              {/* Subjects */}
              <TabPanel value={tab} index={0}>
                {teacher.subjects?.length ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Code</TableCell>
                        <TableCell>Section</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teacher.subjects.map((ts) => (
                        <TableRow key={ts.id} hover>
                          <TableCell>{ts.subject?.name}</TableCell>
                          <TableCell>{ts.subject?.code}</TableCell>
                          <TableCell>
                            {ts.section
                              ? `${ts.section.class?.name} - ${ts.section.name}`
                              : 'All sections'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography color="text.secondary" textAlign="center" py={3}>
                    No subjects assigned
                  </Typography>
                )}
              </TabPanel>

              {/* Sections as class teacher */}
              <TabPanel value={tab} index={1}>
                {teacher.sections?.length ? (
                  <Grid container spacing={2}>
                    {teacher.sections.map((s) => (
                      <Grid item xs={12} sm={4} key={s.id}>
                        <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight={700}>
                            {s.class?.name} — {s.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Class Teacher</Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary" textAlign="center" py={3}>
                    Not assigned as class teacher
                  </Typography>
                )}
              </TabPanel>

              {/* Attendance */}
              <TabPanel value={tab} index={2}>
                {attendance && (
                  <>
                    <Grid container spacing={2} mb={3}>
                      {[
                        { label: 'Present', value: attendance.present, color: 'success' },
                        { label: 'Absent', value: attendance.absent, color: 'error' },
                        { label: 'Late', value: attendance.late, color: 'warning' },
                        { label: 'Total Days', value: attendance.total, color: 'primary' },
                      ].map((s) => (
                        <Grid item xs={6} sm={3} key={s.label}>
                          <Card variant="outlined" sx={{ textAlign: 'center', py: 1.5 }}>
                            <Typography variant="h5" fontWeight={700} color={`${s.color}.main`}>
                              {s.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Check In</TableCell>
                          <TableCell>Check Out</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendance.records?.slice(0, 20).map((r) => (
                          <TableRow key={r.id} hover>
                            <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Chip
                                label={r.status}
                                size="small"
                                color={r.status === 'PRESENT' ? 'success' : r.status === 'ABSENT' ? 'error' : 'warning'}
                              />
                            </TableCell>
                            <TableCell>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : '—'}</TableCell>
                            <TableCell>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </TabPanel>

              {/* Salary */}
              <TabPanel value={tab} index={3}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell>Basic</TableCell>
                      <TableCell>Allowances</TableCell>
                      <TableCell>Deductions</TableCell>
                      <TableCell>Net</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teacher.salaries?.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell>{MONTHS[s.month - 1]} {s.year}</TableCell>
                        <TableCell>₹{s.basicSalary?.toLocaleString()}</TableCell>
                        <TableCell>₹{s.allowances?.toLocaleString()}</TableCell>
                        <TableCell>₹{s.deductions?.toLocaleString()}</TableCell>
                        <TableCell fontWeight={600}>₹{s.netSalary?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={s.isPaid ? 'Paid' : 'Pending'}
                            size="small"
                            color={s.isPaid ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!teacher.salaries?.length && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="text.secondary" py={2}>No salary records</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabPanel>

              {/* Leaves */}
              <TabPanel value={tab} index={4}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teacher.leaves?.map((l) => (
                      <TableRow key={l.id} hover>
                        <TableCell>{l.type}</TableCell>
                        <TableCell>{new Date(l.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(l.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>{l.reason}</TableCell>
                        <TableCell>
                          <Chip
                            label={l.status}
                            size="small"
                            color={l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'error' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!teacher.leaves?.length && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="text.secondary" py={2}>No leave records</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDetailPage;
