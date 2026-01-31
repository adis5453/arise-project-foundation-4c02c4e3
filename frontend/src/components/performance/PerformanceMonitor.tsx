import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
  Alert,
  Stack,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '../../hooks/usePerformance';
import { useMemoryUsage } from '../../hooks/usePerformance';
import { useNetworkStatus } from '../../hooks/usePerformance';
import { usePerformanceMetrics } from '../../hooks/usePerformance';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'error';
  threshold: { warning: number; error: number };
}

const PerformanceMonitor: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  const { fps, isLowPerformance } = usePerformance();
  const memoryInfo = useMemoryUsage();
  const memoryUsage = memoryInfo?.usedJSHeapSize ?? 0;
  const memoryLimit = memoryInfo?.jsHeapSizeLimit ?? 0;
  const { isOnline, connectionType } = useNetworkStatus();
  const { fcp, lcp, fid, cls, ttfb } = usePerformanceMetrics();

  useEffect(() => {
    const updateMetrics = () => {
      const newMetrics: PerformanceMetric[] = [
        {
          name: 'FPS',
          value: fps,
          unit: '',
          status: fps >= 50 ? 'good' : fps >= 30 ? 'warning' : 'error',
          threshold: { warning: 30, error: 20 }
        },
        {
          name: 'Memory Usage',
          value: (memoryUsage / 1024 / 1024),
          unit: 'MB',
          status: memoryUsage < memoryLimit * 0.7 ? 'good' : memoryUsage < memoryLimit * 0.9 ? 'warning' : 'error',
          threshold: { warning: memoryLimit * 0.7 / 1024 / 1024, error: memoryLimit * 0.9 / 1024 / 1024 }
        },
        {
          name: 'FCP',
          value: fcp,
          unit: 'ms',
          status: fcp < 1800 ? 'good' : fcp < 3000 ? 'warning' : 'error',
          threshold: { warning: 1800, error: 3000 }
        },
        {
          name: 'LCP',
          value: lcp,
          unit: 'ms',
          status: lcp < 2500 ? 'good' : lcp < 4000 ? 'warning' : 'error',
          threshold: { warning: 2500, error: 4000 }
        },
        {
          name: 'FID',
          value: fid,
          unit: 'ms',
          status: fid < 100 ? 'good' : fid < 300 ? 'warning' : 'error',
          threshold: { warning: 100, error: 300 }
        },
        {
          name: 'CLS',
          value: cls,
          unit: '',
          status: cls < 0.1 ? 'good' : cls < 0.25 ? 'warning' : 'error',
          threshold: { warning: 0.1, error: 0.25 }
        }
      ];
      setMetrics(newMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [fps, memoryUsage, memoryLimit, fcp, lcp, fid, cls]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircleIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return null;
    }
  };

  const getOptimizationSuggestions = () => {
    const suggestions = [];

    if (fps < 30) suggestions.push('Consider reducing animation complexity or disabling non-essential animations');
    if (memoryUsage > memoryLimit * 0.8) suggestions.push('Memory usage is high - consider implementing virtual scrolling or lazy loading');
    if (fcp > 3000) suggestions.push('First Contentful Paint is slow - optimize critical rendering path');
    if (lcp > 4000) suggestions.push('Largest Contentful Paint is slow - optimize images and reduce layout shifts');
    if (fid > 300) suggestions.push('First Input Delay is high - reduce JavaScript execution time');
    if (cls > 0.25) suggestions.push('Cumulative Layout Shift is high - avoid layout shifts during page load');

    return suggestions;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <SpeedIcon color="primary" />
              <Typography variant="h6" component="h2">
                Performance Monitor
              </Typography>
              <Badge
                badgeContent={metrics.filter(m => m.status === 'error').length}
                color="error"
                sx={{ ml: 1 }}
              />
            </Box>
            <IconButton onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Quick Status Overview */}
          <Grid container spacing={2} mb={2}>
            <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color={fps >= 50 ? 'success.main' : fps >= 30 ? 'warning.main' : 'error.main'}>
                  {fps}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  FPS
                </Typography>
              </Box>
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color={memoryUsage < memoryLimit * 0.7 ? 'success.main' : memoryUsage < memoryLimit * 0.9 ? 'warning.main' : 'error.main'}>
                  {Math.round(memoryUsage / 1024 / 1024)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Memory (MB)
                </Typography>
              </Box>
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color={isOnline ? 'success.main' : 'error.main'}>
                  {isOnline ? 'ON' : 'OFF'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Network
                </Typography>
              </Box>
            </Grid>
            <Grid component="div" size={{ xs: 12, sm: 6, md: 3 }}>
              <Box textAlign="center">
                <Typography variant="h4" color={isLowPerformance ? 'warning.main' : 'success.main'}>
                  {isLowPerformance ? '!' : '✓'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Detailed Metrics */}
          <Collapse in={expanded}>
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                Core Web Vitals & Performance Metrics
              </Typography>

              {metrics.map((metric, index) => (
                <Box key={metric.name} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(metric.status)}
                      <Typography variant="body2">
                        {metric.name}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontWeight="bold">
                        {metric.value.toFixed(2)}{metric.unit}
                      </Typography>
                      <Chip
                        label={metric.status.toUpperCase()}
                        color={getStatusColor(metric.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={Math.min((metric.value / metric.threshold.error) * 100, 100)}
                    color={getStatusColor(metric.status) as any}
                    sx={{ height: 6, borderRadius: 3 }}
                  />

                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Warning: {metric.threshold.warning.toFixed(2)}{metric.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Error: {metric.threshold.error.toFixed(2)}{metric.unit}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {/* Optimization Suggestions */}
              {getOptimizationSuggestions().length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Optimization Suggestions:
                  </Typography>
                  <Stack spacing={1}>
                    {getOptimizationSuggestions().map((suggestion, index) => (
                      <Typography key={index} variant="body2">
                        • {suggestion}
                      </Typography>
                    ))}
                  </Stack>
                </Alert>
              )}

              {/* Network Information */}
              <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
                <Typography variant="subtitle2" gutterBottom>
                  Network Status
                </Typography>
                <Grid container spacing={2}>
                  <Grid component="div" size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Connection: {isOnline ? 'Online' : 'Offline'}
                    </Typography>
                  </Grid>
                  <Grid component="div" size={{ xs: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Type: {connectionType || 'Unknown'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PerformanceMonitor;
