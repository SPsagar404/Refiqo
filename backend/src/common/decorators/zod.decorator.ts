import { Body, Param, Query } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/** `@ZodBody(schema)` — validate & type the request body. */
export const ZodBody = (schema: ZodSchema) => Body(new ZodValidationPipe(schema));

/** `@ZodQuery(schema)` — validate & coerce the query string. */
export const ZodQuery = (schema: ZodSchema) => Query(new ZodValidationPipe(schema));

/** `@ZodParam(schema)` — validate route params. */
export const ZodParam = (schema: ZodSchema) => Param(new ZodValidationPipe(schema));
