import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TablePagination,
  InputAdornment,
} from '@mui/material';
import { Add, Payment, Search } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { feeApi, studentApi } from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_COLOR = { PAID: 'success', PARTIAL: 'warning', UNPAID: 'default', OVERDUE: 'error' };

const PaymentDialog = ({ open, onClose, invoice, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm();
  useEffect(() => { if (open) reset({ amount: invoice?.totalAmount - (invoice?.paidAmount || 0) || '' }); }, [open, invoice, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await feeApi.recordPayment(invoice.id, data);
      toast.success('Payment recorded');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (!invoice) return null;
  const balance = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        <Typography variant="body2" mb={1}>
          <strong>{invoice.student?.firstName} {invoice.student?.lastName}</strong>
          {' · '}{invoice.invoiceNo}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Balance due: <strong>₹{balance.toLocaleString()}</strong>
        </Typography>
        <Box component="form" id="pay-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Amount" type="number"
                {...register('amount', { required: true, min: 1 })} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="paymentMode" control={control} defaultValue="CASH" render={({ field }) => (
                <TextField fullWidth select size="small" label="Payment Mode" {...field}>
                  {['CASH', 'CHEQUE', 'ONLINE', 'UPI', 'CARD', 'DD'].map(m => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" type="date" label="Payment Date"
                InputLabelProps={{ shrink: true }} {...register('paidAt')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Reference / Transaction ID" {...register('transactionId')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Remarks" {...register('remarks')} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="pay-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InvoiceDialog = ({ open, onClose, students, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm();
  useEffect(() => { if (open) reset({}); }, [open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await feeApi.createInvoice(data);
      toast.success('Invoice created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Invoice</DialogTitle>
      <DialogContent>
        <Box component="form" id="inv-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Controller name="studentId" control={control} defaultValue="" render={({ field }) => (
                <TextField fullWidth select size="small" label="Student" {...field}>
                  {students.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.admissionNumber})
                    </MenuItem>
                  ))}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Fee Category / Description"
                {...register('description', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Amount" type="number"
                {...register('amount', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Discount" type="number"
                {...register('discount')} defaultValue={0} />
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
        <Button type="submit" form="inv-form" variant="contained" disabled={saving}>
          {saving ? 'Creating…' : 'Create Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const FeeInvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payDialog, setPayDialog] = useState({ open: false, invoice: null });
  const [invDialog, setInvDialog] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await feeApi.getInvoices({
        search: search || undefined, status: statusFilter || undefined,
        page: page + 1, limit: 20,
      });
      setInvoices(data.invoices || data.data || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    studentApi.getAll({ limit: 200, isActive: 'true' })
      .then(({ data }) => setStudents(data.students || data.data || []));
  }, []);

  const balance = (inv) => (inv.totalAmount || 0) - (inv.payments?.reduce((s, p) => s + p.amount, 0) || 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Fee Invoices</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setInvDialog(true)}>
          Create Invoice
        </Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={5}>
              <TextField fullWidth size="small" placeholder="Search invoice no / student…"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth select size="small" label="Status" value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All</MenuItem>
                {['PAID', 'PARTIAL', 'UNPAID', 'OVERDUE'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        {loading ? <Box textAlign="center" py={5}><CircularProgress /></Box> : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map(inv => {
                  const bal = balance(inv);
                  return (
                    <TableRow key={inv.id} hover>
                      <TableCell>{inv.invoiceNo}</TableCell>
                      <TableCell>
                        {inv.student?.firstName} {inv.student?.lastName}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {inv.student?.admissionNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{inv.description || '—'}</TableCell>
                      <TableCell>₹{(inv.totalAmount || 0).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: 'success.main' }}>
                        ₹{(inv.payments?.reduce((s, p) => s + p.amount, 0) || 0).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: bal > 0 ? 'error.main' : 'text.primary', fontWeight: bal > 0 ? 700 : 400 }}>
                        ₹{bal.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={inv.status || 'UNPAID'} size="small"
                          color={STATUS_COLOR[inv.status] || 'default'} />
                      </TableCell>
                      <TableCell align="right">
                        {inv.status !== 'PAID' && (
                          <Button size="small" variant="outlined" startIcon={<Payment />}
                            onClick={() => setPayDialog({ open: true, invoice: inv })}>
                            Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!invoices.length && (
                  <TableRow><TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" py={3}>No invoices found</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination component="div" count={total} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
          </>
        )}
      </Card>

      <PaymentDialog open={payDialog.open} invoice={payDialog.invoice}
        onClose={() => setPayDialog({ open: false, invoice: null })} onSaved={fetch} />
      <InvoiceDialog open={invDialog} students={students}
        onClose={() => setInvDialog(false)} onSaved={fetch} />
    </Box>
  );
};

export default FeeInvoicesPage;
