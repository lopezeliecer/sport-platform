export enum Permission {
  // Athletes permissions
  ATHLETES_CREATE = 'athletes:create',
  ATHLETES_READ = 'athletes:read',
  ATHLETES_UPDATE = 'athletes:update',
  ATHLETES_DELETE = 'athletes:delete',
  ATHLETES_VIEW_MEDICAL = 'athletes:view_medical',
  ATHLETES_ASSIGN_TRAINING = 'athletes:assign_training',

  // Training permissions
  TRAINING_CREATE = 'training:create',
  TRAINING_READ = 'training:read',
  TRAINING_UPDATE = 'training:update',
  TRAINING_DELETE = 'training:delete',
  TRAINING_ASSIGN = 'training:assign',
  TRAINING_VIEW_RESULTS = 'training:view_results',
  TRAINING_MANAGE_TEMPLATES = 'training:manage_templates',

  // Performance permissions
  PERFORMANCE_CREATE = 'performance:create',
  PERFORMANCE_READ = 'performance:read',
  PERFORMANCE_UPDATE = 'performance:update',
  PERFORMANCE_DELETE = 'performance:delete',
  PERFORMANCE_VIEW_ANALYTICS = 'performance:view_analytics',
  PERFORMANCE_EXPORT_DATA = 'performance:export_data',

  // Competitions permissions
  COMPETITIONS_CREATE = 'competitions:create',
  COMPETITIONS_READ = 'competitions:read',
  COMPETITIONS_UPDATE = 'competitions:update',
  COMPETITIONS_DELETE = 'competitions:delete',
  COMPETITIONS_REGISTER_ATHLETES = 'competitions:register_athletes',
  COMPETITIONS_MANAGE_RESULTS = 'competitions:manage_results',

  // Payments permissions
  PAYMENTS_CREATE = 'payments:create',
  PAYMENTS_READ = 'payments:read',
  PAYMENTS_UPDATE = 'payments:update',
  PAYMENTS_DELETE = 'payments:delete',
  PAYMENTS_VIEW_REPORTS = 'payments:view_reports',
  PAYMENTS_MANAGE_DEBTS = 'payments:manage_debts',

  // Communications permissions
  COMMUNICATIONS_CREATE = 'communications:create',
  COMMUNICATIONS_READ = 'communications:read',
  COMMUNICATIONS_UPDATE = 'communications:update',
  COMMUNICATIONS_DELETE = 'communications:delete',
  COMMUNICATIONS_SEND_NOTIFICATIONS = 'communications:send_notifications',
  COMMUNICATIONS_MANAGE_ANNOUNCEMENTS = 'communications:manage_announcements',

  // Medical permissions
  MEDICAL_CREATE = 'medical:create',
  MEDICAL_READ = 'medical:read',
  MEDICAL_UPDATE = 'medical:update',
  MEDICAL_DELETE = 'medical:delete',
  MEDICAL_VIEW_FULL_HISTORY = 'medical:view_full_history',
  MEDICAL_MANAGE_RESTRICTIONS = 'medical:manage_restrictions',

  // Club management permissions
  CLUB_MANAGE_SETTINGS = 'club:manage_settings',
  CLUB_MANAGE_USERS = 'club:manage_users',
  CLUB_VIEW_ANALYTICS = 'club:view_analytics',
  CLUB_MANAGE_BILLING = 'club:manage_billing',
  CLUB_EXPORT_DATA = 'club:export_data',

  // Security permissions
  SECURITY_VIEW = 'security:view',
  SECURITY_MANAGE = 'security:manage',
  SECURITY_AUDIT = 'security:audit',
  SECURITY_TESTING = 'security:testing',
}

export enum PermissionScope {
  OWN = 'own', // Only own data
  CLUB = 'club', // All data within the club
  ALL = 'all', // All data across clubs (super admin)
}

