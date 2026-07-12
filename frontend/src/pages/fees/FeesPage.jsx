import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { feeApi, classApi, settingsApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'];

const StructureDialog = ({ open, onClose, initial, classes, academicYears, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm();
  useEffect(() => { reset(initial || {}); }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await feeApi.createStructure(data);
      toast.success('Fee structure created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Fee Structure</DialogTitle>
      <DialogContent>
        <Box component="form" id="fee-struct-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <Controller name="academicYearId" control={control} defaultValue="" render={({ field }) => (
                <TextField fullWidth select size="small" label="Academic Year" {...field}>
                  {academicYears.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="classId" control={control} defaultValue="" render={({ field }) => (
                <TextField fullWidth select size="small" label="Class" {...field}>
                  <MenuItem value="">All Classes</MenuItem>
                  {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Fee Category / Name"
                {...register('feeCategoryName', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Amount" type="number"
                {...register('amount', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="frequency" control={control} defaultValue="ANNUAL" render={({ field }) => (
                <TextField fullWidth select size="small" label="Frequency" {...field}>
                  {['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'ONE_TIME'].map(f => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="date" label="Due Date"
                InputLabelProps={{ shrink: true }} {...register('dueDate')} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="fee-struct-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FeesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [ayFilter, setAyFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await feeApi.getStructures(classFilter || undefined, ayFilter || undefined);
      setStructures(data.data || data);
    } catch { toast.error('Failed to load fee structures'); }
    finally { setLoading(false); }
  }, [classFilter, ayFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    Promise.all([classApi.getAll({ limit: 200 }), settingsApi.getAcademicYears()])
      .then(([c, ay]) => { setClasses(c.data.data || []); setAcademicYears(ay.data.data || ay.data); });
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Fee Management</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate('/fees/invoices')}>
            Invoices
          </Button>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
              Add Structure
            </Button>
          )}
        </Box>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth select size="small" label="Academic Year" value={ayFilter}
                onChange={(e) => setAyFilter(e.target.value)}>
                <MenuItem value="">All Years</MenuItem>
                {academicYears.map(y => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth select size="small" label="Class" value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}>
                <MenuItem value="">All Classes</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        {loading ? <Box textAlign="center" py={5}><CircularProgress /></Box> : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Due Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {structures.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell fontWeight={600}>{s.feeCategory?.name || s.feeCategoryName || '—'}</TableCell>
                  <TableCell>{s.class?.name || 'All Classes'}</TableCell>
                  <TableCell>{s.academicYear?.name || '—'}</TableCell>
                  <TableCell>₹{(s.amount || 0).toLocaleString()}</TableCell>
                  <TableCell><Chip label={s.frequency || 'ANNUAL'} size="small" /></TableCell>
                  <TableCell>{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
              {!structures.length && (
                <TableRow><TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" py={3}>No fee structures found</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <StructureDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        classes={classes} academicYears={academicYears} onSaved={fetch} />
    </Box>
  );
};

export default FeesPage;
