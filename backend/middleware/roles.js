/**
 * Role-Based Access Control Middleware
 * Implements hierarchical permissions with scope-based access
 */

// Role hierarchy (higher number = more access)
const ROLE_HIERARCHY = {
    'super_admin': 6,
    'admin': 5,
    'hr_manager': 4,
    'department_manager': 3,
    'manager': 3,
    'team_leader': 2,
    'employee': 1
};

// Permission scopes
const SCOPES = {
    OWN: 'own',           // User's own data only
    TEAM: 'team',         // Team members (for team leaders)
    DEPARTMENT: 'department', // Department-wide (for dept managers)
    ALL: 'all'           // Organization-wide (for admin/HR)
};

/**
 * Check if user has one of the allowed roles
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRole = req.user.role ? req.user.role.toLowerCase() : '';
        const allowed = allowedRoles.map(r => r.toLowerCase());

        // Super admin always has access
        if (userRole === 'super_admin') {
            next();
            return;
        }

        // Check if user's role is in allowed list
        if (allowed.includes(userRole)) {
            next();
        } else {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
    };
};

/**
 * Check if user has minimum role level
 */
const checkMinRole = (minRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRole = req.user.role ? req.user.role.toLowerCase() : '';
        const userLevel = ROLE_HIERARCHY[userRole] || 0;
        const requiredLevel = ROLE_HIERARCHY[minRole.toLowerCase()] || 999;

        if (userLevel >= requiredLevel) {
            next();
        } else {
            return res.status(403).json({ error: 'Forbidden: Insufficient role level' });
        }
    };
};

/**
 * Get user's access scope based on role
 */
const getAccessScope = (user) => {
    const role = user.role ? user.role.toLowerCase() : '';

    switch (role) {
        case 'super_admin':
        case 'admin':
        case 'hr_manager':
            return SCOPES.ALL;
        case 'department_manager':
        case 'manager':
            return SCOPES.DEPARTMENT;
        case 'team_leader':
            return SCOPES.TEAM;
        default:
            return SCOPES.OWN;
    }
};

/**
 * Middleware to add scope to request
 */
const addScope = (req, res, next) => {
    if (req.user) {
        req.user.scope = getAccessScope(req.user);
    }
    next();
};

/**
 * Check if user can access specific employee's data
 */
const canAccessEmployee = async (accessingUser, targetEmployeeId, pool) => {
    const scope = getAccessScope(accessingUser);

    // ALL scope can access anyone
    if (scope === SCOPES.ALL) return true;

    // Own data always accessible
    if (accessingUser.id === targetEmployeeId) return true;

    // For DEPARTMENT scope, check if target is in same department
    if (scope === SCOPES.DEPARTMENT) {
        const result = await pool.query(
            'SELECT department_id FROM user_profiles WHERE id = $1',
            [targetEmployeeId]
        );
        if (result.rows.length > 0) {
            return result.rows[0].department_id === accessingUser.department_id;
        }
    }

    // For TEAM scope, check if target reports to accessing user
    if (scope === SCOPES.TEAM) {
        const result = await pool.query(
            'SELECT manager_id FROM user_profiles WHERE id = $1',
            [targetEmployeeId]
        );
        if (result.rows.length > 0) {
            return result.rows[0].manager_id === accessingUser.id;
        }
    }

    return false;
};

/**
 * Check if user can approve for another user
 */
const canApproveFor = (approverRole, targetRole) => {
    const approverLevel = ROLE_HIERARCHY[approverRole] || 0;
    const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

    // Can only approve for users at lower level
    return approverLevel > targetLevel;
};

/**
 * Get list of role names user can manage
 */
const getManagedRoles = (userRole) => {
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const managedRoles = [];

    for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
        if (level < userLevel) {
            managedRoles.push(role);
        }
    }

    return managedRoles;
};

/**
 * Permission definitions for modules
 */
const MODULE_PERMISSIONS = {
    // Leave Management
    'leave.request.create': { minRole: 'employee', scope: SCOPES.OWN },
    'leave.request.view_own': { minRole: 'employee', scope: SCOPES.OWN },
    'leave.request.view_team': { minRole: 'team_leader', scope: SCOPES.TEAM },
    'leave.request.view_dept': { minRole: 'department_manager', scope: SCOPES.DEPARTMENT },
    'leave.request.view_all': { minRole: 'hr_manager', scope: SCOPES.ALL },
    'leave.request.approve': { minRole: 'team_leader', scope: SCOPES.TEAM },
    'leave.types.manage': { minRole: 'hr_manager', scope: SCOPES.ALL },

    // WFH
    'wfh.request.create': { minRole: 'employee', scope: SCOPES.OWN },
    'wfh.request.approve': { minRole: 'team_leader', scope: SCOPES.TEAM },
    'wfh.policy.manage': { minRole: 'hr_manager', scope: SCOPES.ALL },

    // Attendance
    'attendance.clock': { minRole: 'employee', scope: SCOPES.OWN },
    'attendance.view_own': { minRole: 'employee', scope: SCOPES.OWN },
    'attendance.view_team': { minRole: 'team_leader', scope: SCOPES.TEAM },
    'attendance.view_all': { minRole: 'hr_manager', scope: SCOPES.ALL },
    'attendance.edit': { minRole: 'hr_manager', scope: SCOPES.ALL },

    // Expenses
    'expenses.create': { minRole: 'employee', scope: SCOPES.OWN },
    'expenses.approve': { minRole: 'team_leader', scope: SCOPES.TEAM },
    'expenses.reimburse': { minRole: 'hr_manager', scope: SCOPES.ALL },

    // Employees
    'employees.view_own': { minRole: 'employee', scope: SCOPES.OWN },
    'employees.view_team': { minRole: 'team_leader', scope: SCOPES.TEAM },
    'employees.view_all': { minRole: 'hr_manager', scope: SCOPES.ALL },
    'employees.manage': { minRole: 'hr_manager', scope: SCOPES.ALL },

    // System
    'system.settings': { minRole: 'admin', scope: SCOPES.ALL },
    'system.config': { minRole: 'super_admin', scope: SCOPES.ALL }
};

/**
 * Check specific permission
 */
const hasPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const permDef = MODULE_PERMISSIONS[permission];
        if (!permDef) {
            return res.status(500).json({ error: 'Unknown permission' });
        }

        const userLevel = ROLE_HIERARCHY[req.user.role.toLowerCase()] || 0;
        const requiredLevel = ROLE_HIERARCHY[permDef.minRole] || 999;

        if (userLevel >= requiredLevel) {
            req.user.scope = permDef.scope;
            next();
        } else {
            return res.status(403).json({ error: 'Forbidden: Missing permission' });
        }
    };
};

module.exports = {
    checkRole,
    checkMinRole,
    addScope,
    getAccessScope,
    canAccessEmployee,
    canApproveFor,
    getManagedRoles,
    hasPermission,
    ROLE_HIERARCHY,
    SCOPES,
    MODULE_PERMISSIONS
};
