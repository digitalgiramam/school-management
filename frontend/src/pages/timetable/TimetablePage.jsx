import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, MenuItem,
  Button, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Tooltip,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { timetableApi, classApi, sectionApi, subjectApi, teacherApi } from '../../api/axios';
import { settingsApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'];

// time options 07:00–18:30 in 30min steps
const TIME_OPTIONS = [];
for (let h = 7; h <= 18; h++) {
  ['00', '30'].forEach((m) => {
    if (h === 18 && m === '30') return;
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${m}`);
  });
}

const SlotDialog = ({ open, onClose, timetableId, subjects, teachers, initial, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    reset(initial || { dayOfWeek: 1, startTime: '08:00', endTime: '09:00', subjectId: '', teacherId: '', room: '' });
  }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (initial?.id) await timetableApi.updateSlot(initial.id, data);
      else await timetableApi.addSlot(timetableId, data);
      toast.success('Slot saved');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slot');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Slot' : 'Add Slot'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="slot-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <Controller name="dayOfWeek" control={control}
                render={({ field }) => (
                  <TextField fullWidth select size="small" label="Day" {...field}>
                    {DAYS.slice(1).map((d, i) => (
                      <MenuItem key={i + 1} value={i + 1}>{d}</MenuItem>
                    ))}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="startTime" control={control}
                render={({ field }) => (
                  <TextField fullWidth select size="small" label="Start Time" {...field}>
                    {TIME_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={6}>
              <Controller name="endTime" control={control}
                render={({ field }) => (
                  <TextField fullWidth select size="small" label="End Time" {...field}>
                    {TIME_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="subjectId" control={control}
                render={({ field }) => (
                  <TextField fullWidth select size="small" label="Subject" {...field}>
                    {subjects.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                    ))}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={12}>
              <Controller name="teacherId" control={control}
                render={({ field }) => (
                  <TextField fullWidth select size="small" label="Teacher" {...field}>
                    {teachers.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</MenuItem>
                    ))}
                  </TextField>
                )} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Room (optional)" {...register('room')} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="slot-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TimetablePage = () => {
  const { user } = useAuth();
  const canEdit = ADMIN_ROLES.includes(user?.role);

  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [selectedAY, setSelectedAY] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, initial: null });

  // Load dropdowns
  useEffect(() => {
    Promise.all([
      settingsApi.getAcademicYears(),
      classApi.getAll({ limit: 200 }),
      subjectApi.getAll({ limit: 200 }),
      teacherApi.getAll({ limit: 200 }),
    ]).then(([ay, cls, sub, tch]) => {
      setAcademicYears(ay.data.data || []);
      setClasses(cls.data.data || []);
      setSubjects(sub.data.data || []);
      setTeachers(tch.data.data || []);
      const current = ay.data.data?.find((a) => a.isCurrent);
      if (current) setSelectedAY(current.id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClass) { setSections([]); setSelectedSection(''); return; }
    sectionApi.getAll({ classId: selectedClass, limit: 50 })
      .then(({ data }) => setSections(data.data || []))
      .catch(() => {});
  }, [selectedClass]);

  const fetchTimetable = useCallback(async () => {
    if (!selectedSection || !selectedAY) return;
    setLoading(true);
    try {
      const { data } = await timetableApi.getBySection(selectedSection, selectedAY);
      setTimetable(data.data);
    } catch { setTimetable(null); }
    finally { setLoading(false); }
  }, [selectedSection, selectedAY]);

  useEffect(() => { fetchTimetable(); }, [fetchTimetable]);

  const handleCreateTimetable = async () => {
    try {
      await timetableApi.upsert({ sectionId: selectedSection, academicYearId: selectedAY });
      toast.success('Timetable created');
      fetchTimetable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this slot?')) return;
    try {
      await timetableApi.deleteSlot(slotId);
      toast.success('Slot deleted');
      fetchTimetable();
    } catch { toast.error('Failed to delete slot'); }
  };

  // Group slots by day
  const slotsByDay = {};
  timetable?.slots?.forEach((s) => {
    if (!slotsByDay[s.dayOfWeek]) slotsByDay[s.dayOfWeek] = [];
    slotsByDay[s.dayOfWeek].push(s);
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Timetable</Typography>

      {/* Selectors */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth size="small" label="Academic Year" value={selectedAY}
                onChange={(e) => setSelectedAY(e.target.value)}>
                {academicYears.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth size="small" label="Class" value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }}>
                <MenuItem value="">Select Class</MenuItem>
                {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField select fullWidth size="small" label="Section" value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)} disabled={!selectedClass}>
                <MenuItem value="">Select Section</MenuItem>
                {sections.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timetable grid */}
      {loading && <Box textAlign="center" py={4}><CircularProgress /></Box>}

      {!loading && selectedSection && !timetable && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary" mb={2}>
              No timetable exists for this section yet.
            </Typography>
            {canEdit && (
              <Button variant="contained" onClick={handleCreateTimetable}>
                Create Timetable
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && timetable && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {timetable.section?.class?.name} — Section {timetable.section?.name}
              </Typography>
              {canEdit && (
                <Button variant="contained" size="small" startIcon={<Add />}
                  onClick={() => setDialog({ open: true, initial: null })}>
                  Add Slot
                </Button>
              )}
            </Box>

            {DAYS.slice(1).map((day, idx) => {
              const daySlots = slotsByDay[idx + 1] || [];
              return (
                <Box key={day} mb={2}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main" mb={0.5}>
                    {day}
                  </Typography>
                  {daySlots.length ? (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {daySlots.map((slot) => (
                        <Card key={slot.id} variant="outlined"
                          sx={{ minWidth: 160, p: 1.5, position: 'relative' }}>
                          <Typography variant="caption" color="primary.main" fontWeight={700}>
                            {slot.startTime} – {slot.endTime}
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>{slot.subject?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {slot.teacher?.firstName} {slot.teacher?.lastName}
                          </Typography>
                          {slot.room && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              Room: {slot.room}
                            </Typography>
                          )}
                          {canEdit && (
                            <Box sx={{ position: 'absolute', top: 2, right: 2, display: 'flex' }}>
                              <IconButton size="small" onClick={() => setDialog({ open: true, initial: slot })}>
                                <Edit sx={{ fontSize: 14 }} />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDeleteSlot(slot.id)}>
                                <Delete sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          )}
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">No classes</Typography>
                  )}
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {timetable && (
        <SlotDialog
          open={dialog.open}
          onClose={() => setDialog({ open: false, initial: null })}
          timetableId={timetable?.id}
          subjects={subjects}
          teachers={teachers}
          initial={dialog.initial}
          onSaved={fetchTimetable}
        />
      )}
    </Box>
  );
};

export default TimetablePage;
