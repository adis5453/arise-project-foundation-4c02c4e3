'use client'

import { api } from '../lib/api'
import { toast } from 'sonner'
import { ROLES } from '../types/permissions'

// Role detection patterns
export interface RoleDetectionRule {
  pattern: RegExp | string
  role: string
  priority: number // Higher number = higher priority
  description: string
  requiresApproval?: boolean
  additionalRequirements?: string[]
}

// Email domain-based role detection rules
export const EMAIL_ROLE_RULES: RoleDetectionRule[] = [
  // Super Admin patterns
  {
    pattern: /^(admin|superadmin|root|system)@/i,
    role: 'super_admin',
    priority: 100,
    description: 'Super Administrator - System account',
    requiresApproval: false
  },
  {
    pattern: /^.*@(admin|superadmin|system)\./i,
    role: 'super_admin',
    priority: 95,
    description: 'Super Administrator - Admin domain',
    requiresApproval: true
  },

  // Admin patterns
  {
    pattern: /^(it|tech|admin|administrator)@/i,
    role: 'admin',
    priority: 90,
    description: 'Administrator - IT/Tech account',
    requiresApproval: false
  },
  {
    pattern: /^.*@(it|admin|tech)\./i,
    role: 'admin',
    priority: 85,
    description: 'Administrator - IT domain',
    requiresApproval: true
  },

  // HR Manager patterns
  {
    pattern: /^(hr|human-?resources?|people|talent|recruiting?)@/i,
    role: 'hr_manager',
    priority: 80,
    description: 'HR Manager - Human Resources account',
    requiresApproval: false
  },
  {
    pattern: /^.*@(hr|humanresources|people|talent)\./i,
    role: 'hr_manager',
    priority: 75,
    description: 'HR Manager - HR domain',
    requiresApproval: false
  },

  // Department Manager patterns
  {
    pattern: /^(manager|dept|department|head|director|lead|chief)@/i,
    role: 'department_manager',
    priority: 70,
    description: 'Department Manager - Management account',
    requiresApproval: true
  },
  {
    pattern: /^(finance|accounting|legal|marketing|sales|operations)@/i,
    role: 'department_manager',
    priority: 65,
    description: 'Department Manager - Department head',
    requiresApproval: true
  },

  // Team Leader patterns
  {
    pattern: /^(team-?lead|supervisor|coordinator|senior)@/i,
    role: 'team_lead',
    priority: 60,
    description: 'Team Leader - Team management',
    requiresApproval: true
  },
  {
    pattern: /^senior\./i,
    role: 'senior_employee',
    priority: 55,
    description: 'Senior Employee - Experienced staff',
    requiresApproval: false
  },

  // Default Employee pattern (lowest priority)
  {
    pattern: /^.*@.*$/,
    role: 'employee',
    priority: 10,
    description: 'Employee - Standard access',
    requiresApproval: false
  }
]

// Domain-specific role mappings
export const DOMAIN_ROLE_MAPPING: Record<string, string> = {
  'arisehrm.com': 'employee',
  'admin.arisehrm.com': 'admin',
  'hr.arisehrm.com': 'hr_manager',
  'managers.arisehrm.com': 'department_manager',
  'leads.arisehrm.com': 'team_lead',
  'system.arisehrm.com': 'super_admin'
}

// Company-specific patterns
export const COMPANY_PATTERNS = {
  departments: ['finance', 'hr', 'it', 'marketing', 'sales', 'legal', 'operations'],
  managementTitles: ['manager', 'director', 'head', 'lead', 'chief', 'vp', 'president'],
  seniorityLevels: ['senior', 'lead', 'principal', 'staff']
}

export interface RoleDetectionResult {
  suggestedRole: string
  confidence: number // 0-100
  matchedRule: RoleDetectionRule
  requiresApproval: boolean
  alternativeRoles?: string[]
  securityFlags?: string[]
}

export interface SecurityAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: string[]
  recommendations: string[]
  allowLogin: boolean
  requiresAdditionalVerification: boolean
}

