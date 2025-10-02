import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AthletesModule } from "./athletes/athletes.module";
import { SharedAuthModule } from "../../../libs/shared/auth/src/shared-auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", ".env"],
    }),
    SharedAuthModule, // Módulo de autenticación compartido
    PrismaModule,
    AthletesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
