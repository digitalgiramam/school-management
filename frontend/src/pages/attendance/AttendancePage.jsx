import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress,
  ToggleButton, ToggleButtonGroup, Avatar,
} from '@mui/material';
import { Save, CheckCircle, Cancel, Schedule } from '@mui/icons-material';
import { attendanceApi, sectionApi, classApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'P', color: 'success' },
  { value: 'ABSENT', label: 'A', color: 'error' },
  { value: 'LATE', label: 'L', color: 'warning' },
  { value: 'EXCUSED', label: 'E', color: 'info' },
];

const today = () => new Date().toISOString().slice(0, 10);

const AttendancePage = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [date, setDate] = useState(today());
  const [records, setRecords] = useState([]); // { student, status }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([classApi.getAll({ limit: 200 }), sectionApi.getAll({ limit: 200 })])
      .then(([c, s]) => { setClasses(c.data.data || []); setSections(s.data.data || []); });
  }, []);

  const filteredSections = sections.filter(s => !classFilter || s.classId === classFilter);

  const loadAttendance = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const { data } = await attendanceApi.getBySection(sectionId, date);
      const list = data.data || data;
      // list should have students with their attendance status
      setRecords(list.map(r => ({
        studentId: r.studentId || r.student?.id,
        name: r.student ? `${r.student.firstName} ${r.student.lastName}` : r.name,
        admissionNo: r.student?.admissionNumber || r.admissionNumber,
        photo: r.student?.user?.profilePhoto,
        status: r.status || 'PRESENT',
      })));
      setLoaded(true);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  }, [sectionId, date]);

  useEffect(() => { setLoaded(false); }, [sectionId, date]);

  const updateStatus = (studentId, status) => {
    setRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  };

  const markAll = (status) => setRecords(prev => prev.map(r => ({ ...r, status })));

  const handleSave = async () => {
    if (!records.length) return;
    setSaving(true);
    try {
      await attendanceApi.markBulk({
        sectionId, date,
        attendance: records.map(r => ({ studentId: r.studentId, status: r.status })),
      });
      toast.success('Attendance saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const summary = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Attendance</Typography>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField fullWidth select size="small" label="Class" value={classFilter}
                onChange={(e) => { setClassFilter(e.target.value); setSectionId(''); }}>
                <MenuItem value="">Select Class</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth select size="small" label="Section" value={sectionId}
                onChange={(e) => setSectionId(e.target.value)} disabled={!classFilter}>
                <MenuItem value="">Select Section</MenuItem>
                {filteredSections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth size="small" type="date" label="Date"
                InputLabelProps={{ shrink: true }} value={date}
                onChange={(e) => setDate(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button fullWidth variant="contained" onClick={loadAttendance}
                disabled={!sectionId || loading}>
                {loading ? 'Loading…' : 'Load Students'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loaded && (
        <>
          {/* Summary + Bulk Actions */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {STATUS_OPTIONS.map(s => (
                    <Chip key={s.value} label={`${s.label}: ${summary[s.value] || 0}`}
                      color={s.color} size="small" />
                  ))}
                  <Chip label={`Total: ${records.length}`} size="small" variant="outlined" />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>Mark all:</Typography>
                  {STATUS_OPTIONS.map(s => (
                    <Button key={s.value} size="small" variant="outlined" color={s.color}
                      onClick={() => markAll(s.value)}>{s.label}</Button>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Adm. No.</TableCell>
                  <TableCell>Attendance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((r, idx) => (
                  <TableRow key={r.studentId} hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={r.photo} sx={{ width: 28, height: 28, fontSize: 11 }}>
                          {r.name?.[0]}
                        </Avatar>
                        {r.name}
                      </Box>
                    </TableCell>
                    <TableCell>{r.admissionNo}</TableCell>
                    <TableCell>
                      <ToggleButtonGroup value={r.status} exclusive size="small"
                        onChange={(_, v) => v && updateStatus(r.studentId, v)}>
                        {STATUS_OPTIONS.map(s => (
                          <ToggleButton key={s.value} value={s.value}
                            sx={{
                              px: 1.5, py: 0.25, fontSize: 12,
                              '&.Mui-selected': {
                                bgcolor: `${s.color}.main`, color: 'white',
                                '&:hover': { bgcolor: `${s.color}.dark` },
                              },
                            }}>
                            {s.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Attendance'}
              </Button>
            </Box>
          </Card>
        </>
      )}

      {!loaded && !loading && (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center" py={6}>
              Select a class, section, and date to load students
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AttendancePage;
