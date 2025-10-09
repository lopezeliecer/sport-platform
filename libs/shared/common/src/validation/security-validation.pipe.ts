import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { SanitizationService } from "./sanitization.service";

@Injectable()
export class SecurityValidationPipe implements PipeTransform<any> {
  constructor(private readonly sanitizationService: SanitizationService) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Sanitize input before validation
    const sanitizedValue = this.sanitizationService.sanitizeObject(value);

    // Transform to class instance
    const object = plainToClass(metatype, sanitizedValue);

    // Validate
    const errors = await validate(object, {
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Apply transformations
      validateCustomDecorators: true,
      stopAtFirstError: false,
    });

    if (errors.length > 0) {
      const errorMessages = errors.map((error) => {
        const constraints = error.constraints;
        return constraints
          ? Object.values(constraints).join(", ")
          : "Validation failed";
      });

      throw new BadRequestException({
        message: "Validation failed",
        errors: errorMessages,
        statusCode: 400,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
