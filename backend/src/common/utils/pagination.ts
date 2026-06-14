import { Paginated } from '../interceptors/transform.interceptor';

/** Builds the `{ items, meta }` shape the TransformInterceptor unwraps. */
export function paginate<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/** Prisma skip/take from page/limit. */
export function toSkipTake(page: number, limit: number): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}
