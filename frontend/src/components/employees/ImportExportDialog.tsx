import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  IconButton,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
} from '@mui/material'
import {
  Close,
  Upload,
  Download,
  FileUpload,
  GetApp,
  CheckCircle,
  Error,
  Warning,
  Info,
  Description,
  CloudUpload,
  Refresh,
  Preview,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useResponsive } from '../../hooks/useResponsive'

interface ImportExportDialogProps {
  open: boolean
  onClose: () => void
  mode: 'import' | 'export'
}

interface ImportResult {
  successful: number
  failed: number
  warnings: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
}

const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  open,
  onClose,
  mode
}) => {
  const responsive = useResponsive()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeStep, setActiveStep] = useState(0)

  // Export options
  const [exportFormat, setExportFormat] = useState('csv')
  const [exportFields, setExportFields] = useState([
    'first_name',
    'last_name',
    'email',
    'department',
    'position',
    'hire_date'
  ])

  const importSteps = ['Select File', 'Validate Data', 'Import Results']
  const exportSteps = ['Choose Format', 'Select Fields', 'Download']

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setActiveStep(1)
      validateFile(file)
    }
  }

  const validateFile = async (file: File) => {
    setLoading(true)
    setUploadProgress(0)

    try {
      // Simulate file validation with progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 20
          return next > 95 ? 95 : next
        })
      }, 200)

      await new Promise(resolve => setTimeout(resolve, 2000))

      clearInterval(interval)
      setUploadProgress(100)

      // Mock validation results
      const mockResult: ImportResult = {
        successful: 45,
        failed: 3,
        warnings: 2,
        errors: [
          { row: 12, field: 'email', message: 'Invalid email format' },
          { row: 18, field: 'hire_date', message: 'Invalid date format' },
          { row: 23, field: 'department', message: 'Department not found' }
        ]
      }

      setImportResult(mockResult)
      toast.success('File validated successfully')
    } catch (error) {
      toast.error('File validation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !importResult) return

    setLoading(true)
    setActiveStep(2)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Successfully imported ${importResult.successful} employees`)
      onClose()
    } catch (error) {
      toast.error('Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create mock CSV content
      const headers = exportFields.join(',')
      const rows = [
        'John,Doe,john.doe@company.com,Engineering,Developer,2023-01-15',
        'Jane,Smith,jane.smith@company.com,Marketing,Manager,2022-08-20',
        'Mike,Johnson,mike.johnson@company.com,Sales,Representative,2023-03-10'
      ]

      const csvContent = [headers, ...rows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `employees_export_${new Date().toISOString().slice(0, 10)}.${exportFormat}`
      a.click()

      URL.revokeObjectURL(url)
      toast.success('Export completed successfully')
      onClose()
    } catch (error) {
      toast.error('Export failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const headers = 'first_name,last_name,email,phone,department,position,hire_date,employment_type'
    const sampleRow = 'John,Doe,john.doe@example.com,+1-555-123-4567,Engineering,Software Developer,2024-01-15,full_time'
    const csvContent = [headers, sampleRow].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'employee_import_template.csv'
    a.click()

    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
  }

  const TabPanel: React.FC<{ children: React.ReactNode; value: number; index: number }> = ({
    children,
    value,
    index
  }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )

  const renderImportStep = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CloudUpload sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Upload Employee Data File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a CSV file containing employee information
            </Typography>

            <Stack spacing={2} alignItems="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<FileUpload />}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>

              <Button
                variant="text"
                size="small"
                startIcon={<Download />}
                onClick={downloadTemplate}
              >
                Download Template
              </Button>
            </Stack>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {selectedFile && (
              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </Typography>
              </Alert>
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Validating File Data
            </Typography>

            {loading && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Validating... {Math.round(uploadProgress)}%
                </Typography>
              </Box>
            )}

            {importResult && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <CheckCircle color="success" />
                        <Box>
                          <Typography variant="h4" color="success.main">
                            {importResult.successful}
                          </Typography>
                          <Typography variant="body2">
                            Valid Records
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Warning color="warning" />
                        <Box>
                          <Typography variant="h4" color="warning.main">
                            {importResult.warnings}
                          </Typography>
                          <Typography variant="body2">
                            Warnings
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Error color="error" />
                        <Box>
                          <Typography variant="h4" color="error.main">
                            {importResult.failed}
                          </Typography>
                          <Typography variant="body2">
                            Errors
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {importResult.errors.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Validation Errors
                      </Typography>
                      <List>
                        {importResult.errors.map((error, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Error color="error" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`Row ${error.row}: ${error.field}`}
                              secondary={error.message}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        )

      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Import Completed Successfully!
            </Typography>
            {importResult && (
              <Typography variant="body2" color="text.secondary">
                {importResult.successful} employees imported successfully
              </Typography>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  const renderExportContent = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Export Format"
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="xlsx">Excel</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom>
            Select Fields to Export
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {[
              { value: 'first_name', label: 'First Name' },
              { value: 'last_name', label: 'Last Name' },
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
              { value: 'department', label: 'Department' },
              { value: 'position', label: 'Position' },
              { value: 'hire_date', label: 'Hire Date' },
              { value: 'employment_type', label: 'Employment Type' },
              { value: 'salary', label: 'Salary' }
            ].map((field) => (
              <Chip
                key={field.value}
                label={field.label}
                color={exportFields.includes(field.value) ? 'primary' : 'default'}
                onClick={() => {
                  setExportFields(prev =>
                    prev.includes(field.value)
                      ? prev.filter(f => f !== field.value)
                      : [...prev, field.value]
                  )
                }}
                variant={exportFields.includes(field.value) ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Alert severity="info">
            <Typography variant="body2">
              Selected {exportFields.length} fields for export
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={responsive.isMobile}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            {mode === 'import' ? <Upload /> : <Download />}
            <Typography variant="h6">
              {mode === 'import' ? 'Import Employees' : 'Export Employees'}
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {mode === 'import' ? (
          <Box>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel={!responsive.isMobile}>
              {importSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderImportStep(activeStep)}
              </motion.div>
            </AnimatePresence>
          </Box>
        ) : (
          renderExportContent()
        )}
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />

          {mode === 'import' ? (
            <>
              {activeStep > 0 && activeStep < 2 && (
                <Button
                  onClick={() => setActiveStep(prev => prev - 1)}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              {activeStep === 1 && importResult && (
                <Button
                  onClick={handleImport}
                  variant="contained"
                  disabled={loading || importResult.failed > 0}
                  startIcon={loading ? <CircularProgress size={20} /> : <Upload />}
                >
                  {loading ? 'Importing...' : `Import ${importResult.successful} Records`}
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={handleExport}
              variant="contained"
              disabled={loading || exportFields.length === 0}
              startIcon={loading ? <CircularProgress size={20} /> : <Download />}
            >
              {loading ? 'Exporting...' : 'Export Data'}
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  )
}

export default ImportExportDialog