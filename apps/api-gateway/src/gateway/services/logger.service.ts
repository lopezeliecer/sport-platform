import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

/**
 * Logger Service - Handles centralized logging for the API Gateway
 * Includes correlation IDs for request tracing across services
 */
@Injectable()
export class LoggerService {
  private readonly logger = new Logger('Gateway');
  private readonly requestLogs = new Map<string, any>();

  /**
   * Generate a unique correlation ID for request tracking
   */
  generateCorrelationId(): string {
    return randomUUID();
  }

  /**
   * Log incoming request
   */
  logIncomingRequest(correlationId: string, method: string, path: string, query?: any): void {
    const log = {
      correlationId,
      timestamp: new Date().toISOString(),
      type: 'INCOMING_REQUEST',
      method,
      path,
      query: query || {},
    };
    this.requestLogs.set(correlationId, log);
    this.logger.debug(`[${correlationId}] ${method} ${path}`);
  }

  /**
   * Log outgoing proxy request to microservice
   */
  logProxyRequest(correlationId: string, targetService: string, method: string, url: string): void {
    this.logger.debug(`[${correlationId}] Proxying to ${targetService}: ${method} ${url}`);
  }

  /**
   * Log successful response from microservice
   */
  logProxyResponse(
    correlationId: string,
    targetService: string,
    statusCode: number,
    responseTime: number,
  ): void {
    this.logger.debug(
      `[${correlationId}] ${targetService} responded with ${statusCode} (${responseTime}ms)`,
    );
  }

  /**
   * Log error response
   */
  logError(correlationId: string, error: any, context: string): void {
    this.logger.error(
      `[${correlationId}] Error in ${context}: ${error.message || JSON.stringify(error)}`,
      error.stack,
    );
  }

  /**
   * Log gateway response
   */
  logGatewayResponse(correlationId: string, statusCode: number, responseTime: number): void {
    this.logger.debug(
      `[${correlationId}] Gateway responded with ${statusCode} (${responseTime}ms)`,
    );
  }

  /**
   * Get request log
   */
  getRequestLog(correlationId: string): any {
    return this.requestLogs.get(correlationId);
  }

  /**
   * Clean up old request logs (older than 1 hour)
   */
  cleanupOldLogs(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, log] of this.requestLogs.entries()) {
      const logTime = new Date(log.timestamp).getTime();
      if (logTime < oneHourAgo) {
        this.requestLogs.delete(id);
      }
    }
  }

  /**
   * Generic logger methods
   */
  debug(message: string, context?: string): void {
    this.logger.debug(message, context);
  }

  info(message: string, context?: string): void {
    this.logger.log(message, context);
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }
}
