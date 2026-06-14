import { z } from 'zod';

export const uploadUrlSchema = z.object({
  kind: z.enum(['resume', 'avatar', 'attachment']),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.coerce.number().int().positive(),
});
export type UploadUrlDto = z.infer<typeof uploadUrlSchema>;

export const confirmSchema = z.object({
  fileKey: z.string().min(1),
  // resume metadata (when kind=resume)
  fileName: z.string().trim().min(1).max(255).optional(),
  mimeType: z.string().trim().min(1).optional(),
  sizeBytes: z.coerce.number().int().positive().optional(),
  isPrimary: z.boolean().optional(),
});
export type ConfirmDto = z.infer<typeof confirmSchema>;
