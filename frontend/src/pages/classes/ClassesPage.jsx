import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Tabs, Tab, Typography, Card, CardContent, Button, Grid,
  TextField, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, InputAdornment, Switch, FormControlLabel, Divider,
  Checkbox, FormGroup,
} from '@mui/material';
import { Add, Edit, Delete, Search, Class, ViewModule, MenuBook, AccountTree } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { classApi, sectionApi, subjectApi, classMappingApi } from '../../api/axios';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

// ─── Reusable inline edit dialog ────────────────────────────────
const SimpleDialog = ({ open, onClose, title, children, onSave, saving }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
    <DialogContent sx={{ pt: 1 }}>{children}</DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </DialogActions>
  </Dialog>
);

// ─── Status chip ────────────────────────────────────────────────
const StatusChip = ({ active }) => (
  <Chip
    label={active ? 'Active' : 'Inactive'}
    color={active ? 'success' : 'default'}
    size="small"
    variant="outlined"
  />
);

// ════════════════════════════════════════════════════════════════
// TAB 1 — CLASSES
// ════════════════════════════════════════════════════════════════
const ClassesTab = ({ isAdmin }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false, row: null });
  const [form, setForm] = useState({ name: '', displayOrder: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await classApi.getAll({ search: search || undefined, limit: 200 });
      setRows(data.data || []);
    } catch { toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openDialog = (row = null) => {
    setForm(row
      ? { name: row.name, displayOrder: row.displayOrder ?? 0, isActive: row.isActive ?? true }
      : { name: '', displayOrder: '', isActive: true }
    );
    setDialog({ open: true, row });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Class name is required');
    setSaving(true);
    try {
      if (dialog.row?.id) {
        await classApi.update(dialog.row.id, form);
        toast.success('Class updated');
      } else {
        await classApi.create(form);
        toast.success('Class created');
      }
      setDialog({ open: false, row: null });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete class "${row.name}"?`)) return;
    try {
      await classApi.remove(row.id);
      toast.success('Class deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search classes…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ maxWidth: 280 }}
        />
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} sx={{ ml: 'auto' }} onClick={() => openDialog()}>
            Add Class
          </Button>
        )}
      </Box>

      {loading ? <Box textAlign="center" py={6}><CircularProgress /></Box> : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Class Name</TableCell>
              <TableCell>Academic Year</TableCell>
              <TableCell>Sections</TableCell>
              <TableCell>Subjects</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">
                <Typography color="text.secondary" py={3}>No classes yet — click Add Class to get started</Typography>
              </TableCell></TableRow>
            ) : rows.map((r, i) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{r.displayOrder || i + 1}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                <TableCell>
                  {r.academicYear?.name}
                  {r.academicYear?.isCurrent && <Chip label="Current" size="small" color="primary" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell><Chip label={r._count?.classSections ?? r._count?.sections ?? 0} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={r._count?.classSubjects ?? 0} size="small" variant="outlined" color="secondary" /></TableCell>
                <TableCell><StatusChip active={r.isActive !== false} /></TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openDialog(r)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(r)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SimpleDialog open={dialog.open} onClose={() => setDialog({ open: false, row: null })}
        title={dialog.row ? 'Edit Class' : 'Add Class'} onSave={handleSave} saving={saving}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Class Name *" placeholder="e.g. Grade 1"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Display Order" type="number" placeholder="0"
              value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label="Active"
            />
          </Grid>
        </Grid>
      </SimpleDialog>
    </Box>
  );
};

// ════════════════════════════════════════════════════════════════
// TAB 2 — SECTIONS
// ════════════════════════════════════════════════════════════════
const SectionsTab = ({ isAdmin }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false, row: null });
  const [form, setForm] = useState({ name: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sectionApi.getAll({ limit: 200, masterOnly: true });
      setRows(data.data || []);
    } catch { toast.error('Failed to load sections'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openDialog = (row = null) => {
    setForm(row
      ? { name: row.name, isActive: row.isActive ?? true }
      : { name: '', isActive: true }
    );
    setDialog({ open: true, row });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Section name is required');
    setSaving(true);
    try {
      if (dialog.row?.id) {
        await sectionApi.update(dialog.row.id, { name: form.name, isActive: form.isActive });
        toast.success('Section updated');
      } else {
        await sectionApi.create({ name: form.name, isActive: form.isActive });
        toast.success('Section created');
      }
      setDialog({ open: false, row: null });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete section "${row.name}"?`)) return;
    try {
      await sectionApi.remove(row.id);
      toast.success('Section deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  // Filter by search
  const filtered = rows.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search sections…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ maxWidth: 280 }}
        />
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} sx={{ ml: 'auto' }} onClick={() => openDialog()}>
            Add Section
          </Button>
        )}
      </Box>

      {loading ? <Box textAlign="center" py={6}><CircularProgress /></Box> : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Section Name</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} align="center">
                <Typography color="text.secondary" py={3}>
                  No sections yet — add section labels like A, B, C, Red, Blue
                </Typography>
              </TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontWeight: 600, fontSize: 15 }}>{r.name}</TableCell>
                <TableCell><StatusChip active={r.isActive !== false} /></TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openDialog(r)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(r)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SimpleDialog open={dialog.open} onClose={() => setDialog({ open: false, row: null })}
        title={dialog.row ? 'Edit Section' : 'Add Section'} onSave={handleSave} saving={saving}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Section Name *" placeholder="e.g. A or Red"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label="Active"
            />
          </Grid>
        </Grid>
      </SimpleDialog>
    </Box>
  );
};

