import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, CircularProgress,
  Tabs, Tab, Divider,
} from '@mui/material';
import { Download, Refresh } from '@mui/icons-material';
import { reportApi, classApi, sectionApi, settingsApi } from '../../api/axios';
import toast from 'react-hot-toast';

const TabPanel = ({ value, index, children }) =>
  value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;

// ─── Student Report ───────────────────────────────────────────────────────────
const StudentReport = ({ academicYears, classes, sections }) => {
  const [filters, setFilters] = useState({ academicYearId: '', classId: '', sectionId: '', status: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data: res } = await reportApi.getStudentReport(filters);
      setData(res.data || res);
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const f = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  return (
    <Box>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth select size="small" label="Academic Year" value={filters.academicYearId} onChange={(e) => f('academicYearId', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {academicYears.map((y) => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth select size="small" label="Class" value={filters.classId} onChange={(e) => f('classId', e.target.value)}>
            <MenuItem value="">All Classes</MenuItem>
            {classes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth select size="small" label="Section" value={filters.sectionId} onChange={(e) => f('sectionId', e.target.value)}>
            <MenuItem value="">All Sections</MenuItem>
            {sections.filter((s) => !filters.classId || s.classId === filters.classId).map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.class?.name} — {s.name}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField fullWidth select size="small" label="Status" value={filters.status} onChange={(e) => f('status', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="INACTIVE">Inactive</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={1}>
          <Button fullWidth variant="contained" onClick={run} sx={{ height: 40 }}>Run</Button>
        </Grid>
      </Grid>

      {loading && <Box textAlign="center" py={4}><CircularProgress /></Box>}
      {data && !loading && (
        <>
          <Grid container spacing={2} mb={2}>
            {[
              { label: 'Total Students', value: data.summary?.total || data.students?.length || 0 },
              { label: 'Active', value: data.summary?.active || 0 },
              { label: 'Male', value: data.summary?.male || 0 },
              { label: 'Female', value: data.summary?.female || 0 },
            ].map((s) => (
              <Grid item xs={6} sm={3} key={s.label}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Adm. No.</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>DOB</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data.students || data).slice(0, 100).map((s) => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.admissionNumber}</TableCell>
                  <TableCell>{s.firstName} {s.lastName}</TableCell>
                  <TableCell>{s.section?.class?.name || '—'}</TableCell>
                  <TableCell>{s.section?.name || '—'}</TableCell>
                  <TableCell>{s.gender}</TableCell>
                  <TableCell>{s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '—'}</TableCell>
                  <TableCell><Chip label={s.isActive ? 'Active' : 'Inactive'} size="small" color={s.isActive ? 'success' : 'default'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Box>
  );
};

// ─── Attendance Report ────────────────────────────────────────────────────────
const AttendanceReport = ({ classes, sections }) => {
  const [filters, setFilters] = useState({ sectionId: '', month: '', year: new Date().getFullYear().toString() });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data: res } = await reportApi.getAttendanceReport(filters);
      setData(res.data || res);
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const f = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  return (
    <Box>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth select size="small" label="Section" value={filters.sectionId} onChange={(e) => f('sectionId', e.target.value)}>
            <MenuItem value="">All Sections</MenuItem>
            {sections.map((s) => <MenuItem key={s.id} value={s.id}>{s.class?.name} — {s.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField fullWidth select size="small" label="Month" value={filters.month} onChange={(e) => f('month', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={String(i + 1)}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField fullWidth size="small" label="Year" value={filters.year} onChange={(e) => f('year', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={1}>
          <Button fullWidth variant="contained" onClick={run} sx={{ height: 40 }}>Run</Button>
        </Grid>
      </Grid>

      {loading && <Box textAlign="center" py={4}><CircularProgress /></Box>}
      {data && !loading && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Present</TableCell>
              <TableCell>Absent</TableCell>
              <TableCell>Late</TableCell>
              <TableCell>Total Days</TableCell>
              <TableCell>Attendance %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.records || data).map((r) => {
              const pct = r.totalDays ? ((r.present / r.totalDays) * 100).toFixed(1) : '—';
              return (
                <TableRow key={r.studentId || r.id} hover>
                  <TableCell>{r.student?.firstName || r.firstName} {r.student?.lastName || r.lastName}</TableCell>
                  <TableCell>{r.section?.class?.name} — {r.section?.name}</TableCell>
                  <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>{r.present ?? r.presentCount}</TableCell>
                  <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>{r.absent ?? r.absentCount}</TableCell>
                  <TableCell sx={{ color: 'warning.main' }}>{r.late ?? r.lateCount ?? 0}</TableCell>
                  <TableCell>{r.totalDays}</TableCell>
                  <TableCell>
                    <Chip label={`${pct}%`} size="small"
                      color={parseFloat(pct) >= 75 ? 'success' : parseFloat(pct) >= 60 ? 'warning' : 'error'} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

// ─── Fee Report ───────────────────────────────────────────────────────────────
const FeeReport = ({ academicYears }) => {
  const [filters, setFilters] = useState({ academicYearId: '', month: '', status: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data: res } = await reportApi.getFeeReport(filters);
      setData(res.data || res);
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const f = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  return (
    <Box>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <TextField fullWidth select size="small" label="Academic Year" value={filters.academicYearId} onChange={(e) => f('academicYearId', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {academicYears.map((y) => <MenuItem key={y.id} value={y.id}>{y.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField fullWidth select size="small" label="Status" value={filters.status} onChange={(e) => f('status', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="OVERDUE">Overdue</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={1}>
          <Button fullWidth variant="contained" onClick={run} sx={{ height: 40 }}>Run</Button>
        </Grid>
      </Grid>

      {loading && <Box textAlign="center" py={4}><CircularProgress /></Box>}
      {data && !loading && (
        <>
          {data.summary && (
            <Grid container spacing={2} mb={2}>
              {[
                { label: 'Total Invoices', value: data.summary.totalInvoices },
                { label: 'Total Amount', value: `₹${(data.summary.totalAmount || 0).toLocaleString()}` },
                { label: 'Collected', value: `₹${(data.summary.collected || 0).toLocaleString()}` },
                { label: 'Pending', value: `₹${(data.summary.pending || 0).toLocaleString()}` },
              ].map((s) => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Invoice #</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data.invoices || data).slice(0, 100).map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell>{inv.student?.firstName} {inv.student?.lastName}</TableCell>
                  <TableCell>{inv.invoiceNumber}</TableCell>
                  <TableCell>₹{(inv.totalAmount || 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ color: 'success.main' }}>₹{(inv.paidAmount || 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ color: 'error.main' }}>₹{((inv.totalAmount || 0) - (inv.paidAmount || 0)).toLocaleString()}</TableCell>
                  <TableCell>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <Chip label={inv.status} size="small"
                      color={{ PAID: 'success', PENDING: 'warning', OVERDUE: 'error' }[inv.status] || 'default'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Box>
  );
};

// ─── Payroll Report ────────────────────────────────────────────────────────────
const PayrollReport = () => {
  const [filters, setFilters] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), employeeType: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const { data: res } = await reportApi.getPayrollReport(filters);
      setData(res.data || res);
    } catch { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const f = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  return (
    <Box>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={2}>
          <TextField fullWidth select size="small" label="Month" value={filters.month} onChange={(e) => f('month', e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField fullWidth size="small" label="Year" value={filters.year} onChange={(e) => f('year', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField fullWidth select size="small" label="Employee Type" value={filters.employeeType} onChange={(e) => f('employeeType', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="TEACHER">Teachers</MenuItem>
            <MenuItem value="STAFF">Staff</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={1}>
          <Button fullWidth variant="contained" onClick={run} sx={{ height: 40 }}>Run</Button>
        </Grid>
      </Grid>

      {loading && <Box textAlign="center" py={4}><CircularProgress /></Box>}
      {data && !loading && (
        <>
          {data.summary && (
            <Grid container spacing={2} mb={2}>
              {[
                { label: 'Total Employees', value: data.summary.total },
                { label: 'Paid', value: data.summary.paid },
                { label: 'Pending', value: data.summary.pending },
                { label: 'Total Payable', value: `₹${(data.summary.totalNet || 0).toLocaleString()}` },
              ].map((s) => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Card variant="outlined">
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={700}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Basic</TableCell>
                <TableCell>Allowances</TableCell>
                <TableCell>Deductions</TableCell>
                <TableCell>Net Salary</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Paid At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data.records || data).map((r) => {
                const name = r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : r.staff ? `${r.staff.firstName} ${r.staff.lastName}` : '—';
                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{name}</TableCell>
                    <TableCell><Chip label={r.employeeType} size="small" /></TableCell>
                    <TableCell>₹{(r.basicSalary || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: 'success.main' }}>₹{(r.allowances || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: 'error.main' }}>₹{(r.deductions || 0).toLocaleString()}</TableCell>
                    <TableCell fontWeight={700}>₹{(r.netSalary || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={r.isPaid ? 'Paid' : 'Pending'} size="small" color={r.isPaid ? 'success' : 'warning'} />
                    </TableCell>
                    <TableCell>{r.paidAt ? new Date(r.paidAt).toLocaleDateString() : '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const ReportsPage = () => {
  const [tab, setTab] = useState(0);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    Promise.all([
      settingsApi.getAcademicYears(),
      classApi.getAll({ limit: 200 }),
      sectionApi.getAll({ limit: 200 }),
    ]).then(([ay, cl, sc]) => {
      setAcademicYears(ay.data.data || ay.data);
      setClasses(cl.data.data || []);
      setSections(sc.data.data || []);
    }).catch(() => {});
  }, []);

  const TABS = ['Students', 'Attendance', 'Fee Collection', 'Payroll'];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Reports</Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            {TABS.map((t, i) => <Tab key={i} label={t} />)}
          </Tabs>
        </Box>
        <CardContent>
          <TabPanel value={tab} index={0}>
            <StudentReport academicYears={academicYears} classes={classes} sections={sections} />
          </TabPanel>
          <TabPanel value={tab} index={1}>
            <AttendanceReport classes={classes} sections={sections} />
          </TabPanel>
          <TabPanel value={tab} index={2}>
            <FeeReport academicYears={academicYears} />
          </TabPanel>
          <TabPanel value={tab} index={3}>
            <PayrollReport />
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportsPage;
