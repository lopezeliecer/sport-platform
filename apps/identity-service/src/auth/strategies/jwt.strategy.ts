import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { SessionsService } from "../../sessions/sessions.service";

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  sessionId: string;
  clubId?: string;
  roles: Array<{
    clubId: string;
    role: string;
    permissions: string[];
  }>;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private configService: ConfigService,
    private sessionsService: SessionsService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: JwtPayload) {
    // Verify that the session is still active
    const session = await this.sessionsService.validateSession(
      payload.sessionId
    );

    if (!session || !session.isActive) {
      throw new UnauthorizedException("Session is no longer valid");
    }

    // Update last activity
    await this.sessionsService.updateLastActivity(payload.sessionId);

    // Extract IP and user agent for security logging
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.get("User-Agent");

    return {
      userId: payload.sub,
      email: payload.email,
      sessionId: payload.sessionId,
      currentClubId: payload.clubId,
      roles: payload.roles,
      ipAddress,
      userAgent,
    };
  }
}
