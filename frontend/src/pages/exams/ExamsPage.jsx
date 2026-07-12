import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import { Add, Edit, Assignment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { examApi, subjectApi, settingsApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];
const STATUS_COLOR = { UPCOMING: 'info', ONGOING: 'warning', COMPLETED: 'success', CANCELLED: 'error' };

const ExamDialog = ({ open, onClose, onSaved, subjects, academicYears }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm();
  useEffect(() => { if (open) reset({}); }, [open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      // Build subjects array from form
      const subjectEntries = subjects.slice(0, 10).map((s, i) => ({
        subjectId: s.id,
        maxMark: Number(data[`max_${i}`] || 100),
        passMark: Number(data[`pass_${i}`] || 35),
        examDate: data[`date_${i}`] || null,
        duration: Number(data[`dur_${i}`] || 180),
      })).filter((_, i) => data[`include_${i}`]);

      await examApi.create({
        name: data.name,
        examTypeId: data.examTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        subjects: subjectEntries,
      });
      toast.success('Exam created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Exam</DialogTitle>
      <DialogContent>
        <Box component="form" id="exam-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Exam Name *" {...register('name', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="date" label="Start Date"
                InputLabelProps={{ shrink: true }} {...register('startDate')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="date" label="End Date"
                InputLabelProps={{ shrink: true }} {...register('endDate')} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="exam-form" variant="contained" disabled={saving}>
          {saving ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ExamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await examApi.getAll({ status: statusFilter || undefined });
      setExams(data.data || data);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    Promise.all([subjectApi.getAll({ limit: 200 }), settingsApi.getAcademicYears()])
      .then(([s, ay]) => { setSubjects(s.data.data || []); setAcademicYears(ay.data.data || ay.data); });
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Examinations</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate('/exams/report-card')}>
            Report Cards
          </Button>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
              Create Exam
            </Button>
          )}
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <TextField select size="small" label="Status" value={statusFilter} sx={{ minWidth: 160 }}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">All Status</MenuItem>
            {['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'].map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      <Card>
        {loading ? <Box textAlign="center" py={5}><CircularProgress /></Box> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Exam Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Subjects</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exams.map(e => (
                <TableRow key={e.id} hover>
                  <TableCell fontWeight={600}>{e.name}</TableCell>
                  <TableCell>{e.examType?.name || '—'}</TableCell>
                  <TableCell>{e.startDate ? new Date(e.startDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{e.endDate ? new Date(e.endDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <Chip label={`${e.subjects?.length || 0} subjects`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={e.status || 'UPCOMING'} size="small"
                      color={STATUS_COLOR[e.status] || 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    {e.subjects?.map(es => (
                      <Button key={es.id} size="small" startIcon={<Assignment />}
                        onClick={() => navigate(`/exams/${es.id}/marks`)}>
                        Marks
                      </Button>
                    ))[0]}
                  </TableCell>
                </TableRow>
              ))}
              {!exams.length && (
                <TableRow><TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" py={3}>No exams found</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <ExamDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        subjects={subjects} academicYears={academicYears} onSaved={fetch} />
    </Box>
  );
};

export default ExamsPage;
