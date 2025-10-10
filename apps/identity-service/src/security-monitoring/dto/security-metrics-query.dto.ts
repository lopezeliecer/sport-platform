import { IsOptional, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class SecurityMetricsQueryDto {
  @ApiPropertyOptional({
    description: "Start date for metrics query (ISO string)",
    example: "2024-01-01T00:00:00.000Z",
  })
  @IsOptional()
  @IsDateString({}, { message: "Start date must be a valid ISO date string" })
  startDate?: string;

  @ApiPropertyOptional({
    description: "End date for metrics query (ISO string)",
    example: "2024-01-31T23:59:59.999Z",
  })
  @IsOptional()
  @IsDateString({}, { message: "End date must be a valid ISO date string" })
  endDate?: string;
}
