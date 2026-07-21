import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, MenuItem,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Divider, Avatar,
} from '@mui/material';
import { Add, Book } from '@mui/icons-material';
import { classApi, subjectApi, classSubjectApi, settingsApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ADMIN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'PRINCIPAL'];

const ClassSubjectsPage = () => {
  const { user } = useAuth();
  const canEdit = ADMIN_ROLES.includes(user?.role);

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAY, setSelectedAY] = useState('');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // full class object
  const [assigned, setAssigned] = useState([]);       // subjects already assigned
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [adding, setAdding] = useState(null); // subjectId being added

  // Load academic years
  useEffect(() => {
    settingsApi.getAcademicYears().then(({ data }) => {
      const years = data.data || [];
      setAcademicYears(years);
      const current = years.find((y) => y.isCurrent);
      if (current) setSelectedAY(current.id);
    });
  }, []);

  // Load classes for selected AY
  useEffect(() => {
    if (!selectedAY) return;
    setSelectedClass(null);
    setAssigned([]);
    classApi.getAll({ academicYearId: selectedAY, limit: 200 })
      .then(({ data }) => setClasses(data.data || []))
      .catch(() => toast.error('Failed to load classes'));
  }, [selectedAY]);

  // Load assigned subjects when a class is selected
  const loadAssigned = (classId) => {
    if (!classId) return;
    setLoading(true);
    classSubjectApi.getByClass(classId)
      .then(({ data }) => setAssigned(data.data || []))
      .catch(() => toast.error('Failed to load subjects'))
      .finally(() => setLoading(false));
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    loadAssigned(cls.id);
  };

  const handleRemove = async (subjectId) => {
    try {
      await classSubjectApi.remove(selectedClass.id, subjectId);
      setAssigned((prev) => prev.filter((s) => s.id !== subjectId));
      toast.success('Subject removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove subject');
    }
  };

  // Open "Add Subject" dialog — load all subjects
  const openDialog = () => {
    setSubjectSearch('');
    subjectApi.getAll({ limit: 200 })
      .then(({ data }) => setAllSubjects(data.data || []))
      .catch(() => toast.error('Failed to load subjects'));
    setDialogOpen(true);
  };

  const assignedIds = new Set(assigned.map((s) => s.id));

  const handleAdd = async (subjectId) => {
    setAdding(subjectId);
    try {
      await classSubjectApi.assign(selectedClass.id, subjectId);
      // Refresh assigned list
      loadAssigned(selectedClass.id);
      toast.success('Subject added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subject');
    } finally {
      setAdding(null);
    }
  };

  const filteredSubjects = allSubjects.filter((s) =>
    !subjectSearch ||
    s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Class Subjects</Typography>

      {/* Academic Year selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            select size="small" label="Academic Year" value={selectedAY}
            onChange={(e) => setSelectedAY(e.target.value)} sx={{ minWidth: 220 }}
          >
            {academicYears.map((y) => (
              <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left — Class list */}
        <Grid item xs={12} sm={4} md={3}>
          <Card>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="subtitle2" fontWeight={700} mb={1} px={1}>
                Classes ({classes.length})
              </Typography>
              {classes.length === 0 ? (
                <Typography variant="caption" color="text.secondary" px={1}>
                  No classes for this year
                </Typography>
              ) : (
                classes.map((cls) => {
                  const isSelected = selectedClass?.id === cls.id;
                  return (
                    <Box
                      key={cls.id}
                      onClick={() => handleSelectClass(cls)}
                      sx={{
                        px: 1.5, py: 1, borderRadius: 1, cursor: 'pointer', mb: 0.5,
                        bgcolor: isSelected ? 'primary.main' : 'transparent',
                        color: isSelected ? 'white' : 'text.primary',
                        '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' },
                      }}
                    >
                      <Typography variant="body2" fontWeight={isSelected ? 700 : 400}>
                        {cls.name}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right — Subjects panel */}
        <Grid item xs={12} sm={8} md={9}>
          {!selectedClass ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Book sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  Select a class to view and manage its subjects
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{selectedClass.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {assigned.length} subject{assigned.length !== 1 ? 's' : ''} assigned
                    </Typography>
                  </Box>
                  {canEdit && (
                    <Button variant="contained" size="small" startIcon={<Add />} onClick={openDialog}>
                      Add Subject
                    </Button>
                  )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {loading ? (
                  <Box textAlign="center" py={4}><CircularProgress /></Box>
                ) : assigned.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">
                      No subjects assigned to this class yet.
                    </Typography>
                    {canEdit && (
                      <Button variant="outlined" size="small" startIcon={<Add />} onClick={openDialog} sx={{ mt: 1 }}>
                        Add First Subject
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {assigned.map((sub) => (
                      <Chip
                        key={sub.id}
                        label={
                          <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, py: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>{sub.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{sub.code}</Typography>
                          </Box>
                        }
                        avatar={
                          <Avatar sx={{ bgcolor: sub.isElective ? 'secondary.main' : 'primary.main', width: 28, height: 28, fontSize: 11 }}>
                            {sub.code?.slice(0, 2)}
                          </Avatar>
                        }
                        onDelete={canEdit ? () => handleRemove(sub.id) : undefined}
                        variant="outlined"
                        sx={{ height: 'auto', py: 0.5, borderRadius: 2 }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Add Subject Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Subject to {selectedClass?.name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth size="small" placeholder="Search by name or code…"
            value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {filteredSubjects.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={3}>
                No subjects found
              </Typography>
            ) : (
              filteredSubjects.map((sub) => {
                const isAssigned = assignedIds.has(sub.id);
                return (
                  <Box
                    key={sub.id}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      px: 1.5, py: 1, borderRadius: 1, mb: 0.5,
                      bgcolor: isAssigned ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: isAssigned ? 'action.selected' : 'action.hover' },
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{sub.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sub.code}{sub.isElective ? ' · Elective' : ''}
                        {sub.department?.name ? ` · ${sub.department.name}` : ''}
                      </Typography>
                    </Box>
                    {isAssigned ? (
                      <Chip label="Added" size="small" color="success" variant="outlined" />
                    ) : (
                      <Button
                        size="small" variant="outlined"
                        disabled={adding === sub.id}
                        onClick={() => handleAdd(sub.id)}
                      >
                        {adding === sub.id ? <CircularProgress size={14} /> : 'Add'}
                      </Button>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassSubjectsPage;
