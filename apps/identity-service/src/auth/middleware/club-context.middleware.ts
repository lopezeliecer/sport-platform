import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "../strategies/jwt.strategy";

declare global {
  namespace Express {
    interface Request {
      jwtUser?: JwtPayload;
      clubId?: string;
      clubContext?: {
        clubId: string;
        userRoles: string[];
        permissions: string[];
      };
    }
  }
}

@Injectable()
export class ClubContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ClubContextMiddleware.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extraer token del header Authorization
      const token = this.extractTokenFromHeader(req);

      if (token) {
        try {
          // Verificar y decodificar JWT
          const payload = this.jwtService.verify<JwtPayload>(token, {
            secret: this.configService.get<string>("JWT_SECRET"),
          });

          // Agregar información del usuario al request
          req.jwtUser = payload;
          req.clubId = payload.clubId;

          // Configurar contexto de club
          if (payload.clubId) {
            const clubRoles = payload.roles
              .filter((role) => role.clubId === payload.clubId)
              .map((role) => role.role);

            const clubPermissions = payload.roles
              .filter((role) => role.clubId === payload.clubId)
              .flatMap((role) => role.permissions);

            req.clubContext = {
              clubId: payload.clubId,
              userRoles: clubRoles,
              permissions: clubPermissions,
            };

            this.logger.debug(
              `Contexto de club establecido: ${payload.clubId} para usuario ${payload.sub}`
            );
          }
        } catch (error) {
          // Token inválido - continuar sin contexto
          this.logger.debug(`Token inválido: ${error.message}`);
        }
      }

      next();
    } catch (error) {
      this.logger.error(`Error en ClubContextMiddleware: ${error.message}`);
      next();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}

/**
 * Decorator para obtener el contexto de club desde el request
 */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ClubContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.clubContext;
  }
);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.jwtUser;
  }
);

export const CurrentClubId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.clubId;
  }
);
