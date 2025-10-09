import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { ApiKeyService, ApiKey } from "./api-key.service";

// Extend Express Request interface to include API key data
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKey;
      service?: string;
    }
  }
}

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ApiKeyMiddleware.name);

  constructor(private readonly apiKeyService: ApiKeyService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    try {
      // Extract API key from different sources
      const apiKey = this.extractApiKey(req);

      if (!apiKey) {
        // Allow requests without API key (they might use JWT auth instead)
        return next();
      }

      // Validate API key
      const validatedKey = await this.apiKeyService.validateApiKey(apiKey);

      if (!validatedKey) {
        this.logger.warn(`Invalid API key attempted from IP: ${req.ip}`);
        throw new UnauthorizedException("Invalid or expired API key");
      }

      // Attach API key data to request
      req.apiKey = validatedKey;
      req.service = validatedKey.service;

      // Add service identification header to response
      res.setHeader("X-Authenticated-Service", validatedKey.service);

      this.logger.debug(
        `API key authenticated for service: ${validatedKey.service}`
      );

      // Continue to next middleware
      next();

      // Record usage after response is sent
      const responseTime = Date.now() - startTime;
      this.apiKeyService.recordUsage(
        validatedKey,
        req.path,
        req.method,
        req.ip,
        res.statusCode,
        responseTime,
        req.get("User-Agent")
      );
    } catch (error) {
      this.logger.error(`API key middleware error: ${error.message}`);

      if (error instanceof UnauthorizedException) {
        return res.status(401).json({
          statusCode: 401,
          message: "Unauthorized: Invalid API key",
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(500).json({
        statusCode: 500,
        message: "Internal server error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Extract API key from request headers, query params, or body
   */
  private extractApiKey(req: Request): string | null {
    // 1. Authorization header: "Bearer sk_xxxx_xxxx"
    const authHeader = req.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token.startsWith("sk_")) {
        return token;
      }
    }

    // 2. X-API-Key header
    const apiKeyHeader = req.get("X-API-Key");
    if (apiKeyHeader && apiKeyHeader.startsWith("sk_")) {
      return apiKeyHeader;
    }

    // 3. Query parameter (less secure, avoid in production)
    const apiKeyQuery = req.query.api_key;
    if (typeof apiKeyQuery === "string" && apiKeyQuery.startsWith("sk_")) {
      return apiKeyQuery;
    }

    return null;
  }
}
