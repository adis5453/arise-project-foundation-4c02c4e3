import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material'
import {
  SmartToy,
  Upload,
  Visibility,
  Download,
  CheckCircle,
  Cancel,
  Close
} from '@mui/icons-material'
import { useAIConfig } from '../../hooks/useAIConfig'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { usePermissions } from '../../hooks/usePermissions'
import DatabaseService from '../../services/databaseService'

interface ResumeAnalysis {
  id: string
  candidate_name: string
  email: string
  ai_score: number
  skills_match: number
  experience_match: number
  recommendation: string
  summary: string
  strengths: string[]
  weaknesses: string[]
  missing_skills: string[]
}

const AIResumeAnalyzer: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<any>(null)
  const [analysisDialog, setAnalysisDialog] = useState<ResumeAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyses, setAnalyses] = useState<ResumeAnalysis[]>([])
  const { getGridBreakpoints } = useAIConfig()
  const { canView } = usePermissions()

  const { data: jobs = [], isLoading: isLoadingJobs, error: jobsError } = useQuery({
    queryKey: ['job-postings'],
    queryFn: async () => {
      const data = await DatabaseService.getJobPostings()
      return data.map((job: any) => ({
        ...job,
        required_skills: job.requirements ? job.requirements.split(/,|\n/).map((s: string) => s.trim()).filter((s: string) => s.length > 0) : []
      }))
    },
    enabled: canView('employees')
  })

  useEffect(() => {
    if (jobsError) {
      console.error("Failed to fetch jobs", jobsError)
      toast.error(jobsError.message || "Could not load job postings")
    }
  }, [jobsError])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0 && selectedJob) {
      setIsAnalyzing(true);
      let successCount = 0;

      try {
        for (const file of files) {
          try {
            const result = await DatabaseService.uploadResume(file, selectedJob.description);
            // Append result to state
            setAnalyses(prev => [result, ...prev]);
            successCount++;
          } catch (err: any) {
            console.error(`Failed to analyze ${file.name}`, err);
            toast.error(`Failed to analyze ${file.name}: ${err.error || err.message}`);
          }
        }

        if (successCount > 0) {
          toast.success(`Analyzed ${successCount} resume(s) successfully`);
        }
      } catch (error) {
        toast.error("An error occurred during upload processing");
      } finally {
        setIsAnalyzing(false);
        // Reset input
        event.target.value = '';
      }
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    const colors: Record<string, string> = {
      'strong_match': 'success',
      'good_match': 'info',
      'weak_match': 'warning',
      'no_match': 'error'
    }
    return colors[recommendation] || 'default'
  }

  const getRecommendationText = (recommendation: string) => {
    const texts: Record<string, string> = {
      'strong_match': 'Strong Match',
      'good_match': 'Good Match',
      'weak_match': 'Weak Match',
      'no_match': 'No Match'
    }
    return texts[recommendation] || 'Unknown'
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToy color="primary" />
        AI Resume Analyzer
      </Typography>

      {/* Job Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Select Job Position</Typography>
          {jobs.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">No active job postings found. Create one in Hiring Management.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {jobs.map((job: any) => (
                <Paper
                  key={job.id}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    width: { xs: '100%', md: '48%' },
                    border: selectedJob?.id === job.id ? 2 : 1,
                    borderColor: selectedJob?.id === job.id ? 'primary.main' : 'divider',
                    '&:hover': { borderColor: 'primary.main' }
                  }}
                  onClick={() => {
                    setSelectedJob(job);
                    setAnalyses([]); // Clear previous analyses when switching jobs
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {job.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {job.department} • {job.employment_type}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {job.required_skills?.slice(0, 3).map((skill: string) => (
                      <Chip key={skill} label={skill} size="small" />
                    ))}
                    {job.required_skills?.length > 3 && (
                      <Chip label={`+${job.required_skills.length - 3} more`} size="small" variant="outlined" />
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Upload Section */}
      {selectedJob && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Upload Resume for Analysis</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Analyzing against: <strong>{selectedJob.title}</strong>
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<Upload />}
                disabled={isAnalyzing}
              >
                Upload Resume (PDF/TXT)
                <input
                  type="file"
                  hidden
                  accept=".pdf,.txt"
                  multiple
                  onChange={handleFileUpload}
                />
              </Button>
              {isAnalyzing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">AI is analyzing resumes (this may take 10-20s)...</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {selectedJob && analyses.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>AI Analysis Results</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {analyses.map((analysis) => (
                <Paper key={analysis.id} sx={{ p: 2, width: { xs: '100%', md: '48%' } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {analysis.candidate_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {analysis.email}
                      </Typography>
                    </Box>
                    <Chip
                      label={getRecommendationText(analysis.recommendation)}
                      color={getRecommendationColor(analysis.recommendation) as any}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2">AI Score</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {analysis.ai_score}/100
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={analysis.ai_score} />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Skills</Typography>
                      <Typography variant="body2" fontWeight="bold">{analysis.skills_match}%</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Experience</Typography>
                      <Typography variant="body2" fontWeight="bold">{analysis.experience_match}%</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setAnalysisDialog(analysis)}
                    >
                      View Details
                    </Button>
                    {/* Actions disabled for now as they require saving files to storage first */}
                    {/*
                    <Box>
                      <Tooltip title="View Resume">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    */}
                  </Box>
                </Paper>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Analysis Dialog */}
      <Dialog
        open={!!analysisDialog}
        onClose={() => setAnalysisDialog(null)}
        maxWidth="md"
        fullWidth
      >
        {analysisDialog && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  AI Analysis: {analysisDialog.candidate_name}
                </Typography>
                <IconButton onClick={() => setAnalysisDialog(null)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Summary:</strong> {analysisDialog.summary}
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                  <Typography variant="subtitle2" gutterBottom>Strengths</Typography>
                  <List dense>
                    {analysisDialog.strengths?.map((strength, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <CheckCircle color="success" sx={{ mr: 1, fontSize: 16 }} />
                        <ListItemText primary={strength} />
                      </ListItem>
                    ))}
                    {(!analysisDialog.strengths || analysisDialog.strengths.length === 0) && (
                      <Typography variant="body2" color="text.secondary">None identified</Typography>
                    )}
                  </List>
                </Box>

                <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                  <Typography variant="subtitle2" gutterBottom>Areas for Improvement</Typography>
                  <List dense>
                    {analysisDialog.weaknesses?.map((weakness, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <Cancel color="warning" sx={{ mr: 1, fontSize: 16 }} />
                        <ListItemText primary={weakness} />
                      </ListItem>
                    ))}
                    {(!analysisDialog.weaknesses || analysisDialog.weaknesses.length === 0) && (
                      <Typography variant="body2" color="text.secondary">None identified</Typography>
                    )}
                  </List>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAnalysisDialog(null)}>Close</Button>
              <Button variant="contained" color="primary">
                Schedule Interview
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default AIResumeAnalyzer