export interface TemporaryPasswordResult {
  temporaryPassword: string
  expiresAt: string
  success: boolean
  error?: string
  requiresPasswordChange: boolean
}

export class AdvancedLoginService {
  private static instance: AdvancedLoginService

  static getInstance(): AdvancedLoginService {
    if (!AdvancedLoginService.instance) {
      AdvancedLoginService.instance = new AdvancedLoginService()
    }
    return AdvancedLoginService.instance
  }

  /**
   * Detect user role based on email address and patterns
   */
  async detectRoleFromEmail(email: string): Promise<RoleDetectionResult> {
    try {
      const normalizedEmail = email.toLowerCase().trim()
      const domain = normalizedEmail.split('@')[1]

      // Check domain-specific mappings first
      if (DOMAIN_ROLE_MAPPING[domain]) {
        const role = DOMAIN_ROLE_MAPPING[domain]
        const rule: RoleDetectionRule = {
          pattern: domain,
          role,
          priority: 100,
          description: `Direct domain mapping for ${domain}`,
          requiresApproval: false
        }

        return {
          suggestedRole: role,
          confidence: 95,
          matchedRule: rule,
          requiresApproval: false
        }
      }

      // Apply pattern-based detection
      let bestMatch: RoleDetectionResult | null = null
      let highestPriority = 0

      for (const rule of EMAIL_ROLE_RULES) {
        const pattern = typeof rule.pattern === 'string'
          ? new RegExp(rule.pattern, 'i')
          : rule.pattern

        if (pattern.test(normalizedEmail) && rule.priority > highestPriority) {
          highestPriority = rule.priority

          const confidence = this.calculateConfidence(normalizedEmail, rule)
          const alternativeRoles = this.getAlternativeRoles(normalizedEmail, rule)
          const securityFlags = this.analyzeSecurityFlags(normalizedEmail)

          bestMatch = {
            suggestedRole: rule.role,
            confidence,
            matchedRule: rule,
            requiresApproval: rule.requiresApproval || confidence < 80,
            alternativeRoles,
            securityFlags
          }
        }
      }

      if (!bestMatch) {
        // Fallback to employee role
        const fallbackRule: RoleDetectionRule = {
          pattern: /.*@.*/,
          role: 'employee',
          priority: 0,
          description: 'Default employee role - manual review recommended'
        }

        bestMatch = {
          suggestedRole: 'employee',
          confidence: 50,
          matchedRule: fallbackRule,
          requiresApproval: true,
          securityFlags: ['unknown_pattern']
        }
      }

      return bestMatch
    } catch (error) {
      throw new Error('Failed to detect user role from email')
    }
  }

  /**
   * Advanced security assessment before login
   * Note: Deep security checks (IP, device fingerprint) should be handled by the backend.
   * This logic now performs client-side pattern analysis only.
   */
  async assessLoginSecurity(
    email: string,
    ipAddress: string,
    deviceFingerprint: string
  ): Promise<SecurityAssessment> {
    try {
      const riskFactors: string[] = []
      const recommendations: string[] = []
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

      // Check for unusual time access (Client side check)
      const currentHour = new Date().getHours()
      if (currentHour < 6 || currentHour > 22) {
        riskFactors.push('unusual_time')
        if (riskLevel === 'low') riskLevel = 'medium'
        recommendations.push('Unusual login time detected')
      }

      // Determine final assessment
      const allowLogin = (riskLevel as string) !== 'critical'
      const requiresAdditionalVerification = (riskLevel as string) === 'high' || (riskLevel as string) === 'critical'

      return {
        riskLevel,
        riskFactors,
        recommendations,
        allowLogin,
        requiresAdditionalVerification
      }

    } catch (error) {
      // Fail secure - high risk if we can't assess
      return {
        riskLevel: 'high',
        riskFactors: ['assessment_failed'],
        recommendations: ['Additional verification required'],
        allowLogin: true,
        requiresAdditionalVerification: true
      }
    }
  }

