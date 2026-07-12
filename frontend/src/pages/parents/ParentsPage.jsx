import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Avatar, CircularProgress, InputAdornment, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add, Search, Visibility, Edit, Delete } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

const parentApi = {
  getAll: (params) => api.get('/parents', { params }),
  create: (data) => api.post('/parents', data),
  update: (id, data) => api.put(`/parents/${id}`, data),
  remove: (id) => api.delete(`/parents/${id}`),
};

const ParentDialog = ({ open, onClose, initial, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { reset(initial || {}); }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (initial?.id) await parentApi.update(initial.id, data);
      else await parentApi.create(data);
      toast.success(initial?.id ? 'Parent updated' : 'Parent created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Parent' : 'Add Parent'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="parent-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="First Name *" {...register('firstName', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Last Name *" {...register('lastName', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Email *" type="email" {...register('email', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Phone" {...register('phone')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Occupation" {...register('occupation')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Relation to Student" {...register('relation')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Address" multiline rows={2} {...register('address')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Annual Income" type="number" {...register('annualIncome')} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="parent-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : initial?.id ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ParentsPage = () => {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [parents, setParents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await parentApi.getAll({ search: search || undefined, page: page + 1, limit: 20 });
      setParents(data.data || data.parents || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load parents'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    try { await parentApi.remove(id); toast.success('Deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Parents / Guardians</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialog({ open: true, initial: null })}>
            Add Parent
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <TextField size="small" placeholder="Search name / email…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ minWidth: 300 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        </CardContent>
      </Card>

      <Card>
        {loading ? <Box textAlign="center" py={5}><CircularProgress /></Box> : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Parent</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Occupation</TableCell>
                  <TableCell>Relation</TableCell>
                  <TableCell>Children</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parents.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'secondary.main' }}>
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{p.firstName} {p.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{p.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{p.phone || '—'}</TableCell>
                    <TableCell>{p.occupation || '—'}</TableCell>
                    <TableCell>{p.relation || '—'}</TableCell>
                    <TableCell>
                      <Chip label={p._count?.students ?? p.students?.length ?? 0}
                        size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      {isAdmin && (
                        <>
                          <IconButton size="small" onClick={() => setDialog({ open: true, initial: p })}>
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error"
                            onClick={() => handleDelete(p.id, `${p.firstName} ${p.lastName}`)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!parents.length && (
                  <TableRow><TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={3}>No parents found</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination component="div" count={total} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
          </>
        )}
      </Card>

      <ParentDialog open={dialog.open} initial={dialog.initial}
        onClose={() => setDialog({ open: false, initial: null })} onSaved={fetch} />
    </Box>
  );
};

export default ParentsPage;
