import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  private logger = new LoggerService('ValidationPipe');

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Transform types automatically
      validateCustomDecorators: true,
    });

    if (errors.length > 0) {
      const formattedErrors = errors.map((error) => ({
        property: error.property,
        value: error.value,
        constraints: error.constraints,
        children: error.children?.length > 0 ? this.formatChildErrors(error.children) : undefined,
      }));

      this.logger.warn({
        message: 'Validation failed',
        errors: formattedErrors,
        originalValue: this.sanitizeValue(value),
      });

      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
        statusCode: 400,
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatChildErrors(children: any[]): any[] {
    return children.map((child) => ({
      property: child.property,
      value: child.value,
      constraints: child.constraints,
      children: child.children?.length > 0 ? this.formatChildErrors(child.children) : undefined,
    }));
  }

  private sanitizeValue(value: any): any {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = Array.isArray(value) ? [...value] : { ...value };

    if (Array.isArray(sanitized)) {
      return sanitized.map((item) => this.sanitizeValue(item));
    }

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
