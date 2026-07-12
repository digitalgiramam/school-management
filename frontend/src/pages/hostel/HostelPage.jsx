import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, MenuItem,
} from '@mui/material';
import { Add, Edit, Hotel, MeetingRoom } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { hostelApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];

const HostelDialog = ({ open, onClose, initial, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { reset(initial || { name: '', type: 'BOYS', address: '', capacity: '' }); }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (initial?.id) await hostelApi.update(initial.id, data);
      else await hostelApi.create(data);
      toast.success(initial?.id ? 'Hostel updated' : 'Hostel created');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Hostel' : 'Add Hostel'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="hostel-form" onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth size="small" label="Hostel Name" margin="normal" {...register('name', { required: true })} />
          <TextField fullWidth select size="small" label="Type" margin="normal" defaultValue="BOYS" {...register('type')}>
            <MenuItem value="BOYS">Boys</MenuItem>
            <MenuItem value="GIRLS">Girls</MenuItem>
            <MenuItem value="MIXED">Mixed</MenuItem>
          </TextField>
          <TextField fullWidth size="small" label="Address" margin="normal" multiline rows={2} {...register('address')} />
          <TextField fullWidth size="small" type="number" label="Total Capacity" margin="normal" {...register('capacity', { required: true })} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="hostel-form" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const RoomDialog = ({ open, onClose, hostelId, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();
  useEffect(() => { if (open) reset({ roomNo: '', floor: '1', capacity: '4', type: 'SHARED' }); }, [open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await hostelApi.addRoom(hostelId, data);
      toast.success('Room added'); onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Room</DialogTitle>
      <DialogContent>
        <Box component="form" id="room-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth size="small" label="Room No." {...register('roomNo', { required: true })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Floor" {...register('floor')} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Capacity" {...register('capacity')} /></Grid>
            <Grid item xs={6}>
              <TextField fullWidth select size="small" label="Type" defaultValue="SHARED" {...register('type')}>
                <MenuItem value="SINGLE">Single</MenuItem>
                <MenuItem value="SHARED">Shared</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="room-form" variant="contained" disabled={saving}>{saving ? 'Adding…' : 'Add'}</Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Hostels Tab ────────────────────────────────────────────────
const HostelsTab = ({ isAdmin }) => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, initial: null });
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomDialog, setRoomDialog] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const fetchHostels = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await hostelApi.getAll({ limit: 50 });
      setHostels(data.data);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHostels(); }, [fetchHostels]);

  const fetchRooms = async (hostelId) => {
    setRoomsLoading(true);
    try {
      const { data } = await hostelApi.getRooms(hostelId);
      setRooms(data.data || []);
    } catch { toast.error('Failed to load rooms'); }
    finally { setRoomsLoading(false); }
  };

  const handleSelectHostel = (h) => { setSelectedHostel(h); fetchRooms(h.id); };

  return (
    <Grid container spacing={3}>
      {/* Hostel List */}
      <Grid item xs={12} md={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography fontWeight={700}>Hostels</Typography>
          {isAdmin && <Button size="small" startIcon={<Add />} onClick={() => setDialog({ open: true, initial: null })}>Add</Button>}
        </Box>
        {loading ? <CircularProgress size={24} /> : hostels.map((h) => (
          <Card key={h.id} variant="outlined" sx={{
            mb: 1, cursor: 'pointer',
            border: selectedHostel?.id === h.id ? '2px solid' : '1px solid',
            borderColor: selectedHostel?.id === h.id ? 'primary.main' : 'divider',
          }} onClick={() => handleSelectHostel(h)}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography fontWeight={700}>{h.name}</Typography>
                  <Chip label={h.type} size="small" sx={{ mr: 1 }} />
                  <Typography variant="caption">{h.occupied}/{h.totalCapacity} occupied</Typography>
                </Box>
                {isAdmin && <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDialog({ open: true, initial: h }); }}>
                  <Edit fontSize="small" />
                </IconButton>}
              </Box>
            </CardContent>
          </Card>
        ))}
        <HostelDialog open={dialog.open} initial={dialog.initial}
          onClose={() => setDialog({ open: false, initial: null })} onSaved={fetchHostels} />
      </Grid>

      {/* Rooms */}
      <Grid item xs={12} md={8}>
        {selectedHostel ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography fontWeight={700}>Rooms — {selectedHostel.name}</Typography>
              {isAdmin && <Button size="small" startIcon={<Add />} onClick={() => setRoomDialog(true)}>Add Room</Button>}
            </Box>
            {roomsLoading ? <CircularProgress size={24} /> : (
              <Grid container spacing={1}>
                {rooms.map((r) => {
                  const occupied = r.allocations?.length || 0;
                  const isFull = occupied >= r.capacity;
                  return (
                    <Grid item xs={6} sm={4} key={r.id}>
                      <Card variant="outlined" sx={{ p: 1.5, bgcolor: isFull ? 'error.light' : 'success.light' }}>
                        <Typography fontWeight={700}>Room {r.roomNo}</Typography>
                        <Typography variant="caption" display="block">Floor {r.floor} · {r.type}</Typography>
                        <Chip label={`${occupied}/${r.capacity}`} size="small" color={isFull ? 'error' : 'success'} sx={{ mt: 0.5 }} />
                      </Card>
                    </Grid>
                  );
                })}
                {!rooms.length && <Grid item xs={12}><Typography color="text.secondary" textAlign="center" py={2}>No rooms added</Typography></Grid>}
              </Grid>
            )}
            <RoomDialog open={roomDialog} hostelId={selectedHostel.id}
              onClose={() => setRoomDialog(false)} onSaved={() => fetchRooms(selectedHostel.id)} />
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Hotel sx={{ fontSize: 48, mb: 1 }} />
            <Typography>Select a hostel to view rooms</Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

// ── Main ───────────────────────────────────────────────────────
const HostelPage = () => {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Hostel Management</Typography>
      <Card>
        <CardContent>
          <HostelsTab isAdmin={isAdmin} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default HostelPage;
