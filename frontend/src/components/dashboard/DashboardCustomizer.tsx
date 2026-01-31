'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Grid,
  Button,
  Card,
  CardHeader,
  IconButton,
} from '@mui/material'
import { Save, Close } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'sonner'

interface Props {
  onClose: () => void
}

export function DashboardCustomizer({ onClose }: Props) {
  const { profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)

  /* load saved pref */
  useEffect(() => {
    const stored = localStorage.getItem(`dashboard-prefs-${profile?.id}`)
    if (stored) setShowWelcome(JSON.parse(stored).showWelcome !== false)
  }, [profile])

  const handleSave = () => {
    setSaving(true)
    localStorage.setItem(
      `dashboard-prefs-${profile?.id}`,
      JSON.stringify({ showWelcome })
    )
    toast.success('Preferences saved')
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open fullWidth maxWidth="sm">
      <DialogTitle>
        Dashboard settings
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined">
              <CardHeader
                title="General"
                subheader="Turn features on / off"
              />
              <FormControlLabel
                sx={{ pl: 2, pb: 2 }}
                control={
                  <Switch
                    checked={showWelcome}
                    onChange={(e) => setShowWelcome(e.target.checked)}
                  />
                }
                label="Show welcome message"
              />
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          startIcon={<Save />}
          variant="contained"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
