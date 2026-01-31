import { toast } from 'sonner'

export async function initializeCompleteDatabase() {
  toast.info('Database initialization should be performed via backend scripts.', {
    description: 'Client-side seeding has been removed.'
  })
  return { success: true, message: 'Please use backend seeding.' }
}

export async function createSampleUserProfile(authUserId: string, email: string) {
  // This should be handled by the backend on registration
  return { success: true }
}

export const initializeDepartments = async () => ({ success: true })
export const initializePositions = async () => ({ success: true })
export const initializeRoles = async () => ({ success: true })
export const initializeLeaveTypes = async () => ({ success: true })
export const initializePermissions = async () => ({ success: true })
export const testDatabaseConnection = async () => ({ success: true, message: 'Database connection managed by backend.' })

export default {
  initializeCompleteDatabase,
  createSampleUserProfile,
  initializeDepartments,
  initializePositions,
  initializeRoles,
  initializeLeaveTypes,
  initializePermissions,
  testDatabaseConnection
}
