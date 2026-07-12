import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  TablePagination, Avatar,
} from '@mui/material';
import { Add, Check } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { leaveApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];
const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER'];
const statusColor = (s) => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' }[s] || 'default');

const ApplyDialog = ({ open, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm();
  useEffect(() => { if (open) reset({}); }, [open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await leaveApi.apply(data);
      toast.success('Leave application submitted');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Apply for Leave</DialogTitle>
      <DialogContent>
        <Box component="form" id="leave-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Controller name="leaveType" control={control} defaultValue="CASUAL" render={({ field }) => (
                <TextField fullWidth select size="small" label="Leave Type" {...field}>
                  {LEAVE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="date" label="Start Date"
                InputLabelProps={{ shrink: true }} {...register('startDate', { required: true })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" type="date" label="End Date"
                InputLabelProps={{ shrink: true }} {...register('endDate', { required: true })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Reason" multiline rows={3}
                {...register('reason', { required: true })} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="leave-form" variant="contained" disabled={saving}>
          {saving ? 'Submitting…' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ApproveDialog = ({ open, onClose, leave, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { if (open) reset({ remarks: '' }); }, [open, reset]);

  const handleAction = async (status, data) => {
    setSaving(true);
    try {
      await leaveApi.approve(leave.id, { status, remarks: data.remarks });
      toast.success(`Leave ${status.toLowerCase()}`);
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (!leave) return null;
  const name = `${leave.teacher?.firstName || leave.staff?.firstName || ''} ${leave.teacher?.lastName || leave.staff?.lastName || ''}`.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Review Leave Application</DialogTitle>
      <DialogContent>
        <Typography variant="body2" mb={0.5}><strong>{name}</strong></Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>
          {leave.leaveType} · {new Date(leave.startDate).toLocaleDateString()} – {new Date(leave.endDate).toLocaleDateString()}
        </Typography>
        <Typography variant="body2" mb={2}>{leave.reason}</Typography>
        <TextField fullWidth size="small" label="Remarks (optional)" multiline rows={2} {...register('remarks')} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="outlined" disabled={saving}
          onClick={handleSubmit((d) => handleAction('REJECTED', d))}>Reject</Button>
        <Button color="success" variant="contained" disabled={saving}
          onClick={handleSubmit((d) => handleAction('APPROVED', d))}>Approve</Button>
      </DialogActions>
    </Dialog>
  );
};

const LeavePage = () => {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [leaves, setLeaves] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [approveDialog, setApproveDialog] = useState({ open: false, leave: null });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const fn = isAdmin ? leaveApi.getAll : leaveApi.getMyLeaves;
      const { data } = await fn({ status: statusFilter || undefined, leaveType: typeFilter || undefined, page: page + 1, limit: 20 });
      setLeaves(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  }, [isAdmin, statusFilter, typeFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const days = (s, e) => Math.ceil((new Date(e) - new Date(s)) / 86400000) + 1;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Leave Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setApplyOpen(true)}>Apply for Leave</Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select size="small" label="Status" value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {['PENDING', 'APPROVED', 'REJECTED'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select size="small" label="Leave Type" value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Types</MenuItem>
                {LEAVE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
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
                  {isAdmin && <TableCell>Employee</TableCell>}
                  <TableCell>Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Remarks</TableCell>
                  {isAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map((l) => {
                  const name = `${l.teacher?.firstName || l.staff?.firstName || ''} ${l.teacher?.lastName || l.staff?.lastName || ''}`.trim();
                  return (
                    <TableRow key={l.id} hover>
                      {isAdmin && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>{name[0] || '?'}</Avatar>
                            {name}
                          </Box>
                        </TableCell>
                      )}
                      <TableCell><Chip label={l.leaveType} size="small" /></TableCell>
                      <TableCell>{new Date(l.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(l.endDate).toLocaleDateString()}</TableCell>
                      <TableCell>{days(l.startDate, l.endDate)}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}><Typography variant="caption" noWrap>{l.reason}</Typography></TableCell>
                      <TableCell><Chip label={l.status} size="small" color={statusColor(l.status)} /></TableCell>
                      <TableCell><Typography variant="caption">{l.approvalRemarks || '—'}</Typography></TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          {l.status === 'PENDING' && (
                            <IconButton size="small" onClick={() => setApproveDialog({ open: true, leave: l })}>
                              <Check fontSize="small" color="success" />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {!leaves.length && (
                  <TableRow><TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" py={3}>No leave applications found</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination component="div" count={total} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
          </>
        )}
      </Card>

      <ApplyDialog open={applyOpen} onClose={() => setApplyOpen(false)} onSaved={fetch} />
      <ApproveDialog open={approveDialog.open} leave={approveDialog.leave}
        onClose={() => setApproveDialog({ open: false, leave: null })} onSaved={fetch} />
    </Box>
  );
};

export default LeavePage;
