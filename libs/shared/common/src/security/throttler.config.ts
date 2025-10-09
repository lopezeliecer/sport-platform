import { ThrottlerModuleOptions } from "@nestjs/throttler";

// Simplified: Just use default throttling, decorators will override
export function createThrottlerOptions(): ThrottlerModuleOptions {
  return [
    {
      ttl: 60000, // 1 minute in milliseconds
      limit: 10, // 10 requests per minute by default (aggressive for testing)
    },
  ];
}
