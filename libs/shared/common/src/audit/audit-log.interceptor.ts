import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { AuditLogService } from "./audit-log.service";
import {
  AuditEventType,
  AuditSeverity,
  AuditStatus,
  AuditContext,
} from "./audit-log.interface";

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Extract audit context from request
    const auditContext = this.extractAuditContext(request);

    // Skip logging for certain paths to avoid noise
    if (this.shouldSkipLogging(request.path)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (data) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log successful request
        await this.logSuccessfulRequest(
          request,
          response,
          auditContext,
          duration,
          data
        );
      }),
      catchError(async (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log failed request
        await this.logFailedRequest(
          request,
          response,
          auditContext,
          duration,
          error
        );

        // Re-throw the error
        throw error;
      })
    );
  }

  private extractAuditContext(request: Request): AuditContext {
    // Extract user information from JWT payload if available
    const user = (request as any).user;
    const apiKey = (request as any).apiKey;

    return {
      userId: user?.sub || user?.id,
      userEmail: user?.email,
      sessionId: user?.sessionId,
      clubId: user?.clubId || (request.headers["x-club-id"] as string),
      userRole: user?.role,
      requestId:
        (request.headers["x-request-id"] as string) || this.generateRequestId(),
      ipAddress: this.getClientIpAddress(request),
      userAgent: request.headers["user-agent"],
      endpoint: request.path,
      method: request.method,
      service: apiKey?.service || "web-client",
      apiKeyId: apiKey?.id,
    };
  }

  private async logSuccessfulRequest(
    request: Request,
    response: Response,
    context: AuditContext,
    duration: number,
    responseData: any
  ): Promise<void> {
    const eventType = this.determineEventType(
      request.method,
      request.path,
      true
    );
    const severity = this.determineSeverity(
      request.method,
      response.statusCode
    );

    // Log data access events for specific endpoints
    if (this.isDataAccessEndpoint(request.path)) {
      const operation = this.getDataOperation(request.method);
      const resourceInfo = this.extractResourceInfo(request.path, responseData);

      await this.auditLogService.logDataAccess(
        operation,
        resourceInfo.type,
        resourceInfo.id,
        context
      );
    }

    // Log general request
    await this.auditLogService.logEvent({
      eventType,
      severity,
      status: AuditStatus.SUCCESS,
      message: `${request.method} ${request.path} completed successfully`,
      description: `Request completed in ${duration}ms with status ${response.statusCode}`,
      context: {
        ...context,
        responseTime: duration,
        statusCode: response.statusCode,
        requestBody: this.sanitizeRequestBody(request.body),
        queryParams: request.query,
      },
      resourceType: "http_request",
      resourceId: context.requestId,
    });
  }

  private async logFailedRequest(
    request: Request,
    response: Response,
    context: AuditContext,
    duration: number,
    error: any
  ): Promise<void> {
    const eventType = this.determineEventType(
      request.method,
      request.path,
      false
    );
    const severity = this.determineErrorSeverity(error);
    const statusCode = error.status || error.statusCode || 500;

    await this.auditLogService.logEvent({
      eventType,
      severity,
      status: AuditStatus.ERROR,
      message: `${request.method} ${request.path} failed`,
      description: `Request failed after ${duration}ms with status ${statusCode}`,
      context: {
        ...context,
        responseTime: duration,
        statusCode,
        requestBody: this.sanitizeRequestBody(request.body),
        queryParams: request.query,
      },
      resourceType: "http_request",
      resourceId: context.requestId,
      errorCode: error.code || "UNKNOWN_ERROR",
      errorMessage: error.message,
      stackTrace: error.stack,
    });

    // Log specific security events
    if (statusCode === 401) {
      await this.auditLogService.logAccessDenied(
        context.userId || "anonymous",
        `${request.method} ${request.path}`,
        context
      );
    } else if (statusCode === 429) {
      await this.auditLogService.logRateLimitExceeded(context);
    }
  }

  private shouldSkipLogging(path: string): boolean {
    const skipPaths = [
      "/health",
      "/metrics",
      "/favicon.ico",
      "/api/docs",
      "/api-docs",
    ];

    return skipPaths.some((skipPath) => path.includes(skipPath));
  }

  private determineEventType(
    method: string,
    path: string,
    success: boolean
  ): AuditEventType {
    // Authentication endpoints
    if (path.includes("/auth/google") && success)
      return AuditEventType.LOGIN_SUCCESS;
    if (path.includes("/auth/google") && !success)
      return AuditEventType.LOGIN_FAILED;
    if (path.includes("/auth/logout")) return AuditEventType.LOGOUT;
    if (path.includes("/auth/refresh")) return AuditEventType.TOKEN_REFRESH;

    // API key endpoints
    if (path.includes("/api-keys") && method === "POST")
      return AuditEventType.API_KEY_CREATED;
    if (path.includes("/api-keys") && method === "GET")
      return AuditEventType.DATA_READ;
    if (path.includes("/api-keys/rotate"))
      return AuditEventType.API_KEY_ROTATED;

    // Data operations
    switch (method) {
      case "GET":
        return AuditEventType.DATA_READ;
      case "POST":
        return AuditEventType.DATA_CREATED;
      case "PUT":
      case "PATCH":
        return AuditEventType.DATA_UPDATED;
      case "DELETE":
        return AuditEventType.DATA_DELETED;
      default:
        return AuditEventType.DATA_READ;
    }
  }

  private determineSeverity(method: string, statusCode: number): AuditSeverity {
    if (statusCode >= 500) return AuditSeverity.HIGH;
    if (statusCode >= 400) return AuditSeverity.MEDIUM;
    if (method === "DELETE") return AuditSeverity.MEDIUM;
    return AuditSeverity.LOW;
  }

  private determineErrorSeverity(error: any): AuditSeverity {
    const statusCode = error.status || error.statusCode || 500;

    if (statusCode >= 500) return AuditSeverity.HIGH;
    if (statusCode === 401 || statusCode === 403) return AuditSeverity.MEDIUM;
    if (statusCode === 429) return AuditSeverity.HIGH; // Rate limiting is serious
    return AuditSeverity.MEDIUM;
  }

  private isDataAccessEndpoint(path: string): boolean {
    const dataEndpoints = [
      "/users",
      "/athletes",
      "/clubs",
      "/trainings",
      "/performances",
    ];

    return dataEndpoints.some((endpoint) => path.includes(endpoint));
  }

  private getDataOperation(
    method: string
  ): "read" | "create" | "update" | "delete" {
    switch (method) {
      case "GET":
        return "read";
      case "POST":
        return "create";
      case "PUT":
      case "PATCH":
        return "update";
      case "DELETE":
        return "delete";
      default:
        return "read";
    }
  }

  private extractResourceInfo(
    path: string,
    responseData: any
  ): { type: string; id: string } {
    // Extract resource type and ID from path
    const pathParts = path
      .split("/")
      .filter((part) => part && part !== "api" && part !== "v1");

    const resourceType = pathParts[0] || "unknown";
    const resourceId = pathParts[1] || responseData?.id || "unknown";

    return { type: resourceType, id: resourceId };
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return undefined;

    // Remove sensitive fields from request body
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "credential",
      "accessToken",
      "refreshToken",
    ];

    const sanitized = { ...body };
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    });

    return sanitized;
  }

  private getClientIpAddress(request: Request): string {
    // Try to get real IP from various headers
    const xForwardedFor = request.headers["x-forwarded-for"] as string;
    const xRealIp = request.headers["x-real-ip"] as string;
    const cfConnectingIp = request.headers["cf-connecting-ip"] as string;

    if (xForwardedFor) {
      return xForwardedFor.split(",")[0].trim();
    }

    if (xRealIp) {
      return xRealIp;
    }

    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    return request.ip || request.connection?.remoteAddress || "unknown";
  }

  private generateRequestId(): string {
    return randomUUID();
  }
}
