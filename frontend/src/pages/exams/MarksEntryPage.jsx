import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell,
  TableBody, TextField, Button, CircularProgress, Chip, Checkbox, FormControlLabel,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { examApi, sectionApi, studentApi } from '../../api/axios';
import toast from 'react-hot-toast';

const MarksEntryPage = () => {
  const { id: examSubjectId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [absent, setAbsent] = useState({});
  const [examSubject, setExamSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load exam subject and students in the section
    const loadData = async () => {
      try {
        // We'll fetch students and existing marks
        const { data } = await examApi.getById(examSubjectId).catch(() => ({ data: {} }));
        setExamSubject(data.data || data);
        // Load students - you'd need section from exam subject
        setLoading(false);
      } catch { setLoading(false); }
    };
    loadData();
  }, [examSubjectId]);

  const updateMark = (studentId, value) => {
    setMarks(p => ({ ...p, [studentId]: value }));
  };

  const toggleAbsent = (studentId) => {
    setAbsent(p => ({ ...p, [studentId]: !p[studentId] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const marksData = students.map(s => ({
        studentId: s.id,
        marksObtained: absent[s.id] ? 0 : Number(marks[s.id] || 0),
        isAbsent: !!absent[s.id],
      }));
      await examApi.saveBulkMarks(examSubjectId, marksData);
      toast.success('Marks saved successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save marks'); }
    finally { setSaving(false); }
  };

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/exams')}>Back</Button>
        <Box>
          <Typography variant="h5" fontWeight={700}>Marks Entry</Typography>
          {examSubject && (
            <Typography variant="body2" color="text.secondary">
              {examSubject.subject?.name} · Max: {examSubject.maxMark} · Pass: {examSubject.passMark}
            </Typography>
          )}
        </Box>
      </Box>

      <Card>
        {students.length ? (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Adm. No.</TableCell>
                  <TableCell>Absent</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Marks {examSubject && `(/ ${examSubject.maxMark})`}</TableCell>
                  <TableCell>Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s, i) => {
                  const m = Number(marks[s.id] || 0);
                  const max = examSubject?.maxMark || 100;
                  const pct = max > 0 ? (m / max) * 100 : 0;
                  return (
                    <TableRow key={s.id} hover sx={absent[s.id] ? { bgcolor: 'action.disabledBackground' } : {}}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{s.firstName} {s.lastName}</TableCell>
                      <TableCell>{s.admissionNumber}</TableCell>
                      <TableCell>
                        <Checkbox size="small" checked={!!absent[s.id]}
                          onChange={() => toggleAbsent(s.id)} />
                      </TableCell>
                      <TableCell>
                        <TextField size="small" type="number" disabled={!!absent[s.id]}
                          value={absent[s.id] ? '' : (marks[s.id] || '')}
                          onChange={(e) => updateMark(s.id, e.target.value)}
                          inputProps={{ min: 0, max: examSubject?.maxMark || 100 }}
                          sx={{ width: 80 }} />
                      </TableCell>
                      <TableCell>
                        {!absent[s.id] && marks[s.id] !== undefined && (
                          <Chip label={pct >= 90 ? 'A+' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'F'}
                            size="small"
                            color={pct >= 40 ? 'success' : 'error'} />
                        )}
                        {absent[s.id] && <Chip label="AB" size="small" color="default" />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Marks'}
              </Button>
            </Box>
          </>
        ) : (
          <CardContent>
            <Typography color="text.secondary" textAlign="center" py={4}>
              No students loaded. Select a section to begin marks entry.
            </Typography>
          </CardContent>
        )}
      </Card>
    </Box>
  );
};

export default MarksEntryPage;
