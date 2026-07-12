import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  InputAdornment, TablePagination,
} from '@mui/material';
import { Add, Visibility, Edit, Delete, Search, Assignment } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { homeworkApi, classApi, sectionApi, subjectApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const TEACHER_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'];

const HomeworkDialog = ({ open, onClose, initial, sections, subjects, teacherId, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm();

  useEffect(() => {
    reset(initial || { title: '', description: '', subjectId: '', sectionId: '', dueDate: '', teacherId });
  }, [initial, open, reset, teacherId]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (initial?.id) await homeworkApi.update(initial.id, data);
      else await homeworkApi.create({ ...data, teacherId });
      toast.success(initial?.id ? 'Homework updated' : 'Homework assigned');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Homework' : 'Assign Homework'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="hw-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth size="small" label="Title" {...register('title', { required: true })} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Description" multiline rows={3} {...register('description')} /></Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="subjectId" control={control} defaultValue="" render={({ field }) => (
                <TextField fullWidth select size="small" label="Subject" {...field}>
                  {subjects.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="sectionId" control={control} defaultValue="" render={({ field }) => (
                <TextField fullWidth select size="small" label="Section" {...field}>
                  {sections.map((s) => <MenuItem key={s.id} value={s.id}>{s.class?.name} — {s.name}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="date" label="Due Date"
                InputLabelProps={{ shrink: true }} {...register('dueDate', { required: true })} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="hw-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : initial?.id ? 'Update' : 'Assign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SubmissionsDialog = ({ open, onClose, homework }) => {
  if (!homework) return null;
  const submissions = homework.submissions || [];
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Submissions — {homework.title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''} of {homework.section?.class?.name} {homework.section?.name}
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Adm. No.</TableCell>
              <TableCell>Submitted</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Marks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.student?.firstName} {s.student?.lastName}</TableCell>
                <TableCell>{s.student?.admissionNumber}</TableCell>
                <TableCell>{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '—'}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}><Typography noWrap variant="caption">{s.content || '—'}</Typography></TableCell>
                <TableCell>
                  <Chip label={s.status} size="small"
                    color={s.status === 'GRADED' ? 'success' : s.status === 'SUBMITTED' ? 'info' : 'default'} />
                </TableCell>
                <TableCell>{s.marks ?? '—'}</TableCell>
              </TableRow>
            ))}
            {!submissions.length && (
              <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" py={2}>No submissions yet</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
};

const HomeworkPage = () => {
  const { user } = useAuth();
  const isTeacher = TEACHER_ROLES.includes(user?.role);

  const [homeworks, setHomeworks] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [sectionFilter, setSectionFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [formDialog, setFormDialog] = useState({ open: false, initial: null });
  const [subDialog, setSubDialog] = useState({ open: false, homework: null });
  const [teacherId, setTeacherId] = useState('');

  useEffect(() => {
    Promise.all([
      sectionApi.getAll({ limit: 200 }),
      subjectApi.getAll({ limit: 200 }),
    ]).then(([s, sub]) => {
      setSections(s.data.data || []);
      setSubjects(sub.data.data || []);
    });
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await homeworkApi.getAll({
        sectionId: sectionFilter || undefined,
        subjectId: subjectFilter || undefined,
        page: page + 1, limit: 20,
      });
      setHomeworks(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load homework'); }
    finally { setLoading(false); }
  }, [sectionFilter, subjectFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleViewSubmissions = async (id) => {
    try {
      const { data } = await homeworkApi.getById(id);
      setSubDialog({ open: true, homework: data.data });
    } catch { toast.error('Failed to load submissions'); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try { await homeworkApi.remove(id); toast.success('Deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const isOverdue = (d) => new Date(d) < new Date();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Homework</Typography>
        {isTeacher && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormDialog({ open: true, initial: null })}>
            Assign Homework
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select size="small" label="Section" value={sectionFilter} onChange={(e) => { setSectionFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Sections</MenuItem>
                {sections.map((s) => <MenuItem key={s.id} value={s.id}>{s.class?.name} — {s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select size="small" label="Subject" value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Subjects</MenuItem>
                {subjects.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        {loading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Submissions</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {homeworks.map((h) => (
                  <TableRow key={h.id} hover sx={isOverdue(h.dueDate) ? { bgcolor: 'warning.light' } : {}}>
                    <TableCell fontWeight={600}>{h.title}</TableCell>
                    <TableCell>{h.subject?.name}</TableCell>
                    <TableCell>{h.section?.class?.name} — {h.section?.name}</TableCell>
                    <TableCell>{h.teacher?.firstName} {h.teacher?.lastName}</TableCell>
                    <TableCell>
                      {new Date(h.dueDate).toLocaleDateString()}
                      {isOverdue(h.dueDate) && <Chip label="Overdue" size="small" color="error" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>
                      <Chip label={h._count?.submissions || 0} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewSubmissions(h.id)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      {isTeacher && (
                        <>
                          <IconButton size="small" onClick={() => setFormDialog({ open: true, initial: h })}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDelete(h.id, h.title)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!homeworks.length && <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary" py={3}>No homework found</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
            <TablePagination component="div" count={total} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
          </>
        )}
      </Card>

      <HomeworkDialog open={formDialog.open} initial={formDialog.initial}
        sections={sections} subjects={subjects} teacherId={teacherId}
        onClose={() => setFormDialog({ open: false, initial: null })} onSaved={fetch} />
      <SubmissionsDialog open={subDialog.open} homework={subDialog.homework}
        onClose={() => setSubDialog({ open: false, homework: null })} />
    </Box>
  );
};

export default HomeworkPage;
