import { z } from 'zod';

export const createConversationSchema = z.object({
  participantId: z.string().uuid(),
});
export type CreateConversationDto = z.infer<typeof createConversationSchema>;

export const messageQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(50).default(30),
});
export type MessageQueryDto = z.infer<typeof messageQuerySchema>;

export const sendMessageSchema = z
  .object({
    body: z.string().trim().max(4000).optional(),
    type: z.enum(['TEXT', 'FILE', 'IMAGE']).default('TEXT'),
    attachment: z
      .object({
        fileKey: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().min(1),
        sizeBytes: z.coerce.number().int().positive(),
      })
      .optional(),
  })
  .refine((v) => (v.type === 'TEXT' ? !!v.body : !!v.attachment), {
    message: 'TEXT messages need a body; FILE/IMAGE need an attachment',
  });
export type SendMessageDto = z.infer<typeof sendMessageSchema>;

export const typingSchema = z.object({ isTyping: z.boolean() });
export type TypingDto = z.infer<typeof typingSchema>;
