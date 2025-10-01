import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PERMISSION_KEY,
  ROLES_KEY,
  CLUB_CONTEXT_KEY,
} from '../decorators/permissions.decorator';
import {
  hasPermission,
  Module,
  Action,
  Scope,
} from '../rbac/permissions.types';
import { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Obtener metadatos del endpoint
    const requiredPermission = this.reflector.get<{
      module: Module;
      action: Action;
      scope: Scope;
    }>(PERMISSION_KEY, context.getHandler());
    
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );
    
    const requiresClubContext = this.reflector.get<boolean>(
      CLUB_CONTEXT_KEY,
      context.getHandler(),
    );

    // Si no hay restricciones, permitir acceso
    if (!requiredPermission && !requiredRoles && !requiresClubContext) {
      return true;
    }

    // Extraer token del header Authorization
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Token de acceso requerido');
    }

    try {
      // Verificar y decodificar JWT
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Validar sesión activa
      const isValidSession = await this.validateSession(payload.sessionId);
      if (!isValidSession) {
        throw new UnauthorizedException('Sesión inválida o expirada');
      }

      // Agregar información del usuario al request
      request.user = payload;
      request.clubId = payload.clubId;

      // Verificar contexto de club si es requerido
      if (requiresClubContext && !payload.clubId) {
        throw new ForbiddenException(
          'Contexto de club requerido. Selecciona un club primero.',
        );
      }

      // Verificar roles requeridos
      if (requiredRoles && requiredRoles.length > 0) {
        const userRoleNames = payload.roles.map(r => r.role);
        const hasRequiredRole = requiredRoles.some(role =>
          userRoleNames.includes(role),
        );
        
        if (!hasRequiredRole) {
          this.logger.warn(
            `Usuario ${payload.sub} intentó acceder sin roles requeridos: ${requiredRoles.join(', ')}`,
          );
          throw new ForbiddenException(
            `Acceso denegado. Roles requeridos: ${requiredRoles.join(', ')}`,
          );
        }
      }

      // Verificar permisos específicos
      if (requiredPermission) {
        const hasRequiredPermission = await this.checkPermission(
          payload,
          requiredPermission,
          request,
        );
        
        if (!hasRequiredPermission) {
          this.logger.warn(
            `Usuario ${payload.sub} intentó acceder sin permiso: ${requiredPermission.module}:${requiredPermission.action}:${requiredPermission.scope}`,
          );
          throw new ForbiddenException(
            `Acceso denegado. Permiso requerido: ${requiredPermission.module}:${requiredPermission.action}`,
          );
        }
      }

      // Log de acceso exitoso
      this.logger.log(
        `Acceso autorizado para usuario ${payload.sub} en club ${payload.clubId}`,
      );

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      
      this.logger.error(`Error de autorización: ${error.message}`);
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.prisma.userSession.findFirst({
      where: {
        id: sessionId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });

    return !!session;
  }

  private async checkPermission(
    user: JwtPayload,
    permission: { module: Module; action: Action; scope: Scope },
    request: any,
  ): Promise<boolean> {
    // Verificar permisos base por rol
    const hasBasicPermission = user.roles.some(roleObj =>
      hasPermission(roleObj.role, permission.module, permission.action, permission.scope),
    );

    if (!hasBasicPermission) {
      return false;
    }

    // Verificaciones adicionales basadas en el scope
    if (permission.scope === 'own') {
      return await this.checkOwnResourceAccess(user, request);
    }

    if (permission.scope === 'club') {
      return await this.checkClubResourceAccess(user, request);
    }

    return true;
  }

  private async checkOwnResourceAccess(
    user: JwtPayload,
    request: any,
  ): Promise<boolean> {
    // Verificar acceso a recursos propios
    const resourceUserId = request.params?.userId || request.body?.userId;
    
    if (resourceUserId && resourceUserId !== user.sub) {
      // Verificar si es padre accediendo a datos de hijo
      const userRoles = user.roles.map(r => r.role);
      if (userRoles.includes('PARENT')) {
        return await this.checkParentChildAccess(user.sub, resourceUserId);
      }
      return false;
    }

    return true;
  }

  private async checkClubResourceAccess(
    user: JwtPayload,
    request: any,
  ): Promise<boolean> {
    // Verificar acceso a recursos del club
    const resourceClubId = request.params?.clubId || request.body?.clubId;
    
    if (resourceClubId && resourceClubId !== user.clubId) {
      // Verificar si el usuario tiene roles en el club solicitado
      const userClubRole = await this.prisma.userClubRole.findFirst({
        where: {
          userId: user.sub,
          clubId: resourceClubId,
          isActive: true,
        },
      });
      
      return !!userClubRole;
    }

    return true;
  }

  private async checkParentChildAccess(
    parentId: string,
    childId: string,
  ): Promise<boolean> {
    // Verificar relación padre-hijo
    const parentChild = await this.prisma.athlete.findFirst({
      where: {
        userId: childId,
        parentId: parentId,
      },
    });

    return !!parentChild;
  }
}