import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** Marker a service/controller can return to control the envelope's `meta`. */
export function isPaginated<T>(value: unknown): value is Paginated<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'meta' in value &&
    Array.isArray((value as Paginated<T>).items)
  );
}

/**
 * Wraps every successful response in `{ data, meta? }` per API.md.
 * Paginated payloads ({ items, meta }) are unwrapped so `data` is the array
 * and `meta` carries pagination.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    return next.handle().pipe(
      map((payload) => {
        if (isPaginated(payload)) {
          return { data: payload.items, meta: payload.meta };
        }
        return { data: payload ?? null };
      }),
    );
  }
}
