import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { Email } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../../api/axios';

const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, getValues, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true); setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Email sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" fontWeight={700}>Forgot Password</Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your email and we'll send a reset link
            </Typography>
          </Box>

          {sent ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Password reset link sent to <strong>{getValues('email')}</strong>.
              Check your inbox.
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <TextField fullWidth label="Email Address" type="email" size="small" sx={{ mb: 2 }}
                {...register('email', { required: 'Email is required' })}
                error={!!errors.email} helperText={errors.email?.message} />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
