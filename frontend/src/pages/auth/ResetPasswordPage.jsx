import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, InputAdornment, IconButton } from '@mui/material';
import { LockReset, Visibility, VisibilityOff } from '@mui/icons-material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../../api/axios';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async ({ password }) => {
    if (!token) { setError('Invalid or missing reset token'); return; }
    setLoading(true); setError('');
    try {
      await authApi.resetPassword({ token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Token may have expired.');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockReset sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>Reset Password</Typography>
            <Typography variant="body2" color="text.secondary">Enter your new password below</Typography>
          </Box>

          {done ? (
            <Alert severity="success">
              Password reset successfully! Redirecting to login…
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {!token && <Alert severity="warning" sx={{ mb: 2 }}>No reset token found in URL.</Alert>}
              <TextField fullWidth label="New Password" size="small" sx={{ mb: 2 }}
                type={showPass ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(p => !p)} edge="end" size="small">
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
                error={!!errors.password} helperText={errors.password?.message} />
              <TextField fullWidth label="Confirm Password" size="small" type="password" sx={{ mb: 2 }}
                {...register('confirm', {
                  required: 'Required',
                  validate: v => v === watch('password') || 'Passwords do not match',
                })}
                error={!!errors.confirm} helperText={errors.confirm?.message} />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading || !token}>
                {loading ? 'Resetting…' : 'Reset Password'}
              </Button>
            </Box>
          )}

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              <Link to="/login" style={{ color: 'inherit' }}>← Back to Login</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ResetPasswordPage;
