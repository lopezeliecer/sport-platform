import { Module } from "@nestjs/common";
import { AthletesService } from "./athletes.service";
import { AthletesController } from "./athletes.controller";
import { DatabaseModule } from "@sports-platform/shared/database";

@Module({
  imports: [DatabaseModule],
  controllers: [AthletesController],
  providers: [AthletesService],
  exports: [AthletesService],
})
export class AthletesModule {}
