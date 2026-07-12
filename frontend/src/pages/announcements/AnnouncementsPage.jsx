import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  IconButton, Stack, Divider,
} from '@mui/material';
import { Add, Edit, Delete, Campaign } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { announcementApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];
const PRIORITY_COLORS = { LOW: 'default', MEDIUM: 'info', HIGH: 'warning', URGENT: 'error' };
const TARGET_ROLES = ['ALL', 'TEACHER', 'STUDENT', 'PARENT', 'STAFF'];

const AnnouncementDialog = ({ open, onClose, initial, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control } = useForm();

  useEffect(() => {
    reset(initial
      ? { ...initial, expiresAt: initial.expiresAt ? initial.expiresAt.slice(0, 10) : '' }
      : { title: '', content: '', priority: 'MEDIUM', targetRole: 'ALL' }
    );
  }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (initial?.id) await announcementApi.update(initial.id, data);
      else await announcementApi.create(data);
      toast.success(initial?.id ? 'Announcement updated' : 'Announcement published');
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="ann-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Title" {...register('title', { required: true })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Content" multiline rows={4}
                {...register('content', { required: true })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="priority" control={control} defaultValue="MEDIUM" render={({ field }) => (
                <TextField fullWidth select size="small" label="Priority" {...field}>
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="targetRole" control={control} defaultValue="ALL" render={({ field }) => (
                <TextField fullWidth select size="small" label="Target Audience" {...field}>
                  {TARGET_ROLES.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              )} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="date" label="Expires At (optional)"
                InputLabelProps={{ shrink: true }} {...register('expiresAt')} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="ann-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : initial?.id ? 'Update' : 'Publish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await announcementApi.getAll({ priority: priorityFilter || undefined, limit: 50 });
      setAnnouncements(data.data || data);
    } catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  }, [priorityFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try { await announcementApi.remove(id); toast.success('Deleted'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const isExpired = (d) => d && new Date(d) < new Date();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Announcements</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialog({ open: true, initial: null })}>
            New Announcement
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <TextField select size="small" label="Priority" value={priorityFilter} sx={{ minWidth: 160 }}
            onChange={(e) => setPriorityFilter(e.target.value)}>
            <MenuItem value="">All Priorities</MenuItem>
            {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
        </CardContent>
      </Card>

      {loading ? <Box textAlign="center" py={6}><CircularProgress /></Box> : (
        <Stack spacing={2}>
          {announcements.map((a) => (
            <Card key={a.id} sx={isExpired(a.expiresAt) ? { opacity: 0.6 } : {}}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Campaign color="primary" fontSize="small" />
                    <Typography variant="subtitle1" fontWeight={700}>{a.title}</Typography>
                    <Chip label={a.priority} size="small" color={PRIORITY_COLORS[a.priority] || 'default'} />
                    <Chip label={a.targetRole || 'ALL'} size="small" variant="outlined" />
                    {isExpired(a.expiresAt) && <Chip label="Expired" size="small" color="error" />}
                  </Box>
                  {isAdmin && (
                    <Box>
                      <IconButton size="small" onClick={() => setDialog({ open: true, initial: a })}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(a.id, a.title)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {a.content}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Posted: {new Date(a.createdAt).toLocaleString()}
                  {a.expiresAt && ` · Expires: ${new Date(a.expiresAt).toLocaleDateString()}`}
                  {a.createdBy && ` · By: ${a.createdBy.firstName} ${a.createdBy.lastName}`}
                </Typography>
              </CardContent>
            </Card>
          ))}
          {!announcements.length && (
            <Card><CardContent>
              <Typography color="text.secondary" textAlign="center" py={4}>No announcements</Typography>
            </CardContent></Card>
          )}
        </Stack>
      )}

      <AnnouncementDialog open={dialog.open} initial={dialog.initial}
        onClose={() => setDialog({ open: false, initial: null })} onSaved={fetch} />
    </Box>
  );
};

export default AnnouncementsPage;
