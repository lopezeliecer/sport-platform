import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { EnhancedSessionsService } from "./enhanced-sessions.service";
import { PrismaService } from "../prisma/prisma.service";
import { AuthSessionStatus } from "@sports-platform/shared/database/prisma/generated/client";

describe("EnhancedSessionsService", () => {
  let service: EnhancedSessionsService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    userSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: "test-jwt-secret",
        JWT_EXPIRES_IN: "15m",
        REFRESH_SECRET: "test-refresh-secret",
        REFRESH_EXPIRES_IN: "7d",
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedSessionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EnhancedSessionsService>(EnhancedSessionsService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createSession", () => {
    it("should create a new session successfully", async () => {
      const userId = "test-user-id";
      const mockUser = {
        id: userId,
        email: "test@example.com",
        userClubRoles: [
          {
            clubId: "club-1",
            role: "CLUB_ADMIN",
            permissions: ["athletes:read", "athletes:create"],
          },
        ],
      };

      const mockSession = {
        id: "session-id",
        userId,
        sessionToken: "session-token",
        status: AuthSessionStatus.ACTIVE,
      };

      mockPrismaService.userSession.create.mockResolvedValue(mockSession);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue("mock-jwt-token");

      const result = await service.createSession({
        userId,
        deviceInfo: { userAgent: "test-agent" },
      });

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("session");
      expect(mockPrismaService.userSession.create).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2); // access + refresh token
    });

    it("should throw UnauthorizedException when user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createSession({
          userId: "non-existent-user",
        })
      ).rejects.toThrow("Usuario no encontrado");
    });
  });

  describe("validateSession", () => {
    it("should return session when valid", async () => {
      const mockSession = {
        id: "session-id",
        userId: "user-id",
        status: AuthSessionStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      };

      mockPrismaService.userSession.findFirst.mockResolvedValue(mockSession);

      const result = await service.validateSession("session-id");

      expect(result).toEqual(mockSession);
      expect(mockPrismaService.userSession.findFirst).toHaveBeenCalledWith({
        where: {
          id: "session-id",
          status: AuthSessionStatus.ACTIVE,
          expiresAt: { gt: expect.any(Date) },
        },
        include: {
          user: {
            include: {
              userClubRoles: {
                where: { isActive: true },
                include: { club: true },
              },
            },
          },
        },
      });
    });

    it("should return null for invalid session", async () => {
      mockPrismaService.userSession.findFirst.mockResolvedValue(null);

      const result = await service.validateSession("invalid-session-id");

      expect(result).toBeNull();
    });
  });

  describe("revokeSession", () => {
    it("should revoke session successfully", async () => {
      mockPrismaService.userSession.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeSession("session-id", "user-id");

      expect(mockPrismaService.userSession.updateMany).toHaveBeenCalledWith({
        where: {
          id: "session-id",
          userId: "user-id",
        },
        data: {
          status: AuthSessionStatus.REVOKED,
          revokedAt: expect.any(Date),
        },
      });
    });
  });

  describe("cleanupExpiredSessions", () => {
    it("should mark expired sessions", async () => {
      mockPrismaService.userSession.updateMany.mockResolvedValue({ count: 5 });

      await service.cleanupExpiredSessions();

      expect(mockPrismaService.userSession.updateMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { expiresAt: { lt: expect.any(Date) } },
            { refreshExpiresAt: { lt: expect.any(Date) } },
          ],
          status: AuthSessionStatus.ACTIVE,
        },
        data: {
          status: AuthSessionStatus.EXPIRED,
        },
      });
    });
  });
});
