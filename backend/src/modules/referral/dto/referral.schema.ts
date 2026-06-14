import { z } from 'zod';
import { urlSchema } from '../../../contracts/common.schema';
import { ReferralStatus } from '../../../contracts/enums';

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]];

export const createReferralSchema = z.object({
  referrerId: z.string().uuid(),
  jobRole: z.string().trim().min(1).max(120),
  jobLink: urlSchema.optional().or(z.literal('')),
  jobId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(500),
  note: z.string().trim().max(200).optional(),
  resumeId: z.string().uuid(),
});
export type CreateReferralDto = z.infer<typeof createReferralSchema>;

export const referralListQuerySchema = z.object({
  role: z.enum(['seeker', 'referrer']).default('seeker'),
  status: z.enum(enumValues(ReferralStatus)).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sort: z.string().optional(),
});
export type ReferralListQueryDto = z.infer<typeof referralListQuerySchema>;

export const updateStatusSchema = z
  .object({
    status: z.enum(enumValues(ReferralStatus)),
    rejectionReason: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.status !== 'REJECTED' || !!v.rejectionReason, {
    message: 'rejectionReason is required when rejecting',
    path: ['rejectionReason'],
  });
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
