import { z } from 'zod';
import { WorkMode } from '../../../contracts/enums';

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]];

export const jobQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  search: z.string().trim().optional(),
  company: z.string().trim().optional(),
  location: z.string().trim().optional(),
  workMode: z.enum(enumValues(WorkMode)).optional(),
});

export type JobQueryDto = z.infer<typeof jobQuerySchema>;
