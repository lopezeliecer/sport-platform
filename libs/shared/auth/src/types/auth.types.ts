/**
 * Tipos compartidos para autenticación entre microservicios
 */

export interface JwtPayload {
  sub: string; // user id
  email: string;
  clubId?: string;
  roles: Array<{
    clubId: string;
    role: string;
    permissions: string[];
  }>;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface UserContext {
  userId: string;
  email: string;
  clubId?: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}

export interface ClubContext {
  clubId: string;
  userRoles: string[];
  permissions: string[];
}

export type UserRole =
  | 'CLUB_ADMIN'
  | 'COACH'
  | 'ATHLETE'
  | 'MEDICAL_STAFF'
  | 'PARENT'
  | 'CLUB_DIRECTOR';

export type Module =
  | 'athletes'
  | 'training'
  | 'performance'
  | 'competitions'
  | 'payments'
  | 'communications'
  | 'medical'
  | 'club_management'
  | 'reports';

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'assign'
  | 'export'
  | 'manage'
  | 'approve'
  | 'view_analytics'
  | 'send_notifications'
  | 'view_medical'
  | 'manage_restrictions';

export type Scope = 'own' | 'club' | 'all';

export interface Permission {
  module: Module | '*';
  action: Action | '*';
  scope?: Scope;
  conditions?: Record<string, any>;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  userContext?: UserContext;
  clubContext?: ClubContext;
}
