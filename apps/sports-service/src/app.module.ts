import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../../../libs/shared/database/database.module";
import { AthletesModule } from "./athletes/athletes.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    AthletesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
