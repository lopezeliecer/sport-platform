import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, PermissionChecker } from '../../permissions/permissions';
import { JwtAuthGuard } from './jwt-auth.guard';

export interface RequiredPermission {
  permission: Permission;
  resourceOwnerIdField?: string; // Field name to extract resource owner ID from request
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check JWT authentication
    const isAuthenticated = await this.jwtAuthGuard.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<RequiredPermission[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const clubId = request.headers['x-club-id'] || user.currentClubId;

    if (!clubId) {
      throw new ForbiddenException('Club context is required');
    }

    // Check each required permission
    for (const reqPerm of requiredPermissions) {
      let resourceOwnerId: string | undefined;

      // Extract resource owner ID if specified
      if (reqPerm.resourceOwnerIdField) {
        resourceOwnerId = this.extractResourceOwnerId(request, reqPerm.resourceOwnerIdField);
      }

      const hasPermission = PermissionChecker.hasPermission(
        user.roles,
        reqPerm.permission,
        clubId,
        resourceOwnerId,
        user.userId,
      );

      if (!hasPermission) {
        throw new ForbiddenException(`Access denied. Missing permission: ${reqPerm.permission}`);
      }
    }

    // Set the club context for this request
    request.clubId = clubId;

    return true;
  }

  private extractResourceOwnerId(request: any, fieldName: string): string | undefined {
    // Try to get from URL params first
    if (request.params?.[fieldName]) {
      return request.params[fieldName];
    }

    // Try to get from request body
    if (request.body?.[fieldName]) {
      return request.body[fieldName];
    }

    // Try to get from query params
    if (request.query?.[fieldName]) {
      return request.query[fieldName];
    }

    return undefined;
  }
}