export interface PermissionDefinition {
  permission: Permission;
  scope: PermissionScope;
  conditions?: Record<string, any>;
}

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<string, PermissionDefinition[]> = {
  CLUB_ADMIN: [
    // Club admin has all permissions within their club
    { permission: Permission.ATHLETES_CREATE, scope: PermissionScope.CLUB },
    { permission: Permission.ATHLETES_READ, scope: PermissionScope.CLUB },
    { permission: Permission.ATHLETES_UPDATE, scope: PermissionScope.CLUB },
    { permission: Permission.ATHLETES_DELETE, scope: PermissionScope.CLUB },
    {
      permission: Permission.ATHLETES_VIEW_MEDICAL,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.ATHLETES_ASSIGN_TRAINING,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.TRAINING_CREATE, scope: PermissionScope.CLUB },
    { permission: Permission.TRAINING_READ, scope: PermissionScope.CLUB },
    { permission: Permission.TRAINING_UPDATE, scope: PermissionScope.CLUB },
    { permission: Permission.TRAINING_DELETE, scope: PermissionScope.CLUB },
    { permission: Permission.TRAINING_ASSIGN, scope: PermissionScope.CLUB },
    {
      permission: Permission.TRAINING_VIEW_RESULTS,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.TRAINING_MANAGE_TEMPLATES,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.PERFORMANCE_CREATE, scope: PermissionScope.CLUB },
    { permission: Permission.PERFORMANCE_READ, scope: PermissionScope.CLUB },
    { permission: Permission.PERFORMANCE_UPDATE, scope: PermissionScope.CLUB },
    { permission: Permission.PERFORMANCE_DELETE, scope: PermissionScope.CLUB },
    {
      permission: Permission.PERFORMANCE_VIEW_ANALYTICS,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.PERFORMANCE_EXPORT_DATA,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.COMPETITIONS_CREATE, scope: PermissionScope.CLUB },
    { permission: Permission.COMPETITIONS_READ, scope: PermissionScope.CLUB },
    { permission: Permission.COMPETITIONS_UPDATE, scope: PermissionScope.CLUB },
    { permission: Permission.COMPETITIONS_DELETE, scope: PermissionScope.CLUB },
    {
      permission: Permission.COMPETITIONS_REGISTER_ATHLETES,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.COMPETITIONS_MANAGE_RESULTS,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.PAYMENTS_CREATE, scope: PermissionScope.CLUB },
    { permission: Permission.PAYMENTS_READ, scope: PermissionScope.CLUB },
    { permission: Permission.PAYMENTS_UPDATE, scope: PermissionScope.CLUB },
    { permission: Permission.PAYMENTS_DELETE, scope: PermissionScope.CLUB },
    {
      permission: Permission.PAYMENTS_VIEW_REPORTS,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.PAYMENTS_MANAGE_DEBTS,
      scope: PermissionScope.CLUB,
    },

    {
      permission: Permission.COMMUNICATIONS_CREATE,
      scope: PermissionScope.CLUB,
    },
    { permission: Permission.COMMUNICATIONS_READ, scope: PermissionScope.CLUB },
    {
      permission: Permission.COMMUNICATIONS_UPDATE,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.COMMUNICATIONS_DELETE,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.COMMUNICATIONS_SEND_NOTIFICATIONS,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.COMMUNICATIONS_MANAGE_ANNOUNCEMENTS,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.MEDICAL_READ, scope: PermissionScope.CLUB },
    {
      permission: Permission.MEDICAL_VIEW_FULL_HISTORY,
      scope: PermissionScope.CLUB,
    },

    {
      permission: Permission.CLUB_MANAGE_SETTINGS,
      scope: PermissionScope.CLUB,
    },
    { permission: Permission.CLUB_MANAGE_USERS, scope: PermissionScope.CLUB },
    { permission: Permission.CLUB_VIEW_ANALYTICS, scope: PermissionScope.CLUB },
    { permission: Permission.CLUB_MANAGE_BILLING, scope: PermissionScope.CLUB },
    { permission: Permission.CLUB_EXPORT_DATA, scope: PermissionScope.CLUB },

    // Security permissions for club admins
    { permission: Permission.SECURITY_VIEW, scope: PermissionScope.CLUB },
    { permission: Permission.SECURITY_MANAGE, scope: PermissionScope.CLUB },
    { permission: Permission.SECURITY_AUDIT, scope: PermissionScope.CLUB },
    { permission: Permission.SECURITY_TESTING, scope: PermissionScope.CLUB },
  ],

  COACH: [
    { permission: Permission.ATHLETES_READ, scope: PermissionScope.CLUB },
    { permission: Permission.ATHLETES_UPDATE, scope: PermissionScope.CLUB },
    {
      permission: Permission.ATHLETES_ASSIGN_TRAINING,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.TRAINING_CREATE, scope: PermissionScope.CLUB },
    { permission: Permission.TRAINING_READ, scope: PermissionScope.CLUB },
    { permission: Permission.TRAINING_UPDATE, scope: PermissionScope.CLUB },
    { permission: Permission.TRAINING_ASSIGN, scope: PermissionScope.CLUB },
    {
      permission: Permission.TRAINING_VIEW_RESULTS,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.TRAINING_MANAGE_TEMPLATES,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.PERFORMANCE_CREATE, scope: PermissionScope.CLUB },
    { permission: Permission.PERFORMANCE_READ, scope: PermissionScope.CLUB },
    { permission: Permission.PERFORMANCE_UPDATE, scope: PermissionScope.CLUB },
    {
      permission: Permission.PERFORMANCE_VIEW_ANALYTICS,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.COMPETITIONS_READ, scope: PermissionScope.CLUB },
    {
      permission: Permission.COMPETITIONS_REGISTER_ATHLETES,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.COMPETITIONS_MANAGE_RESULTS,
      scope: PermissionScope.CLUB,
    },

    {
      permission: Permission.COMMUNICATIONS_CREATE,
      scope: PermissionScope.CLUB,
    },
    { permission: Permission.COMMUNICATIONS_READ, scope: PermissionScope.CLUB },

    { permission: Permission.MEDICAL_READ, scope: PermissionScope.CLUB },
  ],

  ATHLETE: [
    { permission: Permission.TRAINING_READ, scope: PermissionScope.OWN },
    { permission: Permission.PERFORMANCE_READ, scope: PermissionScope.OWN },
    { permission: Permission.PERFORMANCE_CREATE, scope: PermissionScope.OWN },
    { permission: Permission.COMPETITIONS_READ, scope: PermissionScope.OWN },
    { permission: Permission.COMMUNICATIONS_READ, scope: PermissionScope.CLUB },
    { permission: Permission.MEDICAL_READ, scope: PermissionScope.OWN },
  ],

  MEDICAL_STAFF: [
    { permission: Permission.ATHLETES_READ, scope: PermissionScope.CLUB },
    {
      permission: Permission.ATHLETES_VIEW_MEDICAL,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.MEDICAL_CREATE, scope: PermissionScope.CLUB },
    { permission: Permission.MEDICAL_READ, scope: PermissionScope.CLUB },
    { permission: Permission.MEDICAL_UPDATE, scope: PermissionScope.CLUB },
    { permission: Permission.MEDICAL_DELETE, scope: PermissionScope.CLUB },
    {
      permission: Permission.MEDICAL_VIEW_FULL_HISTORY,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.MEDICAL_MANAGE_RESTRICTIONS,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.PERFORMANCE_READ, scope: PermissionScope.CLUB },
    { permission: Permission.COMMUNICATIONS_READ, scope: PermissionScope.CLUB },
  ],

  PARENT: [
    {
      permission: Permission.ATHLETES_READ,
      scope: PermissionScope.OWN,
      conditions: { relationship: 'parent' },
    },
    {
      permission: Permission.TRAINING_READ,
      scope: PermissionScope.OWN,
      conditions: { relationship: 'parent' },
    },
    {
      permission: Permission.PERFORMANCE_READ,
      scope: PermissionScope.OWN,
      conditions: { relationship: 'parent' },
    },
    {
      permission: Permission.COMPETITIONS_READ,
      scope: PermissionScope.OWN,
      conditions: { relationship: 'parent' },
    },
    { permission: Permission.COMMUNICATIONS_READ, scope: PermissionScope.CLUB },
    {
      permission: Permission.MEDICAL_READ,
      scope: PermissionScope.OWN,
      conditions: { relationship: 'parent' },
    },
  ],

  CLUB_DIRECTOR: [
    { permission: Permission.ATHLETES_READ, scope: PermissionScope.CLUB },
    { permission: Permission.TRAINING_READ, scope: PermissionScope.CLUB },
    { permission: Permission.PERFORMANCE_READ, scope: PermissionScope.CLUB },
    {
      permission: Permission.PERFORMANCE_VIEW_ANALYTICS,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.PERFORMANCE_EXPORT_DATA,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.COMPETITIONS_READ, scope: PermissionScope.CLUB },

    { permission: Permission.PAYMENTS_READ, scope: PermissionScope.CLUB },
    {
      permission: Permission.PAYMENTS_VIEW_REPORTS,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.COMMUNICATIONS_READ, scope: PermissionScope.CLUB },
    {
      permission: Permission.COMMUNICATIONS_CREATE,
      scope: PermissionScope.CLUB,
    },
    {
      permission: Permission.COMMUNICATIONS_MANAGE_ANNOUNCEMENTS,
      scope: PermissionScope.CLUB,
    },

    { permission: Permission.CLUB_VIEW_ANALYTICS, scope: PermissionScope.CLUB },
    { permission: Permission.CLUB_EXPORT_DATA, scope: PermissionScope.CLUB },
  ],
};

