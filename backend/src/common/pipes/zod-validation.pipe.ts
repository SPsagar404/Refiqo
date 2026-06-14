import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Validates and transforms an argument against a Zod schema.
 * Use via the `@ZodBody(schema)` / `@ZodQuery(schema)` param decorators, or
 * bind directly: `@Body(new ZodValidationPipe(createUserSchema))`.
 * Thrown ZodErrors are normalised by AllExceptionsFilter.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    return this.schema.parse(value);
  }
}
