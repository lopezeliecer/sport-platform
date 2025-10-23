import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Module, Action, Scope, UserRole } from '../types/auth.types';

export const PERMISSION_KEY = 'permissions';
export const ROLES_KEY = 'roles';
export const CLUB_CONTEXT_KEY = 'club_context';
export const PUBLIC_KEY = 'public';

/**
 * Decorator para endpoints públicos (sin autenticación requerida)
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/**
 * Decorator para requerir permisos específicos
 */
export const RequirePermission = (module: Module, action: Action, scope: Scope = 'club') =>
  SetMetadata(PERMISSION_KEY, { module, action, scope });

/**
 * Decorator para requerir roles específicos
 */
export const RequireRoles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator para endpoints que requieren contexto de club
 */
export const RequireClubContext = () => SetMetadata(CLUB_CONTEXT_KEY, true);

/**
 * Decorators específicos por tipo de usuario
 */
export const RequireClubAdmin = () => RequireRoles('CLUB_ADMIN');
export const RequireCoach = () => RequireRoles('COACH', 'CLUB_ADMIN');
export const RequireMedicalStaff = () => RequireRoles('MEDICAL_STAFF', 'CLUB_ADMIN');
export const RequireClubDirector = () => RequireRoles('CLUB_DIRECTOR', 'CLUB_ADMIN');

/**
 * Decorators para permisos específicos de módulos
 */
export const CanManageAthletes = () => RequirePermission('athletes', 'manage');
export const CanReadAthletes = () => RequirePermission('athletes', 'read');
export const CanUpdateAthletes = () => RequirePermission('athletes', 'update');
export const CanManageTraining = () => RequirePermission('training', 'manage');
export const CanAssignTraining = () => RequirePermission('training', 'assign');
export const CanViewPerformance = () => RequirePermission('performance', 'read');
export const CanManagePerformance = () => RequirePermission('performance', 'manage');
export const CanViewAnalytics = () => RequirePermission('performance', 'view_analytics');
export const CanViewMedical = () => RequirePermission('medical', 'view_medical');
export const CanManageMedical = () => RequirePermission('medical', 'manage');
export const CanSendNotifications = () => RequirePermission('communications', 'send_notifications');
export const CanManageCommunications = () => RequirePermission('communications', 'manage');
export const CanViewPayments = () => RequirePermission('payments', 'read');
export const CanManagePayments = () => RequirePermission('payments', 'manage');
export const CanViewReports = () => RequirePermission('reports', 'read');
export const CanExportReports = () => RequirePermission('reports', 'export');

/**
 * Decorators combinados para casos comunes
 */
export const RequireCoachOrAdmin = () => RequireRoles('COACH', 'CLUB_ADMIN');
export const RequireMedicalOrAdmin = () => RequireRoles('MEDICAL_STAFF', 'CLUB_ADMIN');
export const RequireStaffAccess = () =>
  RequireRoles('COACH', 'MEDICAL_STAFF', 'CLUB_ADMIN', 'CLUB_DIRECTOR');

/**
 * Parameter decorators para obtener información del usuario autenticado
 */
export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

export const CurrentUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.sub;
});

export const CurrentClubId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.clubId;
});

export const UserContext = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.userContext;
});

export const ClubContext = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.clubContext;
});
