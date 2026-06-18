import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ResponseMessages } from '../constants/messages.constant';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = ResponseMessages.ERROR;

    if (exception instanceof HttpException) {
      const respInfo = exception.getResponse() as any;
      message =
        typeof respInfo === 'string'
          ? respInfo
          : respInfo.message || 'System error';
    }

    if (!status) {
      message = ResponseMessages.ERROR;
    } else if (status === 400) {
      message = Array.isArray(message)
        ? message[0]
        : message || ResponseMessages.BAD_REQUEST;
    } else if (status === 401) {
      message = ResponseMessages.UNAUTHORIZED;
    } else if (status === 403) {
      message = ResponseMessages.FORBIDDEN;
    } else if (status === 404) {
      message = ResponseMessages.NOT_FOUND;
    }

    // Skip logging for noisy browser-generated 404s (e.g. favicon.ico)
    const request = ctx.getRequest();
    const isFaviconRequest = request?.url === '/favicon.ico';
    if (!isFaviconRequest) {
      console.error('AllExceptionsFilter caught an error:', exception);
    }

    const code =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.code
        : undefined;

    response.status(status || 500).json({
      statusCode: status || 500,
      message: message,
      error:
        exception instanceof HttpException
          ? exception.name
          : 'Internal Server Error',
      ...(code && { code }),
      data: null,
    });
  }
}
