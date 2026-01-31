import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { log } from '@/services/loggingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  showDetails: boolean;
}

class RouteErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = this.generateEventId();
    
    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Log the error with our logging service
    log.critical('Route Error Boundary caught an error', error, {
      errorInfo,
      eventId,
      retryCount: this.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }, {
      component: 'RouteErrorBoundary',
      action: 'ERROR_CAUGHT',
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show user-friendly notification
    toast.error('Something went wrong. Our team has been notified.');
  }

  private generateEventId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      
      log.info('User initiated error boundary retry', {
        retryCount: this.retryCount,
        eventId: this.state.eventId,
      });

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        eventId: null,
        showDetails: false,
      });

      toast.info('Retrying...');
    } else {
      toast.error('Maximum retry attempts reached. Please refresh the page or contact support.');
    }
  };

  private handleGoHome = () => {
    log.audit('User navigated home from error boundary', '', {
      eventId: this.state.eventId,
    });
    
    window.location.href = '/dashboard';
  };

  private handleRefreshPage = () => {
    log.audit('User refreshed page from error boundary', '', {
      eventId: this.state.eventId,
    });
    
    window.location.reload();
  };

  private handleReportBug = () => {
    const { error, errorInfo, eventId } = this.state;
    
    // Create a bug report with relevant information
    const bugReport = {
      eventId,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard for now (could be enhanced to send to bug tracking system)
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2)).then(() => {
      toast.success('Error details copied to clipboard. Please share with support team.');
    });

    log.audit('User reported bug from error boundary', '', {
      eventId,
      bugReport,
    });
  };

  private getErrorSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    const { error } = this.state;
    
    if (!error) return 'low';
    
    // Categorize error severity based on error type/message
    const errorMessage = error.message.toLowerCase();
    const errorStack = error.stack?.toLowerCase() || '';
    
    // Critical errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorStack.includes('authcontext') ||
      errorStack.includes('database')
    ) {
      return 'critical';
    }
    
    // High severity errors
    if (
      errorMessage.includes('permission') ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('forbidden') ||
      errorStack.includes('router')
    ) {
      return 'high';
    }
    
    // Medium severity errors
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('form') ||
      errorStack.includes('component')
    ) {
      return 'medium';
    }
    
    return 'low';
  }

  private getUserFriendlyErrorMessage(): string {
    const { error } = this.state;
    const severity = this.getErrorSeverity();
    
    if (!error) return 'An unexpected error occurred.';
    
    switch (severity) {
      case 'critical':
        return 'We\'re experiencing technical difficulties connecting to our services. Please try again in a few moments.';
      case 'high':
        return 'There seems to be an issue with your access permissions or navigation. Please try refreshing the page.';
      case 'medium':
        return 'There was a problem with the form or data you submitted. Please check your input and try again.';
      default:
        return 'Something went wrong, but it should be safe to continue. Try refreshing or go back to the dashboard.';
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity();
      const userMessage = this.getUserFriendlyErrorMessage();
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="center">
                {/* Error Icon and Severity */}
                <Box sx={{ textAlign: 'center' }}>
                  <ErrorIcon
                    sx={{
                      fontSize: 80,
                      color: severity === 'critical' ? 'error.main' : 
                             severity === 'high' ? 'warning.main' : 
                             'info.main',
                      mb: 2,
                    }}
                  />
                  <Chip
                    label={`${severity.toUpperCase()} ERROR`}
                    color={
                      severity === 'critical' ? 'error' :
                      severity === 'high' ? 'warning' :
                      'info'
                    }
                    size="small"
                  />
                </Box>

                {/* Main Error Message */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" gutterBottom fontWeight="600">
                    Oops! Something went wrong
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {userMessage}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                  {canRetry && (
                    <Button
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      onClick={this.handleRetry}
                      fullWidth
                    >
                      Try Again ({this.maxRetries - this.retryCount} left)
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<HomeIcon />}
                    onClick={this.handleGoHome}
                    fullWidth
                  >
                    Go to Dashboard
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={this.handleRefreshPage}
                    fullWidth
                  >
                    Refresh Page
                  </Button>
                </Stack>

                {/* Additional Options */}
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<BugReportIcon />}
                    onClick={this.handleReportBug}
                  >
                    Report Bug
                  </Button>
                  <Button
                    size="small"
                    startIcon={<SupportIcon />}
                    onClick={() => window.open('mailto:support@company.com', '_blank')}
                  >
                    Contact Support
                  </Button>
                </Stack>

                {/* Error Details (Collapsible) */}
                <Box sx={{ width: '100%' }}>
                  <Button
                    size="small"
                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                    startIcon={
                      <ExpandMoreIcon
                        sx={{
                          transform: this.state.showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s',
                        }}
                      />
                    }
                  >
                    {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                  </Button>
                  
                  <Collapse in={this.state.showDetails}>
                    <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
                      <AlertTitle>Error Details</AlertTitle>
                      <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                        <strong>Event ID:</strong> {this.state.eventId}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                        <strong>Error:</strong> {this.state.error?.message}
                      </Typography>
                      {this.state.error?.stack && (
                        <Box
                          component="pre"
                          sx={{
                            fontSize: '0.7rem',
                            overflow: 'auto',
                            maxHeight: 200,
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            mt: 1,
                          }}
                        >
                          {this.state.error.stack}
                        </Box>
                      )}
                    </Alert>
                  </Collapse>
                </Box>

                {/* Retry Counter Info */}
                {this.retryCount > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Retry attempts: {this.retryCount}/{this.maxRetries}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
