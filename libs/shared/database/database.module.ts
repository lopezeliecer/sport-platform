import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from "./src/prisma.service";
import { MultiTenantService } from "./src/utils/multi-tenant.util";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, MultiTenantService],
  exports: [PrismaService, MultiTenantService],
})
export class DatabaseModule {}
