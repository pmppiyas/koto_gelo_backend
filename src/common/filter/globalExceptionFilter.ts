import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ZodError } from 'zod/v3';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let finalMessage = 'Internal Server Error';

    const fieldName =
      exception.meta?.driverAdapterError?.cause?.constraint?.fields;

    if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      finalMessage = exception.errors[0]?.message || 'Validation failed';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const modelName = (exception?.meta?.modelName as string) || 'Record';

      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          finalMessage = `${modelName} already exists by this ${fieldName}`;

          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          finalMessage = `The referenced ${modelName} does not exist.`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          finalMessage = `This ${modelName} was not found.`;
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          finalMessage = `Database Error: ${exception.code}`;
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        finalMessage = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const msg = (exceptionResponse as any).message;

        finalMessage = Array.isArray(msg) ? msg[0] : msg;
      }
    } else {
      finalMessage = exception.message || 'Something went wrong';
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: finalMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
