import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress,
  Divider, Avatar,
} from '@mui/material';
import { Search, Print } from '@mui/icons-material';
import { examApi, studentApi } from '../../api/axios';
import toast from 'react-hot-toast';

const gradeColor = (g) => {
  if (!g) return 'default';
  if (g.startsWith('A')) return 'success';
  if (g === 'B') return 'info';
  if (g === 'C') return 'warning';
  return 'error';
};

const ReportCardPage = () => {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    examApi.getAll({ status: 'COMPLETED' })
      .then(({ data }) => setExams(data.data || data))
      .catch(() => {});
  }, []);

  const searchStudents = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const { data } = await studentApi.getAll({ search, limit: 10 });
      setStudents(data.students || data.data || []);
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const generateReport = async () => {
    if (!selectedStudent || !selectedExam) {
      toast.error('Select a student and exam'); return;
    }
    setLoading(true);
    try {
      const { data } = await examApi.getReportCard(selectedStudent, selectedExam);
      setReportCard(data.data || data);
    } catch (err) { toast.error(err.response?.data?.message || 'No marks found'); }
    finally { setLoading(false); }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Report Cards</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField fullWidth size="small" placeholder="Search student…"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchStudents()} />
                <Button variant="outlined" onClick={searchStudents} disabled={searching}>
                  <Search />
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth select size="small" label="Student" value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}>
                <MenuItem value="">Select Student</MenuItem>
                {students.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.admissionNumber})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth select size="small" label="Exam" value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}>
                <MenuItem value="">Select Exam</MenuItem>
                {exams.map(e => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button fullWidth variant="contained" onClick={generateReport} disabled={loading}>
                Generate
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && <Box textAlign="center" py={6}><CircularProgress /></Box>}

      {reportCard && !loading && (
        <Card id="report-card-print">
          <CardContent>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
                  {reportCard.student?.firstName?.[0]}{reportCard.student?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {reportCard.student?.firstName} {reportCard.student?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Adm: {reportCard.student?.admissionNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Class: {reportCard.student?.section?.class?.name} — {reportCard.student?.section?.name}
                  </Typography>
                </Box>
              </Box>
              <Button startIcon={<Print />} onClick={() => window.print()}>Print</Button>
            </Box>

            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {reportCard.exam?.name || 'Exam Report'}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* Marks Table */}
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell align="center">Max Marks</TableCell>
                  <TableCell align="center">Obtained</TableCell>
                  <TableCell align="center">%</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell align="center">Grade Points</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reportCard.marks || []).map(m => {
                  const pct = m.examSubject?.maxMark
                    ? ((m.marksObtained / m.examSubject.maxMark) * 100).toFixed(1)
                    : '—';
                  return (
                    <TableRow key={m.id} hover>
                      <TableCell>{m.examSubject?.subject?.name}</TableCell>
                      <TableCell align="center">{m.examSubject?.maxMark}</TableCell>
                      <TableCell align="center">
                        {m.isAbsent ? <Chip label="Absent" size="small" color="error" /> : m.marksObtained}
                      </TableCell>
                      <TableCell align="center">{m.isAbsent ? '—' : `${pct}%`}</TableCell>
                      <TableCell align="center">
                        <Chip label={m.isAbsent ? 'AB' : m.grade} size="small"
                          color={m.isAbsent ? 'default' : gradeColor(m.grade)} />
                      </TableCell>
                      <TableCell align="center">{m.gradePoint?.toFixed(1) || '—'}</TableCell>
                      <TableCell>{m.remarks || '—'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Divider sx={{ my: 2 }} />

            {/* Summary */}
            <Grid container spacing={3}>
              {[
                { label: 'Total Marks', value: `${reportCard.totalMarks || 0} / ${reportCard.maxMarks || 0}` },
                { label: 'Percentage', value: `${(reportCard.percentage || 0).toFixed(2)}%` },
                { label: 'GPA', value: (reportCard.gpa || 0).toFixed(2) },
                { label: 'Result', value: reportCard.result || '—' },
              ].map(s => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReportCardPage;
