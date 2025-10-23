import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Roles guard is meant to be used with @UseGuards(JwtAuthGuard, RolesGuard)
    // So JWT authentication should already be handled
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const clubId = request.headers['x-club-id'] || user.currentClubId;

    if (!clubId) {
      throw new UnauthorizedException('Club context is required');
    }

    // Check if user has any of the required roles in the current club
    const hasRole = user.roles.some(
      (userRole: any) => userRole.clubId === clubId && requiredRoles.includes(userRole.role),
    );

    if (!hasRole) {
      throw new UnauthorizedException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    // Set the club context for this request
    request.clubId = clubId;

    return true;
  }
}
