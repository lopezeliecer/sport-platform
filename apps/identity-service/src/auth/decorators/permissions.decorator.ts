import { SetMetadata } from "@nestjs/common";
import { Module, Action, Scope } from "../rbac/permissions.types";

export const PERMISSION_KEY = "permissions";
export const ROLES_KEY = "roles";
export const CLUB_CONTEXT_KEY = "club_context";

/**
 * Decorator para requerir permisos específicos
 */
export const RequirePermission = (
  module: Module,
  action: Action,
  scope: Scope = "club"
) => SetMetadata(PERMISSION_KEY, { module, action, scope });

/**
 * Decorator para requerir roles específicos
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * Decorator para endpoints que requieren contexto de club
 */
export const RequireClubContext = () => SetMetadata(CLUB_CONTEXT_KEY, true);

/**
 * Decorators específicos por tipo de usuario
 */

// Administradores de club
export const RequireClubAdmin = () => RequireRoles("CLUB_ADMIN");

// Entrenadores
export const RequireCoach = () => RequireRoles("COACH", "CLUB_ADMIN");

// Personal médico
export const RequireMedicalStaff = () =>
  RequireRoles("MEDICAL_STAFF", "CLUB_ADMIN");

// Director de club
export const RequireClubDirector = () =>
  RequireRoles("CLUB_DIRECTOR", "CLUB_ADMIN");

/**
 * Decorators para permisos específicos de módulos
 */

// Athletes management
export const CanManageAthletes = () => RequirePermission("athletes", "manage");
export const CanReadAthletes = () => RequirePermission("athletes", "read");
export const CanUpdateAthletes = () => RequirePermission("athletes", "update");

// Training management
export const CanManageTraining = () => RequirePermission("training", "manage");
export const CanAssignTraining = () => RequirePermission("training", "assign");

// Performance tracking
export const CanViewPerformance = () =>
  RequirePermission("performance", "read");
export const CanManagePerformance = () =>
  RequirePermission("performance", "manage");
export const CanViewAnalytics = () =>
  RequirePermission("performance", "view_analytics");

// Medical data
export const CanViewMedical = () =>
  RequirePermission("medical", "view_medical");
export const CanManageMedical = () => RequirePermission("medical", "manage");

// Communications
export const CanSendNotifications = () =>
  RequirePermission("communications", "send_notifications");
export const CanManageCommunications = () =>
  RequirePermission("communications", "manage");

// Payments
export const CanViewPayments = () => RequirePermission("payments", "read");
export const CanManagePayments = () => RequirePermission("payments", "manage");

// Reports
export const CanViewReports = () => RequirePermission("reports", "read");
export const CanExportReports = () => RequirePermission("reports", "export");

/**
 * Decorators combinados para casos comunes
 */
export const RequireCoachOrAdmin = () => RequireRoles("COACH", "CLUB_ADMIN");
export const RequireMedicalOrAdmin = () =>
  RequireRoles("MEDICAL_STAFF", "CLUB_ADMIN");
export const RequireStaffAccess = () =>
  RequireRoles("COACH", "MEDICAL_STAFF", "CLUB_ADMIN", "CLUB_DIRECTOR");
