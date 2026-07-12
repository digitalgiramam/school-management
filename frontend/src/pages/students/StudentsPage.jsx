import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Grid, TextField, Button, MenuItem, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, Chip, Avatar, CircularProgress,
  InputAdornment, TablePagination, CardContent,
} from '@mui/material';
import { Add, Search, Visibility, Edit, PersonOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { studentApi, sectionApi, classApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

const StudentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('true');
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    Promise.all([classApi.getAll({ limit: 200 }), sectionApi.getAll({ limit: 200 })])
      .then(([c, s]) => { setClasses(c.data.data || []); setSections(s.data.data || []); });
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await studentApi.getAll({
        search: search || undefined,
        classId: classFilter || undefined,
        sectionId: sectionFilter || undefined,
        isActive: statusFilter || undefined,
        page: page + 1, limit: 20,
      });
      setStudents(data.students || data.data || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [search, classFilter, sectionFilter, statusFilter, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try { await studentApi.deactivate(id); toast.success('Student deactivated'); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const filteredSections = sections.filter(s => !classFilter || s.classId === classFilter);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Students</Typography>
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/students/new')}>
            Add Student
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" placeholder="Search name / admission no…"
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth select size="small" label="Class" value={classFilter}
                onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(''); setPage(0); }}>
                <MenuItem value="">All Classes</MenuItem>
                {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth select size="small" label="Section" value={sectionFilter}
                onChange={(e) => { setSectionFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Sections</MenuItem>
                {filteredSections.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth select size="small" label="Status" value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
                <MenuItem value="">All</MenuItem>
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
                  <TableCell>Student</TableCell>
                  <TableCell>Adm. No.</TableCell>
                  <TableCell>Class / Section</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={s.user?.profilePhoto} sx={{ width: 32, height: 32, fontSize: 13 }}>
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{s.firstName} {s.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.user?.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{s.admissionNumber}</TableCell>
                    <TableCell>{s.section?.class?.name}{s.section ? ` — ${s.section.name}` : ''}</TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell>
                      {s.parent ? `${s.parent.firstName} ${s.parent.lastName}` : <Typography color="text.disabled" variant="caption">None</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip label={s.isActive ? 'Active' : 'Inactive'} size="small"
                        color={s.isActive ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => navigate(`/students/${s.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      {isAdmin && s.isActive && (
                        <IconButton size="small" color="error"
                          onClick={() => handleDeactivate(s.id, `${s.firstName} ${s.lastName}`)}>
                          <PersonOff fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!students.length && (
                  <TableRow><TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3}>No students found</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination component="div" count={total} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
          </>
        )}
      </Card>
    </Box>
  );
};

export default StudentsPage;
