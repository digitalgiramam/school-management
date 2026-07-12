import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  TablePagination, Alert,
} from '@mui/material';
import { Add, CheckCircle, Summarize } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { payrollApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentYear = new Date().getFullYear();

const GenerateDialog = ({ open, onClose, onGenerated }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: { month: new Date().getMonth() + 1, year: currentYear, employeeType: 'TEACHER', basicSalary: '', allowances: '0', deductions: '0' },
  });
  useEffect(() => { if (open) reset({ month: new Date().getMonth() + 1, year: currentYear, employeeType: 'TEACHER', basicSalary: '', allowances: '0', deductions: '0' }); }, [open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const result = await payrollApi.generate(data);
      toast.success(`Generated ${result.data.data.generated} salary records`);
      onGenerated(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate Payroll</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          This will generate salary records for all active employees. Existing records for the same month/year will be updated.
        </Alert>
        <Box component="form" id="payroll-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <Controller name="month" control={control} render={({ field }) => (
                <TextField fullWidth select size="small" label="Month" {...field}>
                  {MONTHS.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="number" label="Year" {...register('year', { required: true })} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="employeeType" control={control} render={({ field }) => (
                <TextField fullWidth select size="small" label="Employee Type" {...field}>
                  <MenuItem value="TEACHER">Teachers</MenuItem>
                  <MenuItem value="STAFF">Staff</MenuItem>
                </TextField>
              )} />
            </Grid>
            <Grid item xs={4}><TextField fullWidth size="small" type="number" label="Basic Salary (₹)" {...register('basicSalary', { required: true })} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" type="number" label="Allowances (₹)" {...register('allowances')} /></Grid>
            <Grid item xs={4}><TextField fullWidth size="small" type="number" label="Deductions (₹)" {...register('deductions')} /></Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="payroll-form" variant="contained" disabled={saving}>{saving ? 'Generating…' : 'Generate'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const PayrollPage = () => {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [salaries, setSalaries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(currentYear);
  const [typeFilter, setTypeFilter] = useState('');
  const [paidFilter, setPaidFilter] = useState('');
  const [genOpen, setGenOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month: monthFilter, year: yearFilter, page: page + 1, limit: 20,
        employeeType: typeFilter || undefined, isPaid: paidFilter !== '' ? paidFilter : undefined };
      const [sal, sum] = await Promise.all([
        payrollApi.getAll(params),
        payrollApi.getSummary({ month: monthFilter, year: yearFilter }),
      ]);
      setSalaries(sal.data.data);
      setTotal(sal.data.total);
      setSummary(sum.data.data);
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  }, [monthFilter, yearFilter, typeFilter, paidFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleMarkPaid = async (id) => {
    try { await payrollApi.markPaid(id); toast.success('Marked as paid'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Payroll</Typography>
        {isAdmin && <Button variant="contained" startIcon={<Add />} onClick={() => setGenOpen(true)}>Generate Payroll</Button>}
      </Box>

      {/* Summary cards */}
      {summary && (
        <Grid container spacing={2} mb={3}>
          {[
            { label: 'Total Records', value: summary.totalRecords, color: 'primary' },
            { label: 'Paid', value: summary.paidCount, color: 'success' },
            { label: 'Pending', value: summary.pendingCount, color: 'warning' },
            { label: 'Total Payable', value: `₹${summary.totalPayable?.toLocaleString()}`, color: 'info' },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h5" fontWeight={700} color={`${s.color}.main`}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth select size="small" label="Month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                {MONTHS.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" type="number" label="Year" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth select size="small" label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="TEACHER">Teacher</MenuItem>
                <MenuItem value="STAFF">Staff</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth select size="small" label="Status" value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Paid</MenuItem>
                <MenuItem value="false">Pending</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        {loading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Basic</TableCell>
                  <TableCell>Allowances</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                  {isAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {salaries.map((s) => {
                  const emp = s.teacher || s.staff;
                  return (
                    <TableRow key={s.id} hover>
                      <TableCell fontWeight={600}>{emp ? `${emp.firstName} ${emp.lastName}` : '—'}</TableCell>
                      <TableCell>{emp?.employeeId || '—'}</TableCell>
                      <TableCell><Chip label={s.employeeType} size="small" variant="outlined" /></TableCell>
                      <TableCell>₹{s.basicSalary?.toLocaleString()}</TableCell>
                      <TableCell>₹{s.allowances?.toLocaleString()}</TableCell>
                      <TableCell>₹{s.deductions?.toLocaleString()}</TableCell>
                      <TableCell fontWeight={700}>₹{s.netSalary?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={s.isPaid ? 'Paid' : 'Pending'} size="small" color={s.isPaid ? 'success' : 'warning'} />
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          {!s.isPaid && (
                            <Button size="small" startIcon={<CheckCircle />} onClick={() => handleMarkPaid(s.id)}>
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {!salaries.length && <TableRow><TableCell colSpan={9} align="center"><Typography color="text.secondary" py={3}>No payroll records for this period</Typography></TableCell></TableRow>}
              </TableBody>
            </Table>
            <TablePagination component="div" count={total} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
          </>
        )}
      </Card>

      <GenerateDialog open={genOpen} onClose={() => setGenOpen(false)} onGenerated={fetch} />
    </Box>
  );
};

export default PayrollPage;
