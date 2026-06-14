import { z } from 'zod';

export const notificationQuerySchema = z.object({
  filter: z.enum(['all', 'unread', 'mentions']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type NotificationQueryDto = z.infer<typeof notificationQuerySchema>;

export const notificationPrefsSchema = z
  .object({
    referralUpdates: z.boolean().optional(),
    newMessages: z.boolean().optional(),
    reminders: z.boolean().optional(),
    milestones: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })
  .strict();
export type NotificationPrefsDto = z.infer<typeof notificationPrefsSchema>;
