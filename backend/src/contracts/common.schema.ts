import { z } from 'zod';

/** Shared primitives reused across DTOs. */
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const urlSchema = z.string().trim().url();

/** Standard list query: ?page=&limit=&sort=&search= */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  search: z.string().trim().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Parses a `?sort=-createdAt,name` string into Prisma orderBy entries. */
export function parseSort(
  sort: string | undefined,
  allowed: string[],
  fallback: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' },
): Record<string, 'asc' | 'desc'>[] {
  if (!sort) return [fallback];
  const entries = sort
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const desc = token.startsWith('-');
      const field = token.replace(/^[-+]/, '');
      return { field, desc };
    })
    .filter(({ field }) => allowed.includes(field))
    .map(
      ({ field, desc }) => ({ [field]: desc ? 'desc' : 'asc' }) as Record<string, 'asc' | 'desc'>,
    );
  return entries.length ? entries : [fallback];
}
