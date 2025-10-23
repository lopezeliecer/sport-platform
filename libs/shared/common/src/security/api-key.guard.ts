import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ApiKey } from './api-key.service';

// Metadata keys for decorators
export const API_KEY_PERMISSIONS = 'api_key_permissions';
export const REQUIRE_API_KEY = 'require_api_key';
export const ALLOWED_SERVICES = 'allowed_services';

// Decorators for API key authorization
export const RequireApiKey = () => SetMetadata(REQUIRE_API_KEY, true);
export const ApiKeyPermissions = (...permissions: string[]) =>
  SetMetadata(API_KEY_PERMISSIONS, permissions);
export const AllowedServices = (...services: string[]) => SetMetadata(ALLOWED_SERVICES, services);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if API key is required for this endpoint
    const requireApiKey = this.reflector.getAllAndOverride<boolean>(REQUIRE_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no API key requirement, allow access
    if (!requireApiKey) {
      return true;
    }

    // Check if API key was validated by middleware
    const apiKey: ApiKey | undefined = request.apiKey;
    if (!apiKey) {
      throw new UnauthorizedException('API key required for this endpoint');
    }

    // Check service restrictions
    const allowedServices = this.reflector.getAllAndOverride<string[]>(ALLOWED_SERVICES, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (allowedServices && !allowedServices.includes(apiKey.service)) {
      throw new UnauthorizedException(`Service '${apiKey.service}' not allowed for this endpoint`);
    }

    // Check permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(API_KEY_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredPermissions) {
      const hasPermission = requiredPermissions.some(
        (permission) => apiKey.permissions.includes('*') || apiKey.permissions.includes(permission),
      );

      if (!hasPermission) {
        throw new UnauthorizedException(
          `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
        );
      }
    }

    return true;
  }
}
