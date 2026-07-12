import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Tabs, Tab, Typography, Card, CardContent, Grid, TextField,
  Button, MenuItem, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, InputAdornment, TablePagination,
} from '@mui/material';
import { Add, Search, AssignmentReturn, MenuBook, List } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { libraryApi } from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const LIBRARIAN_ROLES = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'LIBRARIAN'];

const AddBookDialog = ({ open, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => { if (open) reset(); }, [open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await libraryApi.createBook(data);
      toast.success('Book added');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add book');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Book</DialogTitle>
      <DialogContent>
        <Box component="form" id="book-form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth size="small" label="Title" {...register('title', { required: true })} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Author Name" {...register('authorName')} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Category" {...register('categoryName')} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="ISBN" {...register('isbn')} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Publisher" {...register('publisher')} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" label="Edition" {...register('edition')} /></Grid>
            <Grid item xs={6}><TextField fullWidth size="small" type="number" label="Total Copies" defaultValue="1" {...register('totalCopies')} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Location (Shelf/Rack)" {...register('location')} /></Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="book-form" variant="contained" disabled={saving}>
          {saving ? 'Adding…' : 'Add Book'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const IssueBookDialog = ({ open, onClose, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { dueDays: 14 } });

  useEffect(() => { if (open) reset({ dueDays: 14 }); }, [open, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await libraryApi.issueBook(data);
      toast.success('Book issued');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Issue Book</DialogTitle>
      <DialogContent>
        <Box component="form" id="issue-form" onSubmit={handleSubmit(onSubmit)}>
          <TextField fullWidth size="small" label="Book ID" margin="normal" {...register('bookId', { required: true })} />
          <TextField fullWidth size="small" label="Borrower User ID" margin="normal" {...register('borrowerId', { required: true })} />
          <TextField fullWidth size="small" type="number" label="Due in (days)" margin="normal" {...register('dueDays')} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" form="issue-form" variant="contained" disabled={saving}>
          {saving ? 'Issuing…' : 'Issue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Books Tab ──────────────────────────────────────────────────
const BooksTab = ({ canManage }) => {
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await libraryApi.getBooks({ search: search || undefined, page: page + 1, limit: 20 });
      setBooks(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load books'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField size="small" placeholder="Search title, ISBN…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
        {canManage && (
          <Button variant="contained" startIcon={<Add />} sx={{ ml: 'auto' }} onClick={() => setAddOpen(true)}>
            Add Book
          </Button>
        )}
      </Box>
      {loading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell>Available</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.map((b) => (
                <TableRow key={b.id} hover>
                  <TableCell fontWeight={600}>{b.title}</TableCell>
                  <TableCell>{b.author?.name || '—'}</TableCell>
                  <TableCell>{b.category?.name || '—'}</TableCell>
                  <TableCell>{b.isbn || '—'}</TableCell>
                  <TableCell>{b.available}</TableCell>
                  <TableCell>{b.totalCopies}</TableCell>
                  <TableCell>
                    <Chip label={b.status} size="small"
                      color={b.status === 'AVAILABLE' ? 'success' : 'warning'} />
                  </TableCell>
                </TableRow>
              ))}
              {!books.length && (
                <TableRow><TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" py={3}>No books found</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination component="div" count={total} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
        </>
      )}
      <AddBookDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={fetch} />
    </Box>
  );
};

// ── Issues Tab ─────────────────────────────────────────────────
const IssuesTab = ({ canManage }) => {
  const [issues, setIssues] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [issueOpen, setIssueOpen] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await libraryApi.getActiveIssues({ page: page + 1, limit: 20 });
      setIssues(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load issues'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleReturn = async (id) => {
    try {
      const result = await libraryApi.returnBook(id);
      const fine = result.data?.data?.fineAmount;
      toast.success(fine > 0 ? `Book returned. Fine: ₹${fine}` : 'Book returned successfully');
      fetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        {canManage && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setIssueOpen(true)}>
            Issue Book
          </Button>
        )}
      </Box>
      {loading ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Book</TableCell>
                <TableCell>Borrower ID</TableCell>
                <TableCell>Issued</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                {canManage && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {issues.map((i) => {
                const isOverdue = new Date(i.dueDate) < new Date();
                return (
                  <TableRow key={i.id} hover sx={isOverdue ? { bgcolor: 'error.light' } : {}}>
                    <TableCell>{i.book?.title}</TableCell>
                    <TableCell>{i.borrowerId}</TableCell>
                    <TableCell>{new Date(i.issuedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(i.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={isOverdue ? 'Overdue' : 'Active'} size="small"
                        color={isOverdue ? 'error' : 'success'} />
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Button size="small" startIcon={<AssignmentReturn />} onClick={() => handleReturn(i.id)}>
                          Return
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {!issues.length && (
                <TableRow><TableCell colSpan={6} align="center">
                  <Typography color="text.secondary" py={3}>No active issues</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination component="div" count={total} page={page}
            onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} />
        </>
      )}
      <IssueBookDialog open={issueOpen} onClose={() => setIssueOpen(false)} onSaved={fetch} />
    </Box>
  );
};

// ── Main ───────────────────────────────────────────────────────
const LibraryPage = () => {
  const { user } = useAuth();
  const canManage = LIBRARIAN_ROLES.includes(user?.role);
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Library</Typography>
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab icon={<MenuBook />} iconPosition="start" label="Books" sx={{ textTransform: 'none' }} />
            <Tab icon={<List />} iconPosition="start" label="Active Issues" sx={{ textTransform: 'none' }} />
          </Tabs>
        </Box>
        <CardContent>
          {tab === 0 && <BooksTab canManage={canManage} />}
          {tab === 1 && <IssuesTab canManage={canManage} />}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LibraryPage;
