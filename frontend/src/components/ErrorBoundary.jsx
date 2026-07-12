import React from 'react';
import { Box, Typography, Button, Paper, Collapse } from '@mui/material';
import { ErrorOutline, ExpandMore, ExpandLess, Refresh } from '@mui/icons-material';

/**
 * React class component error boundary.
 * Catches render/lifecycle exceptions in child component tree,
 * shows a fallback UI instead of a blank/white screen, and
 * logs the error with a stack trace to the browser console.
 *
 * Usage: wrap the root <App /> (or any subtree) with <ErrorBoundary>.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetail: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Always log to console so the developer sees the full trace
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);

    this.setState({ errorInfo });

    // If a reporting callback was passed in (e.g. Sentry.captureException),
    // call it here so the error is sent to your error-tracking service.
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetail: false });
  };

  toggleDetail = () => {
    this.setState((prev) => ({ showDetail: !prev.showDetail }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo, showDetail } = this.state;
    const isDev = import.meta.env.DEV;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          bgcolor: 'background.default',
        }}
      >
        <Paper
          elevation={3}
          sx={{ maxWidth: 640, width: '100%', p: 4, borderRadius: 3, textAlign: 'center' }}
        >
          <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />

          <Typography variant="h5" fontWeight={700} gutterBottom>
            Something went wrong
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            An unexpected error occurred. Please try refreshing the page. If the problem
            persists, contact support.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Refresh page
            </Button>
            <Button variant="outlined" onClick={this.handleReset}>
              Try again
            </Button>
          </Box>

          {/* Developer detail panel — only shown in dev mode */}
          {isDev && error && (
            <Box sx={{ textAlign: 'left' }}>
              <Button
                size="small"
                variant="text"
                color="inherit"
                endIcon={showDetail ? <ExpandLess /> : <ExpandMore />}
                onClick={this.toggleDetail}
                sx={{ color: 'text.secondary', mb: 1 }}
              >
                {showDetail ? 'Hide' : 'Show'} error details (dev only)
              </Button>

              <Collapse in={showDetail}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: 'grey.50',
                    borderColor: 'error.light',
                    overflow: 'auto',
                    maxHeight: 320,
                  }}
                >
                  <Typography
                    component="pre"
                    variant="caption"
                    sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'error.dark' }}
                  >
                    {error.toString()}
                    {errorInfo?.componentStack}
                  </Typography>
                </Paper>
              </Collapse>
            </Box>
          )}
        </Paper>
      </Box>
    );
  }
}

export default ErrorBoundary;