  /**
   * Enhanced login with role detection and security
   */
  async performAdvancedLogin(
    email: string,
    password: string,
    options: {
      deviceFingerprint?: string
      ipAddress?: string
      userAgent?: string
      rememberMe?: boolean
      deviceTrust?: boolean
    } = {}
  ) {
    try {
      const normalizedEmail = email.toLowerCase().trim()

      // Attempt authentication via API
      const authResponse = await api.login({
        email: normalizedEmail,
        password
      })

      if (!authResponse.user) {
        throw new Error('Authentication successful but no user data received')
      }

      // Role detection for UI feedback (optional, since backend provides role)
      const roleDetection = await this.detectRoleFromEmail(normalizedEmail)

      // Calculate a client-side confidence/security score for display
      const securityAssessment = await this.assessLoginSecurity(email, options.ipAddress || 'unknown', options.deviceFingerprint || 'unknown')

      return {
        success: true,
        user: authResponse.user,
        roleDetection,
        securityAssessment,
        requiresAdditionalVerification: false
      }

    } catch (error) {
      throw error
    }
  }
  async validateTemporaryPasswordLogin(
    email: string,
    tempPass: string,
    newPass?: string
  ): Promise<TemporaryPasswordResult> {
    // Mock implementation for frontend logic
    if (tempPass === 'temp123' && !newPass) {
      return {
        temporaryPassword: '',
        expiresAt: '',
        success: false,
        requiresPasswordChange: true
      }
    }
    return {
      temporaryPassword: '',
      expiresAt: '',
      success: true,
      requiresPasswordChange: false
    }
  }

  async createTemporaryPassword(
    email: string,
    role: string,
    initiatedBy: string
  ): Promise<TemporaryPasswordResult> {
    // Mock implementation
    return {
      temporaryPassword: Math.random().toString(36).slice(-8).toUpperCase(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      success: true,
      requiresPasswordChange: true
    }
  }

  // Private helper methods

  private calculateConfidence(email: string, rule: RoleDetectionRule): number {
    let confidence = rule.priority

    // Boost confidence for exact domain matches
    if (email.includes('@' + rule.pattern.toString().replace(/[^\w.]/g, ''))) {
      confidence += 20
    }

    // Reduce confidence for generic patterns
    if (rule.pattern.toString().includes('.*')) {
      confidence -= 10
    }

    // Boost confidence for specific role keywords
    const roleKeywords = {
      admin: ['admin', 'administrator', 'root', 'system'],
      hr_manager: ['hr', 'human', 'people', 'talent'],
      department_manager: ['manager', 'director', 'head', 'chief'],
      team_lead: ['lead', 'supervisor', 'coordinator']
    }

    const keywords = roleKeywords[rule.role as keyof typeof roleKeywords] || []
    for (const keyword of keywords) {
      if (email.toLowerCase().includes(keyword)) {
        confidence += 5
      }
    }

    return Math.min(100, Math.max(0, confidence))
  }

  private getAlternativeRoles(email: string, primaryRule: RoleDetectionRule): string[] {
    const alternatives: string[] = []

    for (const rule of EMAIL_ROLE_RULES) {
      if (rule.role !== primaryRule.role) {
        const pattern = typeof rule.pattern === 'string'
          ? new RegExp(rule.pattern, 'i')
          : rule.pattern

        if (pattern.test(email) && rule.priority > 40) {
          alternatives.push(rule.role)
        }
      }
    }

    return alternatives.slice(0, 3) // Limit to top 3 alternatives
  }

  private analyzeSecurityFlags(email: string): string[] {
    const flags: string[] = []

    // Check for potentially suspicious patterns
    if (/\d{4,}/.test(email)) {
      flags.push('numeric_sequence')
    }

    if (/test|temp|demo|fake/i.test(email)) {
      flags.push('test_account_pattern')
    }

    if (email.split('@')[0].length < 3) {
      flags.push('short_username')
    }

    const domain = email.split('@')[1]
    if (domain && (domain.includes('gmail') || domain.includes('yahoo') || domain.includes('hotmail'))) {
      flags.push('personal_email_domain')
    }

    return flags
  }
}

export const advancedLoginService = AdvancedLoginService.getInstance();
