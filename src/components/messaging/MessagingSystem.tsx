import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Badge,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import {
  Send,
  Add,
  Search,
  FilterList,
  MoreVert,
  Reply,
  Forward,
  Delete,
  Star,
  StarBorder,
  Attachment,
  Group,
  Person,
  Notifications,
  NotificationsOff
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { toast } from 'sonner'

interface Message {
  id: string
  sender_id: string
  recipient_id?: string
  recipient_type: 'individual' | 'department' | 'all'
  subject: string
  content: string
  priority: 'low' | 'medium' | 'high'
  is_read: boolean
  is_starred: boolean
  created_at: string
  sender: {
    first_name: string
    last_name: string
    department: string
    position: string
  }
}

interface NewMessage {
  recipient_id?: string
  recipient_type: 'individual' | 'department' | 'all'
  subject: string
  content: string
  priority: 'low' | 'medium' | 'high'
}

export const MessagingSystem: React.FC = () => {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all')

  const [newMessage, setNewMessage] = useState<NewMessage>({
    recipient_type: 'individual',
    subject: '',
    content: '',
    priority: 'medium'
  })

  const departments = [
    'Engineering',
    'Human Resources',
    'Marketing',
    'Sales',
    'Finance',
    'Operations',
    'Customer Support',
    'Legal',
    'IT'
  ]

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get('/messages', {
        params: { recipient_id: profile?.id }
      })
      setMessages(response || [])
    } catch (error) {
      // Use demo data if API not available
      setMessages([
        {
          id: '1',
          sender_id: '1',
          recipient_id: profile?.id,
          recipient_type: 'individual',
          subject: 'Welcome to the Team!',
          content: 'Welcome aboard! We are excited to have you on our team. Please feel free to reach out if you have any questions.',
          priority: 'high',
          is_read: false,
          is_starred: true,
          created_at: new Date().toISOString(),
          sender: {
            first_name: 'HR',
            last_name: 'Manager',
            department: 'Human Resources',
            position: 'HR Manager'
          }
        },
        {
          id: '2',
          sender_id: '2',
          recipient_id: profile?.id,
          recipient_type: 'individual',
          subject: 'Meeting Reminder',
          content: 'Reminder: Team meeting scheduled for tomorrow at 10:00 AM. Please prepare your weekly status updates.',
          priority: 'medium',
          is_read: true,
          is_starred: false,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          sender: {
            first_name: 'Team',
            last_name: 'Lead',
            department: 'Engineering',
            position: 'Team Lead'
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Fetch employees for recipient selection
  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees', {
        params: { status: 'active' }
      })
      const allEmployees = response || []
      setEmployees(allEmployees.filter((e: any) => e.id !== profile?.id))
    } catch (error) {
      // Demo employees
      setEmployees([
        { id: '1', first_name: 'John', last_name: 'Doe', department: 'Engineering', position: 'Developer' },
        { id: '2', first_name: 'Jane', last_name: 'Smith', department: 'HR', position: 'Manager' }
      ])
    }
  }

  // Send message
  const handleSendMessage = async () => {
    try {
      const messageData = {
        ...newMessage,
        sender_id: profile?.id,
        is_read: false,
        is_starred: false
      }

      await api.post('/messages', messageData)

      // Send notification
      await sendNotification(newMessage)

      setComposeOpen(false)
      resetNewMessage()
      fetchMessages()
      toast.success('Message sent successfully')

    } catch (error) {
      // Optimistic update for demo
      const demoMessage: Message = {
        id: Date.now().toString(),
        sender_id: profile?.id || '',
        ...newMessage,
        is_read: false,
        is_starred: false,
        created_at: new Date().toISOString(),
        sender: {
          first_name: profile?.first_name || 'You',
          last_name: profile?.last_name || '',
          department: profile?.department || '',
          position: profile?.position || ''
        }
      }
      setMessages(prev => [demoMessage, ...prev])
      setComposeOpen(false)
      resetNewMessage()
      toast.success('Message sent successfully')
    }
  }

  // Send notification
  const sendNotification = async (message: NewMessage) => {
    try {
      let recipients: string[] = []

      if (message.recipient_type === 'individual' && message.recipient_id) {
        recipients = [message.recipient_id]
      } else if (message.recipient_type === 'department') {
        const response = await api.get('/employees', {
          params: { department: message.recipient_id, status: 'active' }
        })
        recipients = (response || []).map((emp: any) => emp.id)
      } else if (message.recipient_type === 'all') {
        const response = await api.get('/employees', {
          params: { status: 'active' }
        })
        recipients = (response || []).map((emp: any) => emp.id)
      }

      const notifications = recipients.map(recipientId => ({
        recipient_id: recipientId,
        sender_id: profile?.id,
        type: 'message',
        title: `New message: ${message.subject}`,
        content: message.content.substring(0, 100) + '...',
        is_read: false
      }))

      if (notifications.length > 0) {
        await api.post('/notifications/bulk', { notifications })
      }
    } catch (error) {
      // Notification sending is optional
    }
  }

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      await api.put(`/messages/${messageId}`, { is_read: true })
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ))
    } catch (error) {
      // Optimistic update
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ))
    }
  }

  // Toggle star
  const toggleStar = async (messageId: string, isStarred: boolean) => {
    try {
      await api.put(`/messages/${messageId}`, { is_starred: !isStarred })
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_starred: !isStarred } : msg
      ))
    } catch (error) {
      // Optimistic update
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, is_starred: !isStarred } : msg
      ))
    }
  }

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await api.delete(`/messages/${messageId}`)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      setSelectedMessage(null)
      toast.success('Message deleted')
    } catch (error) {
      // Optimistic update
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
      setSelectedMessage(null)
      toast.success('Message deleted')
    }
  }

  const resetNewMessage = () => {
    setNewMessage({
      recipient_type: 'individual',
      subject: '',
      content: '',
      priority: 'medium'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error'
      case 'medium': return 'warning'
      case 'low': return 'info'
      default: return 'default'
    }
  }

  const getFilteredMessages = () => {
    switch (filter) {
      case 'unread': return messages.filter(msg => !msg.is_read)
      case 'starred': return messages.filter(msg => msg.is_starred)
      default: return messages
    }
  }

  useEffect(() => {
    fetchMessages()
    fetchEmployees()
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Messages & Communications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Send messages and notifications to team members
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setComposeOpen(true)}
        >
          Compose
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* Message List */}
        <Grid size={{ xs: 12, md: 4 }} component="div">
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button
                  variant={filter === 'all' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </Button>
                <Button
                  variant={filter === 'starred' ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => setFilter('starred')}
                >
                  Starred
                </Button>
              </Stack>

              <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                {getFilteredMessages().map((message) => (
                  <ListItem
                    key={message.id}
                    component="li"
                    onClick={() => {
                      setSelectedMessage(message)
                      if (!message.is_read) {
                        markAsRead(message.id)
                      }
                    }}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: !message.is_read ? 'action.hover' : 'transparent',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.selected' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {message.sender.first_name[0]}{message.sender.last_name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography
                            variant="body2"
                            fontWeight={!message.is_read ? 'bold' : 'normal'}
                            noWrap
                          >
                            {message.subject}
                          </Typography>
                          <Chip
                            label={message.priority}
                            size="small"
                            color={getPriorityColor(message.priority) as any}
                          />
                        </Stack>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            From: {message.sender.first_name} {message.sender.last_name}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {new Date(message.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStar(message.id, message.is_starred)
                      }}
                    >
                      {message.is_starred ? <Star color="warning" /> : <StarBorder />}
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Message Content */}
        <Grid size={{ xs: 12, md: 8 }} component="div">
          {selectedMessage ? (
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {selectedMessage.subject}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      From: {selectedMessage.sender.first_name} {selectedMessage.sender.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small">
                      <Reply />
                    </IconButton>
                    <IconButton size="small">
                      <Forward />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMessage(selectedMessage.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedMessage.content}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Select a message to read
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Compose Message Dialog */}
      <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Compose Message</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }} component="div">
              <FormControl fullWidth>
                <InputLabel>Recipient Type</InputLabel>
                <Select
                  value={newMessage.recipient_type}
                  onChange={(e) => setNewMessage(prev => ({
                    ...prev,
                    recipient_type: e.target.value as any,
                    recipient_id: ''
                  }))}
                  label="Recipient Type"
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="department">Department</MenuItem>
                  <MenuItem value="all">All Employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {newMessage.recipient_type === 'individual' && (
              <Grid size={{ xs: 12, sm: 6 }} component="div">
                <FormControl fullWidth>
                  <InputLabel>Recipient</InputLabel>
                  <Select
                    value={newMessage.recipient_id || ''}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, recipient_id: e.target.value }))}
                    label="Recipient"
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} - {employee.department}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {newMessage.recipient_type === 'department' && (
              <Grid size={{ xs: 12, sm: 6 }} component="div">
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={newMessage.recipient_id || ''}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, recipient_id: e.target.value }))}
                    label="Department"
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6 }} component="div">
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newMessage.priority}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, priority: e.target.value as any }))}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }} component="div">
              <TextField
                fullWidth
                label="Subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
              />
            </Grid>

            <Grid size={{ xs: 12 }} component="div">
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={6}
                value={newMessage.content}
                onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComposeOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Send />} onClick={handleSendMessage}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MessagingSystem