// ════════════════════════════════════════════════════════════════
// TAB 3 — SUBJECTS
// ════════════════════════════════════════════════════════════════
const SubjectsTab = ({ isAdmin }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState({ open: false, row: null });
  const [form, setForm] = useState({ name: '', code: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await subjectApi.getAll({ search: search || undefined, limit: 200 });
      setRows(data.data || []);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openDialog = (row = null) => {
    setForm(row
      ? { name: row.name, code: row.code || '', isActive: row.isActive ?? true }
      : { name: '', code: '', isActive: true }
    );
    setDialog({ open: true, row });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Subject name is required');
    setSaving(true);
    try {
      if (dialog.row?.id) {
        await subjectApi.update(dialog.row.id, form);
        toast.success('Subject updated');
      } else {
        await subjectApi.create(form);
        toast.success('Subject created');
      }
      setDialog({ open: false, row: null });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete subject "${row.name}"?`)) return;
    try {
      await subjectApi.remove(row.id);
      toast.success('Subject deleted');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small" placeholder="Search subjects…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ maxWidth: 280 }}
        />
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} sx={{ ml: 'auto' }} onClick={() => openDialog()}>
            Add Subject
          </Button>
        )}
      </Box>

      {loading ? <Box textAlign="center" py={6}><CircularProgress /></Box> : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subject Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center">
                <Typography color="text.secondary" py={3}>
                  No subjects yet — add subjects like English, Mathematics, Science
                </Typography>
              </TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{r.name}</TableCell>
                <TableCell>
                  {r.code ? <Chip label={r.code} size="small" variant="outlined" /> : '—'}
                </TableCell>
                <TableCell><StatusChip active={r.isActive !== false} /></TableCell>
                {isAdmin && (
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openDialog(r)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(r)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SimpleDialog open={dialog.open} onClose={() => setDialog({ open: false, row: null })}
        title={dialog.row ? 'Edit Subject' : 'Add Subject'} onSave={handleSave} saving={saving}>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Subject Name *" placeholder="e.g. Mathematics"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="Subject Code" placeholder="e.g. MATH"
              value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label="Active"
            />
          </Grid>
        </Grid>
      </SimpleDialog>
    </Box>
  );
};

// ════════════════════════════════════════════════════════════════
// TAB 4 — CLASS MAPPING
// ════════════════════════════════════════════════════════════════
const ClassMappingTab = ({ isAdmin }) => {
  const [classes, setClasses] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [checkedSections, setCheckedSections] = useState(new Set());
  const [checkedSubjects, setCheckedSubjects] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectionSearch, setSectionSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');

  useEffect(() => {
    Promise.all([
      classApi.getAll({ limit: 200 }),
      sectionApi.getAll({ limit: 200, masterOnly: true }),
      subjectApi.getAll({ limit: 200 }),
    ]).then(([c, s, sub]) => {
      setClasses(c.data.data || []);
      // Master sections (no classId)
      setAllSections((s.data.data || []).filter((sec) => sec.isActive !== false));
      setAllSubjects((sub.data.data || []).filter((su) => su.isActive !== false));
    }).catch(() => toast.error('Failed to load data'));
  }, []);

  const loadMapping = async (cls) => {
    setSelectedClass(cls);
    setCheckedSections(new Set());
    setCheckedSubjects(new Set());
    setLoading(true);
    try {
      const { data } = await classMappingApi.getByClass(cls.id);
      const mapping = data.data || data;
      setCheckedSections(new Set((mapping.sections || []).map((s) => s.id)));
      setCheckedSubjects(new Set((mapping.subjects || []).map((s) => s.id)));
    } catch { toast.error('Failed to load mapping'); }
    finally { setLoading(false); }
  };

  const toggleSection = (id) => {
    setCheckedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSubject = (id) => {
    setCheckedSubjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      await classMappingApi.saveMapping(
        selectedClass.id,
        Array.from(checkedSections),
        Array.from(checkedSubjects),
      );
      toast.success(`Mapping saved for ${selectedClass.name}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const filteredSections = allSections.filter((s) =>
    !sectionSearch || s.name.toLowerCase().includes(sectionSearch.toLowerCase())
  );
  const filteredSubjects = allSubjects.filter((s) =>
    !subjectSearch || s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    (s.code || '').toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <Grid container spacing={3}>
      {/* Left — class picker */}
      <Grid item xs={12} sm={3}>
        <Typography variant="subtitle2" fontWeight={700} mb={1} color="text.secondary">
          SELECT CLASS
        </Typography>
        {classes.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            No classes found. Add classes first.
          </Typography>
        ) : classes.map((cls) => {
          const selected = selectedClass?.id === cls.id;
          return (
            <Box key={cls.id} onClick={() => loadMapping(cls)}
              sx={{
                px: 1.5, py: 1, borderRadius: 1, cursor: 'pointer', mb: 0.5,
                border: '1px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'primary.main' : 'transparent',
                color: selected ? 'white' : 'text.primary',
                '&:hover': { bgcolor: selected ? 'primary.dark' : 'action.hover' },
              }}
            >
              <Typography variant="body2" fontWeight={selected ? 700 : 400}>{cls.name}</Typography>
              {cls.academicYear?.isCurrent && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Current year</Typography>
              )}
            </Box>
          );
        })}
      </Grid>

      {/* Right — mapping panel */}
      <Grid item xs={12} sm={9}>
        {!selectedClass ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <AccountTree sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography>Select a class to configure its sections and subjects</Typography>
          </Box>
        ) : loading ? (
          <Box textAlign="center" py={6}><CircularProgress /></Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>{selectedClass.name}</Typography>
              {isAdmin && (
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Mapping'}
                </Button>
              )}
            </Box>

            <Grid container spacing={3}>
              {/* Sections */}
              <Grid item xs={12} sm={5}>
                <Typography variant="subtitle2" fontWeight={700} mb={1} color="primary.main">
                  SECTIONS ({checkedSections.size} selected)
                </Typography>
                <TextField
                  fullWidth size="small" placeholder="Search sections…"
                  value={sectionSearch} onChange={(e) => setSectionSearch(e.target.value)}
                  sx={{ mb: 1 }}
                />
                {allSections.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No sections found. Go to Sections tab to add A, B, C etc.
                  </Typography>
                ) : (
                  <Card variant="outlined" sx={{ maxHeight: 320, overflowY: 'auto' }}>
                    <FormGroup sx={{ px: 1 }}>
                      {filteredSections.map((s) => (
                        <FormControlLabel
                          key={s.id}
                          control={
                            <Checkbox
                              size="small"
                              checked={checkedSections.has(s.id)}
                              onChange={() => isAdmin && toggleSection(s.id)}
                              disabled={!isAdmin}
                            />
                          }
                          label={<Typography variant="body2">{s.name}</Typography>}
                        />
                      ))}
                    </FormGroup>
                  </Card>
                )}
              </Grid>

              <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Divider orientation="vertical" flexItem />
              </Grid>

              {/* Subjects */}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" fontWeight={700} mb={1} color="secondary.main">
                  SUBJECTS ({checkedSubjects.size} selected)
                </Typography>
                <TextField
                  fullWidth size="small" placeholder="Search subjects…"
                  value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)}
                  sx={{ mb: 1 }}
                />
                {allSubjects.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    No subjects found. Go to Subjects tab to add them.
                  </Typography>
                ) : (
                  <Card variant="outlined" sx={{ maxHeight: 320, overflowY: 'auto' }}>
                    <FormGroup sx={{ px: 1 }}>
                      {filteredSubjects.map((s) => (
                        <FormControlLabel
                          key={s.id}
                          control={
                            <Checkbox
                              size="small"
                              checked={checkedSubjects.has(s.id)}
                              onChange={() => isAdmin && toggleSubject(s.id)}
                              disabled={!isAdmin}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{s.name}</Typography>
                              {s.code && <Typography variant="caption" color="text.secondary">{s.code}</Typography>}
                            </Box>
                          }
                        />
                      ))}
                    </FormGroup>
                  </Card>
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
const ClassesPage = () => {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const [tab, setTab] = useState(0);

  const TABS = [
    { label: 'Classes', icon: <Class /> },
    { label: 'Sections', icon: <ViewModule /> },
    { label: 'Subjects', icon: <MenuBook /> },
    { label: 'Class Mapping', icon: <AccountTree /> },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Academic Setup</Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            {TABS.map((t, i) => (
              <Tab key={i} icon={t.icon} iconPosition="start" label={t.label}
                sx={{ textTransform: 'none', minHeight: 48 }} />
            ))}
          </Tabs>
        </Box>
        <CardContent sx={{ pt: 2 }}>
          {tab === 0 && <ClassesTab isAdmin={isAdmin} />}
          {tab === 1 && <SectionsTab isAdmin={isAdmin} />}
          {tab === 2 && <SubjectsTab isAdmin={isAdmin} />}
          {tab === 3 && <ClassMappingTab isAdmin={isAdmin} />}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClassesPage;
