import React from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Container,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { ArrowForward } from '@mui/icons-material'

export default function HomePage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: isMobile ? 6 : 10,
        background: `radial-gradient(900px 520px at 10% 0%, ${alpha(theme.palette.primary.main, 0.18)} 0%, transparent 60%),
                    radial-gradient(760px 520px at 90% 10%, ${alpha(theme.palette.secondary.main, 0.14)} 0%, transparent 55%),
                    linear-gradient(180deg, ${alpha(theme.palette.background.default, 1)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
      }}
    >
      <Container maxWidth="md">
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(22px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
            boxShadow: theme.shadows[10],
          }}
        >
          <Box
            sx={{
              px: isMobile ? 3 : 5,
              py: isMobile ? 4 : 6,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.35)}`,
              background: `radial-gradient(640px 260px at 30% 0%, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 60%),
                          radial-gradient(520px 260px at 80% 40%, ${alpha(theme.palette.secondary.main, 0.14)} 0%, transparent 55%)`,
            }}
          >
            <Typography
              variant={isMobile ? 'h4' : 'h3'}
              fontWeight={800}
              sx={{
                letterSpacing: -0.6,
                background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.7)} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Arise HRM
            </Typography>
            <Typography sx={{ mt: 1, color: alpha(theme.palette.text.secondary, 0.9) }}>
              A unified place for attendance, leave, documents, messaging, and analytics.
            </Typography>
          </Box>

          <Box sx={{ px: isMobile ? 3 : 5, py: isMobile ? 3 : 4 }}>
            <Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems={isMobile ? 'stretch' : 'center'}>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                sx={{
                  py: 1.4,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Sign in
              </Button>

              <Button
                component={Link}
                to="/dashboard"
                variant="outlined"
                size="large"
                sx={{
                  py: 1.4,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Open dashboard
              </Button>
            </Stack>

            <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
              If you’re already signed in, visiting <strong>/</strong> will take you straight to your dashboard.
            </Typography>
          </Box>
        </Card>
      </Container>
    </Box>
  )
}
