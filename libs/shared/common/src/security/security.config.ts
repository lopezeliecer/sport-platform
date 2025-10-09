import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import * as helmet from "helmet";

export interface SecurityConfig {
  cors: CorsOptions;
  helmet: helmet.HelmetOptions;
  csp: any; // CSP configuration
}

export function createSecurityConfig(
  isProduction: boolean = false
): SecurityConfig {
  // Define allowed origins based on environment
  const allowedOrigins = isProduction
    ? [
        "https://sports-platform.com",
        "https://www.sports-platform.com",
        "https://app.sports-platform.com",
      ]
    : [
        "http://localhost:3000",
        "http://localhost:4200",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4200",
      ];

  const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Club-Id",
      "X-Request-ID",
    ],
    exposedHeaders: [
      "X-Total-Count",
      "X-Page-Count",
      "X-Rate-Limit-Remaining",
      "X-Rate-Limit-Reset",
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200,
  };

  const cspConfig: any = {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Angular styles
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
      ],
      scriptSrc: [
        "'self'",
        isProduction ? null : "'unsafe-eval'", // Allow eval in development for Angular
        "https://apis.google.com",
        "https://accounts.google.com",
      ].filter(Boolean) as string[],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.sports-platform.com",
        "https://accounts.google.com",
        "https://oauth2.googleapis.com",
        isProduction ? null : "http://localhost:*",
        isProduction ? null : "ws://localhost:*",
      ].filter(Boolean) as string[],
      frameSrc: ["'self'", "https://accounts.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  };

  const helmetConfig: helmet.HelmetOptions = {
    contentSecurityPolicy: cspConfig,
    crossOriginEmbedderPolicy: false, // Disable for Google OAuth compatibility
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: { action: "deny" }, // This should set X-Frame-Options: DENY
    xssFilter: true,
    referrerPolicy: { policy: "same-origin" },
    hidePoweredBy: true,
  };

  return {
    cors: corsConfig,
    helmet: helmetConfig,
    csp: cspConfig,
  };
}

// Sports platform specific security headers middleware
export interface CustomSecurityHeaders {
  "X-Club-Context"?: string;
  "X-User-Role"?: string;
  "X-Session-ID"?: string;
  "X-Request-ID": string;
  "X-API-Version": string;
}

export function addCustomSecurityHeaders(headers: CustomSecurityHeaders) {
  return (req: any, res: any, next: any) => {
    // Add custom headers
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        res.setHeader(key, value);
      }
    });

    // Add standard security headers (only if not already set by Helmet)
    if (!res.getHeader("X-Content-Type-Options")) {
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
    // Don't override Helmet's X-Frame-Options
    if (!res.getHeader("X-XSS-Protection")) {
      res.setHeader("X-XSS-Protection", "1; mode=block");
    }
    if (!res.getHeader("Strict-Transport-Security")) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }
    if (!res.getHeader("Referrer-Policy")) {
      res.setHeader("Referrer-Policy", "same-origin");
    }

    // Remove server information
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");

    next();
  };
}
