/**
 * CENTRAL TYPE EXPORTS
 * Single source of truth for all type definitions
 */

// Re-export all employee types
export * from './employee.types'
export * from './user.types'

// Common API response types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ApiResponse<T> {
  data?: T
  items?: T[]
  total?: number
  page?: number
  page_size?: number
  total_pages?: number
  message?: string
  error?: string
}

export interface ApiError {
  error: string
  message?: string
  statusCode?: number
}
