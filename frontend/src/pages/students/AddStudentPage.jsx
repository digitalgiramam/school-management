import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Divider, CircularProgress,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { studentApi, sectionApi, classApi } from '../../api/axios';
import toast from 'react-hot-toast';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const AddStudentPage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm();

  const selectedClass = watch('classId');

  useEffect(() => {
    Promise.all([classApi.getAll({ limit: 200 }), sectionApi.getAll({ limit: 200 })])
      .then(([c, s]) => { setClasses(c.data.data || []); setSections(s.data.data || []); });
  }, []);

  const filteredSections = sections.filter(s => s.classId === selectedClass);

  const onSubmit = async (data) => {
    const { classId, ...payload } = data;
    setSaving(true);
    try {
      const res = await studentApi.create(payload);
      toast.success('Student created! Login credentials sent to email.');
      navigate(`/students/${res.data.data?.id || res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create student');
    } finally { setSaving(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/students')}>Back</Button>
        <Typography variant="h5" fontWeight={700}>Add New Student</Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Personal Info */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Personal Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="First Name *"
                      {...register('firstName', { required: 'Required' })}
                      error={!!errors.firstName} helperText={errors.firstName?.message} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Middle Name"
                      {...register('middleName')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Last Name *"
                      {...register('lastName', { required: 'Required' })}
                      error={!!errors.lastName} helperText={errors.lastName?.message} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Email *" type="email"
                      {...register('email', { required: 'Required' })}
                      error={!!errors.email} helperText={errors.email?.message} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" type="date" label="Date of Birth"
                      InputLabelProps={{ shrink: true }} {...register('dateOfBirth')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="gender" control={control} defaultValue="MALE" render={({ field }) => (
                      <TextField fullWidth select size="small" label="Gender" {...field}>
                        {GENDERS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                      </TextField>
                    )} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="bloodGroup" control={control} defaultValue="" render={({ field }) => (
                      <TextField fullWidth select size="small" label="Blood Group" {...field}>
                        <MenuItem value="">Unknown</MenuItem>
                        {BLOOD_GROUPS.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                      </TextField>
                    )} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Phone" {...register('phone')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" type="date" label="Admission Date"
                      InputLabelProps={{ shrink: true }} {...register('admissionDate')} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Address" multiline rows={2}
                      {...register('address')} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Academic Info */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Academic Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Controller name="classId" control={control} defaultValue="" render={({ field }) => (
                      <TextField fullWidth select size="small" label="Class" {...field}>
                        <MenuItem value="">Select Class</MenuItem>
                        {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </TextField>
                    )} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="sectionId" control={control} defaultValue="" render={({ field }) => (
                      <TextField fullWidth select size="small" label="Section" {...field}
                        disabled={!selectedClass}>
                        <MenuItem value="">Select Section</MenuItem>
                        {filteredSections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                      </TextField>
                    )} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Admission Number"
                      {...register('admissionNumber')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Roll Number" {...register('rollNumber')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller name="category" control={control} defaultValue="GENERAL" render={({ field }) => (
                      <TextField fullWidth select size="small" label="Category" {...field}>
                        {['GENERAL', 'OBC', 'SC', 'ST', 'EWS'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </TextField>
                    )} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Previous School" {...register('previousSchool')} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Guardian */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Guardian / Emergency Contact</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Father's Name" {...register('fatherName')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Mother's Name" {...register('motherName')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Guardian Phone" {...register('guardianPhone')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Guardian Email" type="email"
                      {...register('guardianEmail')} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => navigate('/students')}>Cancel</Button>
              <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
                {saving ? 'Creating…' : 'Create Student'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AddStudentPage;
