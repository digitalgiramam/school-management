import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Tabs, Tab, Typography, Card, CardContent, Grid, TextField,
  Button, MenuItem, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search, DirectionsBus, Route as RouteIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { transportApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];

// ── Bus Dialog ─────────────────────────────────────────────────
const BusDialog = ({ open, onClose, initial, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { reset(initial || { busNumber: '', registrationNo: '', capacity: '', driverName: '', driverPhone: '' }); }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (initial?.id) await transportApi.updateBus(initial.id, data);
      else await transportApi.createBus(data);
      toast.success(initial?.id ? 'Bus updated' : 'Bus added');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Bus' : 'Add Bus'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="bus-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth size="small" label="Bus Number" {...register('busNumber', { required: true })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Registration No." {...register('registrationNo', { required: true })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Capacity" {...register('capacity', { required: true })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="GPS Device ID" {...register('gpsDeviceId')} /></Grid>
            {!initial?.id && <>
              <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary">Driver Information</Typography></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Driver Name" {...register('driverName')} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="Driver Phone" {...register('driverPhone')} /></Grid>
              <Grid item xs={6}><TextField fullWidth size="small" label="License No." {...register('driverLicense')} /></Grid>
            </>}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="bus-form" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Route Dialog ───────────────────────────────────────────────
const RouteDialog = ({ open, onClose, initial, buses, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { reset(initial || { name: '', busId: '', startPoint: '', endPoint: '', monthlyFee: '' }); }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (initial?.id) await transportApi.updateRoute(initial.id, data);
      else await transportApi.createRoute(data);
      toast.success(initial?.id ? 'Route updated' : 'Route created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Route' : 'Add Route'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="route-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth size="small" label="Route Name" {...register('name', { required: true })} /></Grid>
            <Grid item xs={12}>
              <TextField fullWidth select size="small" label="Bus" defaultValue="" {...register('busId', { required: true })}>
                {buses.map((b) => <MenuItem key={b.id} value={b.id}>{b.busNumber} (Cap: {b.capacity})</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Start Point" {...register('startPoint', { required: true })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="End Point" {...register('endPoint', { required: true })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Distance (km)" {...register('distance')} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Monthly Fee (₹)" {...register('monthlyFee')} /></Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="route-form" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Buses Tab ──────────────────────────────────────────────────
const BusesTab = ({ isAdmin }) => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await transportApi.getBuses({ search: search || undefined, limit: 100 });
      setBuses(data.data);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField size="small" placeholder="Search bus number…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        {isAdmin && <Button variant="contained" startIcon={<Add />} sx={{ ml: 'auto' }}
          onClick={() => setDialog({ open: true, initial: null })}>Add Bus</Button>}
      </Box>
      {loading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Bus No.</TableCell>
              <TableCell>Reg. No.</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Routes</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {buses.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell fontWeight={700}>{b.busNumber}</TableCell>
                <TableCell>{b.registrationNo}</TableCell>
                <TableCell>{b.capacity}</TableCell>
                <TableCell>{b.driver ? `${b.driver.name} · ${b.driver.phone}` : '—'}</TableCell>
                <TableCell><Chip label={`${b._count?.routes || 0} routes`} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={b.isActive ? 'Active' : 'Inactive'} size="small" color={b.isActive ? 'success' : 'default'} /></TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setDialog({ open: true, initial: b })}><Edit fontSize="small" /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!buses.length && <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary" py={3}>No buses found</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      )}
      <BusDialog open={dialog.open} initial={dialog.initial}
        onClose={() => setDialog({ open: false, initial: null })} onSaved={fetch} />
    </Box>
  );
};

// ── Routes Tab ─────────────────────────────────────────────────
const RoutesTab = ({ isAdmin }) => {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([
        transportApi.getRoutes({ limit: 100 }),
        transportApi.getBuses({ limit: 100 }),
      ]);
      setRoutes(r.data.data);
      setBuses(b.data.data);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this route?')) return;
    try { await transportApi.deleteRoute(id); toast.success('Deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {isAdmin && <Button variant="contained" startIcon={<Add />}
          onClick={() => setDialog({ open: true, initial: null })}>Add Route</Button>}
      </Box>
      {loading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Route Name</TableCell>
              <TableCell>Bus</TableCell>
              <TableCell>From → To</TableCell>
              <TableCell>Distance</TableCell>
              <TableCell>Monthly Fee</TableCell>
              <TableCell>Stops</TableCell>
              <TableCell>Students</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {routes.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell fontWeight={600}>{r.name}</TableCell>
                <TableCell>{r.bus?.busNumber}</TableCell>
                <TableCell>{r.startPoint} → {r.endPoint}</TableCell>
                <TableCell>{r.distance ? `${r.distance} km` : '—'}</TableCell>
                <TableCell>₹{r.monthlyFee?.toLocaleString()}</TableCell>
                <TableCell>{r.stops?.length || 0}</TableCell>
                <TableCell><Chip label={r._count?.allocations || 0} size="small" variant="outlined" /></TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setDialog({ open: true, initial: r })}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!routes.length && <TableRow><TableCell colSpan={8} align="center"><Typography color="text.secondary" py={3}>No routes found</Typography></TableCell></TableRow>}
          </TableBody>
        </Table>
      )}
      <RouteDialog open={dialog.open} initial={dialog.initial} buses={buses}
        onClose={() => setDialog({ open: false, initial: null })} onSaved={fetch} />
    </Box>
  );
};

// ── Main ───────────────────────────────────────────────────────
const TransportPage = () => {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Transport Management</Typography>
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab icon={<DirectionsBus />} iconPosition="start" label="Buses" sx={{ textTransform: 'none' }} />
            <Tab icon={<RouteIcon />} iconPosition="start" label="Routes" sx={{ textTransform: 'none' }} />
          </Tabs>
        </Box>
        <CardContent>
          {tab === 0 && <BusesTab isAdmin={isAdmin} />}
          {tab === 1 && <RoutesTab isAdmin={isAdmin} />}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TransportPage;