export class PermissionChecker {
  static hasPermission(
    userRoles: Array<{
      role: string;
      clubId: string;
      permissions?: PermissionDefinition[];
    }>,
    requiredPermission: Permission,
    targetClubId: string,
    resourceOwnerId?: string,
    userId?: string,
  ): boolean {
    // Find the user's role in the target club
    const clubRole = userRoles.find((r) => r.clubId === targetClubId);
    if (!clubRole) {
      return false;
    }

    // Get permissions for this role
    const rolePermissions = ROLE_PERMISSIONS[clubRole.role] || [];

    // Add any custom permissions
    const allPermissions = [...rolePermissions, ...(clubRole.permissions || [])];

    // Check if user has the required permission
    const hasPermission = allPermissions.some((perm) => {
      if (perm.permission !== requiredPermission) {
        return false;
      }

      // Check scope
      switch (perm.scope) {
        case PermissionScope.ALL:
          return true;
        case PermissionScope.CLUB:
          return true;
        case PermissionScope.OWN:
          // For OWN scope, check if user owns the resource or has parent relationship
          if (perm.conditions?.relationship === 'parent') {
            // TODO: Implement parent relationship check
            return false;
          }
          return resourceOwnerId === userId;
        default:
          return false;
      }
    });

    return hasPermission;
  }

  static getPermissionsForRole(role: string): PermissionDefinition[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  static getAllPermissions(): Permission[] {
    return Object.values(Permission);
  }
}
