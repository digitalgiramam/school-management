import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, Card, CardContent, Typography, TextField, InputAdornment,
  Avatar, Chip, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, IconButton, Tooltip, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, CircularProgress, Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search, Add, Edit, Visibility, PersonOff, FilterList,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { teacherApi, departmentApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

// ── Add/Edit Dialog ────────────────────────────────────────────
const TeacherFormDialog = ({ open, onClose, initial, departments, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    reset(initial || {
      firstName: '', lastName: '', email: '', employeeId: '',
      phone: '', departmentId: '', qualification: '', experience: '',
      gender: '', address: '',
    });
  }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (initial?.id) {
        await teacherApi.update(initial.id, data);
        toast.success('Teacher updated');
      } else {
        await teacherApi.create(data);
        toast.success('Teacher created — default password: School@1234');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="teacher-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" size="small"
                error={!!errors.firstName} helperText={errors.firstName?.message}
                {...register('firstName', { required: 'Required' })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" size="small"
                error={!!errors.lastName} helperText={errors.lastName?.message}
                {...register('lastName', { required: 'Required' })} />
            </Grid>
            {!initial?.id && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" size="small" type="email"
                  error={!!errors.email} helperText={errors.email?.message}
                  {...register('email', { required: 'Required' })} />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Employee ID" size="small"
                error={!!errors.employeeId} helperText={errors.employeeId?.message}
                {...register('employeeId', { required: !initial?.id ? 'Required' : false })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" size="small" {...register('phone')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="departmentId" control={control} defaultValue=""
                render={({ field }) => (
                  <TextField fullWidth select label="Department" size="small" {...field}>
                    <MenuItem value="">None</MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Qualification" size="small" {...register('qualification')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Experience (years)" size="small" type="number"
                {...register('experience')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="gender" control={control} defaultValue=""
                render={({ field }) => (
                  <TextField fullWidth select label="Gender" size="small" {...field}>
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Joining Date" size="small" type="date"
                InputLabelProps={{ shrink: true }} {...register('joiningDate')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" size="small" multiline rows={2}
                {...register('address')} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="teacher-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : initial?.id ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main Page ──────────────────────────────────────────────────
const TeachersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await teacherApi.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        departmentId: deptFilter || undefined,
      });
      setTeachers(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  }, [page, rowsPerPage, search, deptFilter]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    departmentApi.getAll().then(({ data }) => setDepartments(data.data || [])).catch(() => {});
  }, []);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await teacherApi.remove(id);
      toast.success('Teacher deactivated');
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Teachers</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />}
            onClick={() => setDialog({ open: true, initial: null })}>
            Add Teacher
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth size="small" placeholder="Search name, ID, email…"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                select fullWidth size="small" label="Department" value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Teacher</TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Sections</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : teachers.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={t.user?.profilePhoto} sx={{ width: 34, height: 34, bgcolor: 'secondary.main' }}>
                      {t.firstName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {t.firstName} {t.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{t.user?.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{t.employeeId}</TableCell>
                <TableCell>{t.department?.name || '—'}</TableCell>
                <TableCell>{t.qualification || '—'}</TableCell>
                <TableCell>
                  <Chip label={`${t._count?.sections || 0} sections`} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={t.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={t.isActive ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Profile">
                    <IconButton size="small" onClick={() => navigate(`/teachers/${t.id}`)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {isAdmin && (
                    <>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setDialog({ open: true, initial: t })}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Deactivate">
                        <IconButton size="small" color="error"
                          onClick={() => handleDeactivate(t.id, `${t.firstName} ${t.lastName}`)}>
                          <PersonOff fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!loading && !teachers.length && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" py={3}>No teachers found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Card>

      <TeacherFormDialog
        open={dialog.open}
        initial={dialog.initial}
        departments={departments}
        onClose={() => setDialog({ open: false, initial: null })}
        onSaved={fetchTeachers}
      />
    </Box>
  );
};

export default TeachersPage;
