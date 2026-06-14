import { z } from 'zod';

export const skillQuerySchema = z.object({
  search: z.string().trim().optional(),
  popular: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type SkillQueryDto = z.infer<typeof skillQuerySchema>;

export const createSkillSchema = z.object({
  name: z.string().trim().min(1).max(60),
});
export type CreateSkillDto = z.infer<typeof createSkillSchema>;
