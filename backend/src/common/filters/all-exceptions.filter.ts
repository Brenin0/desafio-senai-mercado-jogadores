import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export const INTERNAL_ERROR_MESSAGE = 'Erro interno. Tente novamente.';

const INVALID_REQUEST_MESSAGE = 'Requisição inválida.';

const BAD_REQUEST: number = HttpStatus.BAD_REQUEST;
const NOT_FOUND: number = HttpStatus.NOT_FOUND;
const INTERNAL_SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;

interface ErrorResponse {
  status: number;
  message: string;
}

interface BodyParserError {
  status: number;
}

type RequestLine = Pick<Request, 'method' | 'url'>;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const error = toErrorResponse(exception, context.getRequest<Request>());

    if (error.status >= INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : String(exception),
      );
    }
    context
      .getResponse<Response>()
      .status(error.status)
      .json({ message: error.message });
  }
}

export function toErrorResponse(
  exception: unknown,
  request: RequestLine,
): ErrorResponse {
  if (exception instanceof HttpException) {
    return fromHttpException(exception, request);
  }
  if (isBodyParserError(exception)) {
    return fromBodyParserError(exception);
  }
  return internalError();
}

function fromHttpException(
  exception: HttpException,
  request: RequestLine,
): ErrorResponse {
  const status = exception.getStatus();
  if (status >= INTERNAL_SERVER_ERROR) {
    return internalError();
  }
  if (isRouteNotFound(exception, request)) {
    return {
      status,
      message: `Rota não encontrada: ${request.method} ${request.url}`,
    };
  }
  return {
    status,
    message: extractMessage(exception.getResponse()) || INVALID_REQUEST_MESSAGE,
  };
}

function isRouteNotFound(
  exception: HttpException,
  request: RequestLine,
): boolean {
  return (
    exception.getStatus() === NOT_FOUND &&
    exception.message === `Cannot ${request.method} ${request.url}`
  );
}

function extractMessage(response: string | object): string {
  if (typeof response === 'string') {
    return response;
  }
  if ('message' in response) {
    const { message } = response;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.join('; ');
    }
  }
  return '';
}

function isBodyParserError(exception: unknown): exception is BodyParserError {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    'type' in exception &&
    typeof exception.type === 'string' &&
    'status' in exception &&
    typeof exception.status === 'number'
  );
}

function fromBodyParserError(exception: BodyParserError): ErrorResponse {
  if (
    exception.status >= BAD_REQUEST &&
    exception.status < INTERNAL_SERVER_ERROR
  ) {
    return { status: exception.status, message: INVALID_REQUEST_MESSAGE };
  }
  return internalError();
}

function internalError(): ErrorResponse {
  return { status: INTERNAL_SERVER_ERROR, message: INTERNAL_ERROR_MESSAGE };
}
