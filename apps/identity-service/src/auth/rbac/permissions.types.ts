/**
 * Sistema RBAC (Role-Based Access Control) granular
 * Basado en Prompt 7: Estrategia de Autenticación
 */

export type Module =
  | "athletes"
  | "training"
  | "performance"
  | "competitions"
  | "payments"
  | "communications"
  | "medical"
  | "club_management"
  | "reports";

export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "assign"
  | "export"
  | "manage"
  | "approve"
  | "view_analytics"
  | "send_notifications"
  | "view_medical"
  | "manage_restrictions";

export type Scope = "own" | "club" | "all";

export interface Permission {
  module: Module | "*";
  action: Action | "*";
  scope?: Scope;
  conditions?: Record<string, any>; // Para permisos condicionales
}

export interface RolePermissions {
  role: string;
  permissions: Permission[];
  description: string;
}

/**
 * Definición de permisos por rol según Prompt 7
 */
export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  CLUB_ADMIN: {
    role: "CLUB_ADMIN",
    description: "Gestión completa del club, usuarios, configuración",
    permissions: [
      { module: "*", action: "*", scope: "club" }, // Acceso total al club
    ],
  },

  COACH: {
    role: "COACH",
    description:
      "Gestión de atletas, entrenamientos, performance, comunicación básica",
    permissions: [
      // Athletes management
      { module: "athletes", action: "read", scope: "club" },
      { module: "athletes", action: "update", scope: "club" },
      { module: "athletes", action: "assign", scope: "club" },

      // Training management
      { module: "training", action: "*", scope: "club" },

      // Performance tracking
      { module: "performance", action: "*", scope: "club" },
      { module: "performance", action: "view_analytics", scope: "club" },

      // Competitions
      { module: "competitions", action: "read", scope: "club" },
      { module: "competitions", action: "assign", scope: "club" },
      { module: "competitions", action: "manage", scope: "club" },

      // Communications
      { module: "communications", action: "create", scope: "club" },
      { module: "communications", action: "read", scope: "club" },
      { module: "communications", action: "send_notifications", scope: "club" },

      // Basic medical info (no sensitive data)
      {
        module: "medical",
        action: "read",
        scope: "club",
        conditions: { level: "basic" },
      },
    ],
  },

  ATHLETE: {
    role: "ATHLETE",
    description:
      "Ver información personal, entrenamientos asignados, registrar performance",
    permissions: [
      // Own athlete data
      { module: "athletes", action: "read", scope: "own" },
      {
        module: "athletes",
        action: "update",
        scope: "own",
        conditions: { fields: ["emergency_contact", "profile"] },
      },

      // Training access
      { module: "training", action: "read", scope: "own" },

      // Performance data
      { module: "performance", action: "read", scope: "own" },
      { module: "performance", action: "create", scope: "own" },
      { module: "performance", action: "update", scope: "own" },

      // Competitions
      { module: "competitions", action: "read", scope: "own" },

      // Communications (receive only)
      { module: "communications", action: "read", scope: "club" },

      // Own medical data
      { module: "medical", action: "read", scope: "own" },
    ],
  },

  MEDICAL_STAFF: {
    role: "MEDICAL_STAFF",
    description:
      "Acceso completo a datos médicos, restricciones, recomendaciones",
    permissions: [
      // Athletes medical data
      { module: "athletes", action: "read", scope: "club" },
      {
        module: "athletes",
        action: "update",
        scope: "club",
        conditions: { fields: ["medical_data"] },
      },

      // Full medical access
      { module: "medical", action: "*", scope: "club" },
      { module: "medical", action: "view_medical", scope: "club" },
      { module: "medical", action: "manage_restrictions", scope: "club" },

      // Performance (medical perspective)
      { module: "performance", action: "read", scope: "club" },
      { module: "performance", action: "view_analytics", scope: "club" },

      // Training restrictions
      { module: "training", action: "read", scope: "club" },
      { module: "training", action: "manage_restrictions", scope: "club" },

      // Communications for medical alerts
      {
        module: "communications",
        action: "create",
        scope: "club",
        conditions: { type: "medical" },
      },
      {
        module: "communications",
        action: "send_notifications",
        scope: "club",
        conditions: { type: "medical" },
      },
    ],
  },

  PARENT: {
    role: "PARENT",
    description: "Ver información de hijos atletas, comunicación básica",
    permissions: [
      // Children athletes data
      {
        module: "athletes",
        action: "read",
        scope: "own",
        conditions: { relation: "child" },
      },
      {
        module: "athletes",
        action: "update",
        scope: "own",
        conditions: { relation: "child", fields: ["emergency_contact"] },
      },

      // Children training
      {
        module: "training",
        action: "read",
        scope: "own",
        conditions: { relation: "child" },
      },

      // Children performance
      {
        module: "performance",
        action: "read",
        scope: "own",
        conditions: { relation: "child" },
      },

      // Children competitions
      {
        module: "competitions",
        action: "read",
        scope: "own",
        conditions: { relation: "child" },
      },

      // Payments for children
      {
        module: "payments",
        action: "read",
        scope: "own",
        conditions: { relation: "child" },
      },
      {
        module: "payments",
        action: "manage",
        scope: "own",
        conditions: { relation: "child" },
      },

      // Communications
      { module: "communications", action: "read", scope: "club" },
      {
        module: "communications",
        action: "create",
        scope: "club",
        conditions: { type: "parent_inquiry" },
      },

      // Children medical data (basic)
      {
        module: "medical",
        action: "read",
        scope: "own",
        conditions: { relation: "child", level: "basic" },
      },
    ],
  },

  CLUB_DIRECTOR: {
    role: "CLUB_DIRECTOR",
    description: "Reportes ejecutivos, estadísticas, análisis financiero",
    permissions: [
      // Club management
      { module: "club_management", action: "*", scope: "club" },

      // Financial reports
      { module: "payments", action: "read", scope: "club" },
      { module: "payments", action: "view_analytics", scope: "club" },
      { module: "payments", action: "export", scope: "club" },

      // Performance analytics
      { module: "performance", action: "read", scope: "club" },
      { module: "performance", action: "view_analytics", scope: "club" },
      { module: "performance", action: "export", scope: "club" },

      // Athletes overview
      { module: "athletes", action: "read", scope: "club" },

      // Training overview
      { module: "training", action: "read", scope: "club" },

      // Competitions overview
      { module: "competitions", action: "read", scope: "club" },
      { module: "competitions", action: "view_analytics", scope: "club" },

      // Communications management
      { module: "communications", action: "read", scope: "club" },
      { module: "communications", action: "manage", scope: "club" },

      // Reports access
      { module: "reports", action: "*", scope: "club" },
    ],
  },
};

