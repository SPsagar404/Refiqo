import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

interface ErrorEnvelope {
  statusCode: number;
  error: string;
  message: string;
  code: string;
  details?: unknown;
}

/**
 * Translates every thrown error into the canonical error envelope
 * `{ statusCode, error, message, code, details? }` defined in API.md.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const envelope = this.toEnvelope(exception);

    if (envelope.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${envelope.statusCode} ${envelope.code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(envelope.statusCode).json(envelope);
  }

  private toEnvelope(exception: unknown): ErrorEnvelope {
    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: exception.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : (((res as Record<string, unknown>).message as string) ?? exception.message);
      return {
        statusCode: status,
        error: HttpStatus[status] ?? 'Error',
        message: Array.isArray(message) ? message.join(', ') : message,
        code: ((res as Record<string, unknown>)?.code as string) ?? this.codeForStatus(status),
        details: (res as Record<string, unknown>)?.details,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Something went wrong',
      code: 'INTERNAL_ERROR',
    };
  }

  private fromPrisma(e: Prisma.PrismaClientKnownRequestError): ErrorEnvelope {
    switch (e.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: `A record with this ${(e.meta?.target as string[])?.join(', ') ?? 'value'} already exists`,
          code: 'DUPLICATE_RESOURCE',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Resource not found',
          code: 'NOT_FOUND',
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Related resource does not exist',
          code: 'FK_CONSTRAINT',
        };
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: 'Database request failed',
          code: 'DB_ERROR',
        };
    }
  }

  private codeForStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMITED',
    };
    return map[status] ?? 'ERROR';
  }
}
