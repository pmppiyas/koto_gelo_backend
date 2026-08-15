import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema } from 'zod/v3';

export class ZodValidation implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    let parsedValue = value;

    if (value && typeof value.data === 'string') {
      try {
        parsedValue = JSON.parse(value.data);
      } catch (e) {
        throw new BadRequestException('Invalid JSON format in data field');
      }
    }

    const result = this.schema.safeParse(parsedValue);

    if (!result.success) {
      const message = result.error.issues.map((e) => `${e.message}`).join(', ');
      throw new BadRequestException(message || 'Validation failed');
    }

    return result.data;
  }
}
