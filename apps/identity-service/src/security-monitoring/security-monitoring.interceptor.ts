import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { SecurityMonitoringService } from './security-monitoring.service';
import { SecurityEventType, SecuritySeverity } from './interfaces/security-event.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class SecurityMonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityMonitoringInterceptor.name);

  constructor(private readonly securityMonitoringService: SecurityMonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const requestId = randomUUID();
    const sourceIp = this.extractIpAddress(request);
    const userAgent = request.headers['user-agent'];
    const endpoint = request.url;
    const method = request.method;

    // Extract user context if available
    const user = (request as any).user;
    const userId = user?.sub || user?.id;
    const clubId = user?.clubId;

    return next.handle().pipe(
      tap(async (data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Record successful requests with potential security relevance
        await this.recordSecurityEvent({
          type: this.getEventTypeForSuccessfulRequest(endpoint, method),
          severity: SecuritySeverity.LOW,
          sourceIp,
          userAgent,
          userId,
          clubId,
          details: {
            requestId,
            success: true,
          },
          metadata: {
            requestId,
            endpoint,
            method,
            statusCode,
            responseTime,
          },
        });
      }),
      catchError(async (error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Record security-relevant errors
        const eventType = this.getEventTypeForError(error, endpoint, method);
        const severity = this.getSeverityForError(error, statusCode);

        if (eventType) {
          await this.recordSecurityEvent({
            type: eventType,
            severity,
            sourceIp,
            userAgent,
            userId,
            clubId,
            details: {
              requestId,
              error: error.message,
              errorCode: error.code,
              stack: error.stack?.substring(0, 500), // Truncate stack trace
            },
            metadata: {
              requestId,
              endpoint,
              method,
              statusCode,
              responseTime,
            },
          });
        }

        return throwError(() => error);
      }),
    );
  }

  /**
   * Extract IP address from request, considering proxies
   */
  private extractIpAddress(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    return (
      (request.headers['x-real-ip'] as string) || request.connection.remoteAddress || 'unknown'
    );
  }

  /**
   * Determine security event type for successful requests
   */
  private getEventTypeForSuccessfulRequest(
    endpoint: string,
    method: string,
  ): SecurityEventType | null {
    // Only record security-relevant successful operations
    if (endpoint.includes('/auth/login') && method === 'POST') {
      return SecurityEventType.FAILED_LOGIN; // This will be overridden to success in a separate event
    }

    if (endpoint.includes('/auth/logout') && method === 'POST') {
      return null; // Logout is not typically a security concern when successful
    }

    if (endpoint.includes('/security-monitoring') || endpoint.includes('/audit')) {
      return SecurityEventType.UNAUTHORIZED_ACCESS; // Administrative access
    }

    // For most other endpoints, we don't need to record successful access
    return null;
  }

  /**
   * Determine security event type based on error
   */
  private getEventTypeForError(
    error: any,
    endpoint: string,
    method: string,
  ): SecurityEventType | null {
    const statusCode = error.status || 500;

    // Authentication failures
    if (statusCode === 401) {
      if (endpoint.includes('/auth/login')) {
        return SecurityEventType.FAILED_LOGIN;
      }
      return SecurityEventType.INVALID_TOKEN;
    }

    // Authorization failures
    if (statusCode === 403) {
      return SecurityEventType.UNAUTHORIZED_ACCESS;
    }

    // Rate limiting
    if (statusCode === 429) {
      return SecurityEventType.RATE_LIMIT_EXCEEDED;
    }

    // Input validation errors (potential injection attempts)
    if (statusCode === 400 && error.message) {
      const message = error.message.toLowerCase();
      if (message.includes('script') || message.includes('select') || message.includes('union')) {
        return SecurityEventType.SQL_INJECTION_ATTEMPT;
      }
      if (message.includes('<') || message.includes('javascript:')) {
        return SecurityEventType.XSS_ATTEMPT;
      }
      return SecurityEventType.INVALID_INPUT;
    }

    // Server errors might indicate attacks
    if (statusCode >= 500) {
      return SecurityEventType.SUSPICIOUS_IP;
    }

    return null;
  }

  /**
   * Determine severity based on error
   */
  private getSeverityForError(error: any, statusCode: number): SecuritySeverity {
    if (statusCode === 401 || statusCode === 403) {
      return SecuritySeverity.MEDIUM;
    }

    if (statusCode === 429) {
      return SecuritySeverity.HIGH;
    }

    if (statusCode >= 500) {
      return SecuritySeverity.HIGH;
    }

    return SecuritySeverity.LOW;
  }

  /**
   * Record security event if monitoring service is available
   */
  private async recordSecurityEvent(eventData: any): Promise<void> {
    try {
      if (eventData.type) {
        await this.securityMonitoringService.recordSecurityEvent(eventData);
      }
    } catch (error) {
      // Don't let security monitoring failures break the request
      this.logger.error(`Failed to record security event: ${error.message}`, error.stack);
    }
  }
}
