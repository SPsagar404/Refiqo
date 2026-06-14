import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/** Lightweight per-request timing log (complements nestjs-pino's http logs). */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const startedNs = process.hrtime.bigint();

    return next.handle().pipe(
      tap(() => {
        const ms = Number(process.hrtime.bigint() - startedNs) / 1e6;
        this.logger.debug(`${method} ${url} +${ms.toFixed(1)}ms`);
      }),
    );
  }
}
