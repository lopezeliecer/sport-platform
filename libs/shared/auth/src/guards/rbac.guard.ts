import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  PERMISSION_KEY,
  ROLES_KEY,
  CLUB_CONTEXT_KEY,
} from "../decorators/permissions.decorator";
import {
  JwtPayload,
  Module,
  Action,
  Scope,
  UserRole,
} from "../types/auth.types";

// Función simple de verificación de permisos
function hasPermission(
  userRole: string,
  module: Module,
  action: Action,
  scope: Scope = "club"
): boolean {
  // Implementación básica de permisos
  const ROLE_PERMISSIONS: Record<string, any> = {
    CLUB_ADMIN: { "*": ["*"] }, // Admin tiene todos los permisos
    COACH: {
      athletes: ["read", "update", "assign"],
      training: ["*"],
      performance: ["*"],
      communications: ["create", "read"],
    },
    ATHLETE: {
      training: ["read"],
      performance: ["read", "create", "update"],
      competitions: ["read"],
    },
    MEDICAL_STAFF: {
      athletes: ["read", "update"],
      medical: ["*"],
      performance: ["read", "view_analytics"],
      training: ["read"],
    },
    PARENT: {
      athletes: ["read"],
      training: ["read"],
      performance: ["read"],
      competitions: ["read"],
      payments: ["read", "manage"],
    },
    CLUB_DIRECTOR: {
      reports: ["*"],
      performance: ["read", "view_analytics", "export"],
      athletes: ["read"],
      payments: ["read", "view_analytics"],
    },
  };

  const rolePerms = ROLE_PERMISSIONS[userRole];
  if (!rolePerms) return false;

  // Verificar permisos de admin
  if (rolePerms["*"] && rolePerms["*"].includes("*")) return true;

  // Verificar permisos específicos del módulo
  const modulePerms = rolePerms[module];
  if (!modulePerms) return false;

  // Verificar si tiene todos los permisos del módulo
  if (modulePerms.includes("*")) return true;

  // Verificar acción específica
  return modulePerms.includes(action);
}

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Obtener metadatos del endpoint
    const requiredPermission = this.reflector.get<{
      module: Module;
      action: Action;
      scope: Scope;
    }>(PERMISSION_KEY, context.getHandler());

    const requiredRoles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler()
    );

    const requiresClubContext = this.reflector.get<boolean>(
      CLUB_CONTEXT_KEY,
      context.getHandler()
    );

    // Si no hay restricciones, permitir acceso
    if (!requiredPermission && !requiredRoles && !requiresClubContext) {
      return true;
    }

    // Verificar que el usuario esté autenticado
    const user: JwtPayload = request.user;
    if (!user) {
      throw new UnauthorizedException("Token de acceso requerido");
    }

    // Verificar contexto de club si es requerido
    if (requiresClubContext && !user.clubId) {
      throw new ForbiddenException(
        "Contexto de club requerido. Selecciona un club primero."
      );
    }

    // Extraer roles para el club actual
    const currentClubRoles = user.roles
      .filter((roleObj) => !user.clubId || roleObj.clubId === user.clubId)
      .map((roleObj) => roleObj.role);

    // Verificar roles requeridos
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some((role) =>
        currentClubRoles.includes(role)
      );

      if (!hasRequiredRole) {
        this.logger.warn(
          `Usuario ${user.sub} intentó acceder sin roles requeridos: ${requiredRoles.join(", ")}`
        );
        throw new ForbiddenException(
          `Acceso denegado. Roles requeridos: ${requiredRoles.join(", ")}`
        );
      }
    }

    // Verificar permisos específicos
    if (requiredPermission) {
      const hasRequiredPermission = currentClubRoles.some((role) =>
        hasPermission(
          role,
          requiredPermission.module,
          requiredPermission.action,
          requiredPermission.scope
        )
      );

      if (!hasRequiredPermission) {
        this.logger.warn(
          `Usuario ${user.sub} intentó acceder sin permiso: ${requiredPermission.module}:${requiredPermission.action}:${requiredPermission.scope}`
        );
        throw new ForbiddenException(
          `Acceso denegado. Permiso requerido: ${requiredPermission.module}:${requiredPermission.action}`
        );
      }
    }

    // Agregar información del usuario al request para uso posterior
    request.userContext = {
      userId: user.sub,
      email: user.email,
      clubId: user.clubId,
      roles: currentClubRoles,
      permissions: [], // Se puede implementar extracción detallada de permisos
      sessionId: user.sessionId,
    };

    request.clubContext = user.clubId
      ? {
          clubId: user.clubId,
          userRoles: currentClubRoles,
          permissions: [], // Se puede implementar extracción detallada de permisos
        }
      : undefined;

    this.logger.log(
      `Acceso autorizado para usuario ${user.sub} en club ${user.clubId || "sin club"}`
    );

    return true;
  }
}
