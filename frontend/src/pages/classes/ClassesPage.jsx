import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Tabs, Tab, Typography, Card, CardContent, Button, Grid,
  TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Tooltip, InputAdornment, TablePagination,
} from '@mui/material';
import { Add, Edit, Delete, Search, Class, ViewModule, MenuBook } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { classApi, sectionApi, subjectApi, departmentApi } from '../../api/axios';
import { settingsApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

// ── Generic CRUD Dialog ───────────────────────────────────────
const FormDialog = ({ open, onClose, title, fields, initial, onSubmit: onSave }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm();

  useEffect(() => {
    const defaults = {};
    fields.forEach((f) => { defaults[f.name] = initial?.[f.name] ?? f.default ?? ''; });
    reset(defaults);
  }, [initial, open]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      await onSave(data, initial?.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial?.id ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
      <DialogContent>
        <Box component="form" id="generic-form" onSubmit={handleSubmit(handleSave)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {fields.map((f) =>
              f.options ? (
                <Grid item xs={12} sm={f.half ? 6 : 12} key={f.name}>
                  <Controller name={f.name} control={control} defaultValue={f.default || ''}
                    render={({ field }) => (
                      <TextField fullWidth select label={f.label} size="small" {...field}>
                        {f.allowEmpty && <MenuItem value="">None</MenuItem>}
                        {f.options.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </TextField>
                    )} />
                </Grid>
              ) : (
                <Grid item xs={12} sm={f.half ? 6 : 12} key={f.name}>
                  <TextField
                    fullWidth size="small" label={f.label} type={f.type || 'text'}
                    error={!!errors[f.name]} helperText={errors[f.name]?.message}
                    {...register(f.name, { required: f.required ? 'Required' : false })}
                  />
                </Grid>
              )
            )}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="generic-form" variant="contained" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Classes Tab ───────────────────────────────────────────────
const ClassesTab = ({ isAdmin }) => {
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ayFilter, setAyFilter] = useState('');
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, ay, br] = await Promise.all([
        classApi.getAll({ search: search || undefined, academicYearId: ayFilter || undefined, limit: 100 }),
        settingsApi.getAcademicYears(),
        settingsApi.getBranches(),
      ]);
      setClasses(cls.data.data);
      setAcademicYears(ay.data.data || []);
      setBranches(br.data.data || []);
    } catch { toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  }, [search, ayFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (data, id) => {
    if (id) await classApi.update(id, data);
    else await classApi.create(data);
    toast.success(id ? 'Class updated' : 'Class created');
    fetchAll();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete class "${name}"?`)) return;
    try {
      await classApi.remove(id);
      toast.success('Deleted');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const fields = [
    { name: 'name', label: 'Class Name (e.g. Grade 10)', required: true },
    {
      name: 'academicYearId', label: 'Academic Year', required: true,
      options: academicYears.map((a) => ({ value: a.id, label: a.name })),
    },
    {
      name: 'branchId', label: 'Branch', required: true,
      options: branches.map((b) => ({ value: b.id, label: b.name })),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Search…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        <TextField select size="small" label="Academic Year" value={ayFilter}
          onChange={(e) => setAyFilter(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All Years</MenuItem>
          {academicYears.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
        </TextField>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} sx={{ ml: 'auto' }}
            onClick={() => setDialog({ open: true, initial: null })}>
            Add Class
          </Button>
        )}
      </Box>

      {loading ? (
        <Box textAlign="center" py={4}><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Class Name</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Sections</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell fontWeight={600}>{c.name}</TableCell>
                <TableCell>
                  {c.academicYear?.name}
                  {c.academicYear?.isCurrent && <Chip label="Current" size="small" color="success" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell>{c.branch?.name}</TableCell>
                <TableCell>
                  <Chip label={`${c._count?.sections || 0} sections`} size="small" variant="outlined" />
                </TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setDialog({ open: true, initial: c })}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(c.id, c.name)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!classes.length && (
              <TableRow><TableCell colSpan={5} align="center">
                <Typography color="text.secondary" py={3}>No classes found</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <FormDialog open={dialog.open} title="Class" fields={fields}
        initial={dialog.initial} onClose={() => setDialog({ open: false, initial: null })}
        onSubmit={handleSave} />
    </Box>
  );
};

// ── Sections Tab ──────────────────────────────────────────────
const SectionsTab = ({ isAdmin }) => {
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sec, cls] = await Promise.all([
        sectionApi.getAll({ classId: classFilter || undefined, limit: 200 }),
        classApi.getAll({ limit: 200 }),
      ]);
      setSections(sec.data.data);
      setClasses(cls.data.data);
    } catch { toast.error('Failed to load sections'); }
    finally { setLoading(false); }
  }, [classFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (data, id) => {
    if (id) await sectionApi.update(id, data);
    else await sectionApi.create(data);
    toast.success(id ? 'Section updated' : 'Section created');
    fetchAll();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete section "${name}"?`)) return;
    try {
      await sectionApi.remove(id);
      toast.success('Deleted');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const fields = [
    { name: 'name', label: 'Section Name (e.g. A)', required: true, half: true },
    { name: 'capacity', label: 'Capacity', type: 'number', half: true, default: '40' },
    {
      name: 'classId', label: 'Class', required: true,
      options: classes.map((c) => ({ value: c.id, label: c.name })),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField select size="small" label="Filter by Class" value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="">All Classes</MenuItem>
          {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} sx={{ ml: 'auto' }}
            onClick={() => setDialog({ open: true, initial: null })}>
            Add Section
          </Button>
        )}
      </Box>

      {loading ? (
        <Box textAlign="center" py={4}><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Section</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Class Teacher</TableCell>
              <TableCell>Students</TableCell>
              <TableCell>Capacity</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sections.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell fontWeight={600}>{s.name}</TableCell>
                <TableCell>{s.class?.name}</TableCell>
                <TableCell>
                  {s.teacher
                    ? `${s.teacher.firstName} ${s.teacher.lastName}`
                    : <Typography variant="caption" color="text.secondary">Not assigned</Typography>}
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${s._count?.students || 0} / ${s.capacity}`}
                    size="small"
                    color={s._count?.students >= s.capacity ? 'error' : 'success'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{s.capacity}</TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setDialog({ open: true, initial: s })}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(s.id, s.name)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!sections.length && (
              <TableRow><TableCell colSpan={6} align="center">
                <Typography color="text.secondary" py={3}>No sections found</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <FormDialog open={dialog.open} title="Section" fields={fields}
        initial={dialog.initial} onClose={() => setDialog({ open: false, initial: null })}
        onSubmit={handleSave} />
    </Box>
  );
};

// ── Subjects Tab ──────────────────────────────────────────────
const SubjectsTab = ({ isAdmin }) => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false, initial: null });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sub, dept] = await Promise.all([
        subjectApi.getAll({ search: search || undefined, limit: 200 }),
        departmentApi.getAll({ limit: 100 }),
      ]);
      setSubjects(sub.data.data);
      setDepartments(dept.data.data || []);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSave = async (data, id) => {
    if (id) await subjectApi.update(id, data);
    else await subjectApi.create(data);
    toast.success(id ? 'Subject updated' : 'Subject created');
    fetchAll();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete subject "${name}"?`)) return;
    try {
      await subjectApi.remove(id);
      toast.success('Deleted');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const fields = [
    { name: 'name', label: 'Subject Name', required: true, half: true },
    { name: 'code', label: 'Subject Code', required: true, half: true },
    {
      name: 'departmentId', label: 'Department', allowEmpty: true,
      options: departments.map((d) => ({ value: d.id, label: d.name })),
    },
    { name: 'passMark', label: 'Pass Mark', type: 'number', half: true, default: '40' },
    { name: 'totalMark', label: 'Total Mark', type: 'number', half: true, default: '100' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Search name or code…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} sx={{ ml: 'auto' }}
            onClick={() => setDialog({ open: true, initial: null })}>
            Add Subject
          </Button>
        )}
      </Box>

      {loading ? (
        <Box textAlign="center" py={4}><CircularProgress /></Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Pass Mark</TableCell>
              <TableCell>Total Mark</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Teachers</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {subjects.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell fontWeight={600}>{s.name}</TableCell>
                <TableCell><Chip label={s.code} size="small" variant="outlined" /></TableCell>
                <TableCell>{s.department?.name || '—'}</TableCell>
                <TableCell>{s.passMark}</TableCell>
                <TableCell>{s.totalMark}</TableCell>
                <TableCell>
                  <Chip
                    label={s.isElective ? 'Elective' : 'Core'}
                    size="small"
                    color={s.isElective ? 'info' : 'default'}
                  />
                </TableCell>
                <TableCell>{s._count?.teacherSubjects || 0}</TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setDialog({ open: true, initial: s })}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(s.id, s.name)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {!subjects.length && (
              <TableRow><TableCell colSpan={8} align="center">
                <Typography color="text.secondary" py={3}>No subjects found</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
      <FormDialog open={dialog.open} title="Subject" fields={fields}
        initial={dialog.initial} onClose={() => setDialog({ open: false, initial: null })}
        onSubmit={handleSave} />
    </Box>
  );
};

// ── Main Page ──────────────────────────────────────────────────
const ClassesPage = () => {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Academic Structure</Typography>
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab icon={<Class />} iconPosition="start" label="Classes" sx={{ textTransform: 'none' }} />
            <Tab icon={<ViewModule />} iconPosition="start" label="Sections" sx={{ textTransform: 'none' }} />
            <Tab icon={<MenuBook />} iconPosition="start" label="Subjects" sx={{ textTransform: 'none' }} />
          </Tabs>
        </Box>
        <CardContent>
          {tab === 0 && <ClassesTab isAdmin={isAdmin} />}
          {tab === 1 && <SectionsTab isAdmin={isAdmin} />}
          {tab === 2 && <SubjectsTab isAdmin={isAdmin} />}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClassesPage;