/**
 * Utility para verificar si un rol tiene un permiso específico
 */
export function hasPermission(
  userRole: string,
  module: Module,
  action: Action,
  scope: Scope = "club",
  conditions?: Record<string, any>
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;

  return rolePermissions.permissions.some((permission) => {
    // Check module
    if (permission.module !== "*" && permission.module !== module) {
      return false;
    }

    // Check action
    if (permission.action !== "*" && permission.action !== action) {
      return false;
    }

    // Check scope
    if (permission.scope && permission.scope !== scope) {
      return false;
    }

    // Check conditions (basic implementation)
    if (permission.conditions && conditions) {
      return Object.entries(permission.conditions).every(([key, value]) => {
        return conditions[key] === value;
      });
    }

    return true;
  });
}

/**
 * Obtener todos los permisos de un rol
 */
export function getRolePermissions(role: string): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions ? rolePermissions.permissions : [];
}

/**
 * Verificar permisos múltiples
 */
export function hasAnyPermission(
  userRole: string,
  checks: Array<{ module: Module; action: Action; scope?: Scope }>
): boolean {
  return checks.some((check) =>
    hasPermission(userRole, check.module, check.action, check.scope)
  );
}

/**
 * Verificar que el usuario tenga TODOS los permisos
 */
export function hasAllPermissions(
  userRole: string,
  checks: Array<{ module: Module; action: Action; scope?: Scope }>
): boolean {
  return checks.every((check) =>
    hasPermission(userRole, check.module, check.action, check.scope)
  );
}
