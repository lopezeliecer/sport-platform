import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    sessionId: string;
    clubId?: string;
  };
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: AuthenticatedRequest): Promise<string> {
    // Use user ID if authenticated, otherwise fall back to IP
    if (req.user && req.user.userId) {
      return `user-${req.user.userId}`;
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  protected generateKey(context: ExecutionContext, suffix: string, name: string): string {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const route = request.route?.path || request.url;

    // Add club context for multi-tenant rate limiting
    let clubContext = '';
    if (request.user?.clubId) {
      clubContext = `-club-${request.user.clubId}`;
    }

    return `${name}-${suffix}${clubContext}-${route}`;
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const route = request.route?.path || request.url;

    throw new ThrottlerException(`Rate limit exceeded for ${route}. Please try again later.`);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Only skip rate limiting for essential monitoring endpoints
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const url = request.url;

    // Only skip actual health/monitoring endpoints, not test endpoints
    const skipPatterns = ['/health', '/metrics'];

    return skipPatterns.some((pattern) => url.endsWith(pattern));
  }
}
