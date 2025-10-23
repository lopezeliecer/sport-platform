// Main module
export * from './shared-auth.module';

// Types (exportar específicamente para evitar conflictos)
export type {
  JwtPayload,
  UserContext,
  ClubContext,
  UserRole,
  Module,
  Action,
  Scope,
  Permission,
  AuthenticatedRequest,
} from './types/auth.types';

// Decorators (exportar específicamente para evitar conflictos)
export {
  Public,
  RequirePermission,
  RequireRoles,
  RequireClubContext,
  RequireClubAdmin,
  RequireCoach,
  RequireMedicalStaff,
  RequireClubDirector,
  CanManageAthletes,
  CanReadAthletes,
  CanUpdateAthletes,
  CanManageTraining,
  CanAssignTraining,
  CanViewPerformance,
  CanManagePerformance,
  CanViewAnalytics,
  CanViewMedical,
  CanManageMedical,
  CanSendNotifications,
  CanManageCommunications,
  CanViewPayments,
  CanManagePayments,
  CanViewReports,
  CanExportReports,
  RequireCoachOrAdmin,
  RequireMedicalOrAdmin,
  RequireStaffAccess,
  CurrentUser,
  CurrentUserId,
  CurrentClubId,
} from './decorators/permissions.decorator';

// Guards
export * from './guards/jwt-auth.guard';
export * from './guards/rbac.guard';

// Strategies
export * from './strategies/jwt.strategy';

// Services
export * from './services/auth-validation.service';
