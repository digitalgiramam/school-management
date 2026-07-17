import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Tabs, Tab, Typography, Card, CardContent, Grid, TextField,
  Button, Avatar, Divider, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Tooltip, Alert,
} from '@mui/material';
import {
  Person, Lock, School, Grade, CalendarMonth, AccountTree,
  Edit, Delete, Add, CheckCircle, PhotoCamera, Save,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { settingsApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import ProfilePhotoUpload from '../../components/common/ProfilePhotoUpload';

// ── Helpers ────────────────────────────────────────────────────
const TabPanel = ({ children, value, index }) =>
  value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;

const SectionTitle = ({ title, subtitle }) => (
  <Box mb={2}>
    <Typography variant="h6" fontWeight={700}>{title}</Typography>
    {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
  </Box>
);

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

// ══════════════════════════════════════════════════════════════
// TAB 1 — My Profile
// ══════════════════════════════════════════════════════════════
const ProfileTab = ({ profile, onRefresh }) => {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

  useEffect(() => {
    if (!profile) return;
    const p = profile.student || profile.teacher || profile.parent || profile.staff || {};
    reset({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      phone: p.phone || '',
      address: p.address || '',
      qualification: p.qualification || '',
      experience: p.experience || '',
      occupation: p.occupation || '',
      relationship: p.relationship || '',
    });
  }, [profile, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await settingsApi.updateProfile(data);
      toast.success('Profile updated');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const p = profile?.student || profile?.teacher || profile?.parent || profile?.staff;
  const displayName = p ? `${p.firstName} ${p.lastName}` : profile?.email;

  return (
    <Grid container spacing={3}>
      {/* Avatar card */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ mb: 2 }}>
              <ProfilePhotoUpload
                src={profile?.profilePhoto}
                name={displayName || ''}
                size={100}
                onUpload={async (file) => {
                  await settingsApi.updateProfilePhoto(file);
                  onRefresh();
                }}
              />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>{displayName}</Typography>
            <Chip label={profile?.role?.replace(/_/g, ' ')} size="small" color="primary" sx={{ mt: 0.5 }} />
            <Typography variant="caption" display="block" color="text.secondary" mt={1}>
              {profile?.email}
            </Typography>
            {profile?.isEmailVerified && (
              <Chip icon={<CheckCircle />} label="Verified" size="small" color="success" variant="outlined" sx={{ mt: 1 }} />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Profile form */}
      <Grid item xs={12} md={9}>
        <Card>
          <CardContent>
            <SectionTitle title="Personal Information" subtitle="Update your profile details" />
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
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
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone Number" size="small" {...register('phone')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Address" size="small" {...register('address')} />
                </Grid>

                {/* Teacher-specific fields */}
                {profile?.teacher && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Qualification" size="small" {...register('qualification')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Experience (years)" size="small" type="number" {...register('experience')} />
                    </Grid>
                  </>
                )}

                {/* Parent-specific fields */}
                {profile?.parent && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Occupation" size="small" {...register('occupation')} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Relationship to Student" size="small" {...register('relationship')} />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button onClick={() => reset()} disabled={!isDirty || saving}>Reset</Button>
                    <Button type="submit" variant="contained" startIcon={<Save />}
                      disabled={!isDirty || saving}>
                      {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Read-only info */}
            {(profile?.student || profile?.teacher) && (
              <>
                <Divider sx={{ my: 3 }} />
                <SectionTitle title="Account Information" subtitle="Read-only system fields" />
                <Grid container spacing={2}>
                  {profile.student && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Admission Number" size="small"
                          value={profile.student.admissionNumber || ''} InputProps={{ readOnly: true }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Class / Section" size="small"
                          value={profile.student.section
                            ? `${profile.student.section.class?.name} - ${profile.student.section.name}`
                            : 'Not assigned'}
                          InputProps={{ readOnly: true }} />
                      </Grid>
                    </>
                  )}
                  {profile.teacher && (
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Employee ID" size="small"
                        value={profile.teacher.employeeId || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Last Login" size="small"
                      value={profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never'}
                      InputProps={{ readOnly: true }} />
                  </Grid>
                </Grid>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ══════════════════════════════════════════════════════════════
// TAB 2 — Security / Change Password
// ══════════════════════════════════════════════════════════════
const SecurityTab = () => {
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const newPw = watch('newPassword', '');

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await settingsApi.changePassword(data);
      toast.success('Password changed successfully');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const pwStrength = (pw = '') => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = pwStrength(newPw);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'error', 'warning', 'info', 'success'];

  return (
    <Grid container spacing={3} justifyContent="center">
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <SectionTitle title="Change Password" subtitle="Use a strong, unique password" />
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth label="Current Password" type="password" margin="normal" size="small"
                error={!!errors.currentPassword} helperText={errors.currentPassword?.message}
                {...register('currentPassword', { required: 'Current password is required' })}
              />
              <TextField
                fullWidth label="New Password" type="password" margin="normal" size="small"
                error={!!errors.newPassword} helperText={errors.newPassword?.message}
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Minimum 8 characters' },
                  pattern: {
                    value: /(?=.*[A-Z])(?=.*[0-9])/,
                    message: 'Must contain at least one uppercase letter and one number',
                  },
                })}
              />
              {newPw && (
                <Box sx={{ mt: 0.5, mb: 1 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <Box key={i} sx={{
                        height: 4, flex: 1, borderRadius: 2,
                        bgcolor: strength >= i ? `${strengthColor[strength]}.main` : 'action.disabled',
                        transition: 'background-color 0.3s',
                      }} />
                    ))}
                  </Box>
                  <Typography variant="caption" color={`${strengthColor[strength]}.main`}>
                    {strengthLabel[strength]}
                  </Typography>
                </Box>
              )}
              <TextField
                fullWidth label="Confirm New Password" type="password" margin="normal" size="small"
                error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === newPw || 'Passwords do not match',
                })}
              />

              <Alert severity="info" sx={{ mt: 2, mb: 2 }} icon={false}>
                <Typography variant="caption">
                  Password requirements: minimum 8 characters, at least one uppercase letter and one number.
                </Typography>
              </Alert>

              <Button
                type="submit" variant="contained" fullWidth size="large"
                disabled={saving} startIcon={<Lock />}
              >
                {saving ? 'Changing…' : 'Change Password'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// ══════════════════════════════════════════════════════════════
// TAB 3 — School Settings
// ══════════════════════════════════════════════════════════════
const SchoolSettingsTab = () => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  useEffect(() => {
    settingsApi.getSchoolSettings()
      .then(({ data }) => reset(data.data))
      .catch(() => {});
  }, [reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await settingsApi.updateSchoolSettings(data);
      toast.success('School settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <SectionTitle title="School Information" subtitle="Configure your school's basic details" />
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="School Name" size="small" {...register('name')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Tagline / Motto" size="small" {...register('tagline')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" size="small" multiline rows={2} {...register('address')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" size="small" {...register('phone')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" size="small" type="email" {...register('email')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Website" size="small" {...register('website')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Timezone" size="small" {...register('timezone')} />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Academic & Fee Settings</Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Currency Symbol" size="small" {...register('currencySymbol')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Late Fine Per Day" size="small" type="number" {...register('finePerDay')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Session Start Month (1–12)" size="small" type="number"
                inputProps={{ min: 1, max: 12 }} {...register('sessionStartMonth')} />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={700} mb={1}>Library Settings</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Max Books Per Student" size="small" type="number" {...register('maxBooksPerStudent')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Book Return Days" size="small" type="number" {...register('bookReturnDays')} />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={() => reset()} disabled={!isDirty || saving}>Reset</Button>
                <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Settings'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

// ══════════════════════════════════════════════════════════════
// TAB 4 — Grade Settings
// ══════════════════════════════════════════════════════════════
const GradeDialog = ({ open, onClose, initial, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    reset(initial || { grade: '', minMark: '', maxMark: '', gradePoint: '', description: '' });
  }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await settingsApi.upsertGrade({ ...data, id: initial?.id });
      toast.success(initial?.id ? 'Grade updated' : 'Grade added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving grade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="grade-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Grade (e.g. A+)" size="small"
                error={!!errors.grade} helperText={errors.grade?.message}
                {...register('grade', { required: 'Required' })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Grade Point" size="small" type="number"
                inputProps={{ step: '0.1', min: 0, max: 10 }}
                error={!!errors.gradePoint} helperText={errors.gradePoint?.message}
                {...register('gradePoint', { required: 'Required' })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Min Mark %" size="small" type="number"
                inputProps={{ min: 0, max: 100 }}
                error={!!errors.minMark} helperText={errors.minMark?.message}
                {...register('minMark', { required: 'Required' })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Max Mark %" size="small" type="number"
                inputProps={{ min: 0, max: 100 }}
                error={!!errors.maxMark} helperText={errors.maxMark?.message}
                {...register('maxMark', { required: 'Required' })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description (optional)" size="small" {...register('description')} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="grade-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const GradeSettingsTab = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetchGrades = async () => {
    try {
      const { data } = await settingsApi.getGradeSettings();
      setGrades(data.data);
    } catch { toast.error('Failed to load grades'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGrades(); }, []);

  const handleDelete = async (id, grade) => {
    if (!window.confirm(`Delete grade "${grade}"?`)) return;
    try {
      await settingsApi.deleteGrade(id);
      toast.success('Grade deleted');
      fetchGrades();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <SectionTitle title="Grade Settings" subtitle="Define grade bands and GPA points" />
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialog({ open: true, initial: null })}>
            Add Grade
          </Button>
        </Box>

        {loading ? (
          <Box textAlign="center" py={4}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Grade</TableCell>
                <TableCell>Min %</TableCell>
                <TableCell>Max %</TableCell>
                <TableCell>Grade Point</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grades.map((g) => (
                <TableRow key={g.id} hover>
                  <TableCell>
                    <Chip label={g.grade} size="small" color={
                      g.grade.startsWith('A') ? 'success' :
                      g.grade.startsWith('B') ? 'info' :
                      g.grade.startsWith('C') ? 'warning' : 'error'
                    } />
                  </TableCell>
                  <TableCell>{g.minMark}</TableCell>
                  <TableCell>{g.maxMark}</TableCell>
                  <TableCell>{g.gradePoint}</TableCell>
                  <TableCell>{g.description || '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setDialog({ open: true, initial: g })}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(g.id, g.grade)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!grades.length && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary" py={2}>No grades configured</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <GradeDialog
        open={dialog.open}
        initial={dialog.initial}
        onClose={() => setDialog({ open: false, initial: null })}
        onSaved={fetchGrades}
      />
    </Card>
  );
};

// ══════════════════════════════════════════════════════════════
// TAB 5 — Academic Years
// ══════════════════════════════════════════════════════════════
const AcademicYearDialog = ({ open, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (open) reset({ name: '', startDate: '', endDate: '' });
  }, [open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await settingsApi.createAcademicYear({
        name: data.name,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      });
      toast.success('Academic year created');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating academic year');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>New Academic Year</DialogTitle>
      <DialogContent>
        <Box component="form" id="ay-form" onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label='Name (e.g. "2026-2027")' size="small" margin="normal"
            error={!!errors.name} helperText={errors.name?.message}
            {...register('name', { required: 'Required' })} />
          <TextField fullWidth label="Start Date" type="date" size="small" margin="normal"
            InputLabelProps={{ shrink: true }}
            error={!!errors.startDate} helperText={errors.startDate?.message}
            {...register('startDate', { required: 'Required' })} />
          <TextField fullWidth label="End Date" type="date" size="small" margin="normal"
            InputLabelProps={{ shrink: true }}
            error={!!errors.endDate} helperText={errors.endDate?.message}
            {...register('endDate', { required: 'Required' })} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="ay-form" variant="contained" disabled={saving}>
          {saving ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AcademicYearsTab = () => {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchYears = async () => {
    try {
      const { data } = await settingsApi.getAcademicYears();
      setYears(data.data);
    } catch { toast.error('Failed to load academic years'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchYears(); }, []);

  const handleSetCurrent = async (id) => {
    try {
      await settingsApi.setCurrentAcademicYear(id);
      toast.success('Current academic year updated');
      fetchYears();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete academic year "${name}"?`)) return;
    try {
      await settingsApi.deleteAcademicYear(id);
      toast.success('Academic year deleted');
      fetchYears();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <SectionTitle title="Academic Years" subtitle="Manage and switch academic years" />
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
            New Year
          </Button>
        </Box>

        {loading ? (
          <Box textAlign="center" py={4}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {years.map((y) => (
                <TableRow key={y.id} hover sx={y.isCurrent ? { bgcolor: 'action.hover' } : {}}>
                  <TableCell sx={{ fontWeight: y.isCurrent ? 700 : 400 }}>{y.name}</TableCell>
                  <TableCell>{new Date(y.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(y.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {y.isCurrent
                      ? <Chip icon={<CheckCircle />} label="Current" size="small" color="success" />
                      : <Chip label="Inactive" size="small" variant="outlined" />}
                  </TableCell>
                  <TableCell align="right">
                    {!y.isCurrent && (
                      <Tooltip title="Set as current year">
                        <Button size="small" variant="outlined" onClick={() => handleSetCurrent(y.id)} sx={{ mr: 1 }}>
                          Set Current
                        </Button>
                      </Tooltip>
                    )}
                    <IconButton size="small" color="error" onClick={() => handleDelete(y.id, y.name)}
                      disabled={y.isCurrent}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!years.length && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary" py={2}>No academic years configured</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <AcademicYearDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSaved={fetchYears} />
    </Card>
  );
};

// ══════════════════════════════════════════════════════════════
// TAB 6 — Branches
// ══════════════════════════════════════════════════════════════
const BranchDialog = ({ open, onClose, initial, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    reset(initial || { name: '', address: '', phone: '', email: '' });
  }, [initial, open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await settingsApi.upsertBranch({ ...data, id: initial?.id });
      toast.success(initial?.id ? 'Branch updated' : 'Branch created');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving branch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initial?.id ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
      <DialogContent>
        <Box component="form" id="branch-form" onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth label="Branch Name" size="small" margin="normal"
            error={!!errors.name} helperText={errors.name?.message}
            {...register('name', { required: 'Required' })} />
          <TextField fullWidth label="Address" size="small" margin="normal" multiline rows={2}
            error={!!errors.address} helperText={errors.address?.message}
            {...register('address', { required: 'Required' })} />
          <TextField fullWidth label="Phone" size="small" margin="normal" {...register('phone')} />
          <TextField fullWidth label="Email" size="small" margin="normal" type="email" {...register('email')} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="branch-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BranchesTab = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetchBranches = async () => {
    try {
      const { data } = await settingsApi.getBranches();
      setBranches(data.data);
    } catch { toast.error('Failed to load branches'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete branch "${name}"?`)) return;
    try {
      await settingsApi.deleteBranch(id);
      toast.success('Branch deleted');
      fetchBranches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <SectionTitle title="Branches / Campuses" subtitle="Manage school branches" />
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialog({ open: true, initial: null })}>
            Add Branch
          </Button>
        </Box>

        {loading ? (
          <Box textAlign="center" py={4}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={2}>
            {branches.map((b) => (
              <Grid item xs={12} sm={6} md={4} key={b.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, mr: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{b.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{b.address}</Typography>
                        {b.phone && <Typography variant="caption" display="block">{b.phone}</Typography>}
                        {b.email && <Typography variant="caption" display="block">{b.email}</Typography>}
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => setDialog({ open: true, initial: b })}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(b.id, b.name)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={`${b._count?.classes || 0} Classes`} size="small" variant="outlined" />
                      <Chip label={`${b._count?.staff || 0} Staff`} size="small" variant="outlined" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {!branches.length && (
              <Grid item xs={12}>
                <Typography color="text.secondary" textAlign="center" py={4}>No branches configured</Typography>
              </Grid>
            )}
          </Grid>
        )}
      </CardContent>
      <BranchDialog
        open={dialog.open}
        initial={dialog.initial}
        onClose={() => setDialog({ open: false, initial: null })}
        onSaved={fetchBranches}
      />
    </Card>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ══════════════════════════════════════════════════════════════
const SettingsPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState(null);
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const fetchProfile = async () => {
    try {
      const { data } = await settingsApi.getProfile();
      setProfile(data.data);
    } catch { toast.error('Failed to load profile'); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const tabs = [
    { label: 'My Profile', icon: <Person />, component: <ProfileTab profile={profile} onRefresh={fetchProfile} /> },
    { label: 'Security', icon: <Lock />, component: <SecurityTab /> },
    ...(isAdmin ? [
      { label: 'School Info', icon: <School />, component: <SchoolSettingsTab /> },
      { label: 'Grade Settings', icon: <Grade />, component: <GradeSettingsTab /> },
      { label: 'Academic Years', icon: <CalendarMonth />, component: <AcademicYearsTab /> },
      { label: 'Branches', icon: <AccountTree />, component: <BranchesTab /> },
    ] : []),
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Settings</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((t, i) => (
            <Tab key={i} label={t.label} icon={t.icon} iconPosition="start"
              sx={{ minHeight: 48, textTransform: 'none', fontWeight: 500 }} />
          ))}
        </Tabs>
      </Box>

      {tabs.map((t, i) => (
        <TabPanel key={i} value={tab} index={i}>
          {t.component}
        </TabPanel>
      ))}
    </Box>
  );
};

export default SettingsPage;
