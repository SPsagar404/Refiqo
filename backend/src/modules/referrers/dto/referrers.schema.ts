import { z } from 'zod';
import { AvailabilityStatus } from '../../../contracts/enums';

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]];

const csv = z
  .string()
  .optional()
  .transform((v) =>
    v
      ? v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  );

export const referrerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().trim().optional(),
  company: z.string().trim().optional(),
  location: z.string().trim().optional(),
  minExp: z.coerce.number().int().min(0).optional(),
  skills: csv,
  availability: z.enum(enumValues(AvailabilityStatus)).optional(),
});
export type ReferrerQueryDto = z.infer<typeof referrerQuerySchema>;
