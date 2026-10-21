import { LoggerService } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type RequestHandler = (
  request: Request,
  response: Response,
  next: NextFunction,
) => void;

export function createRequestLogger(
  logger: Pick<LoggerService, 'log'>,
): RequestHandler {
  return (request, response, next) => {
    const startedAt = Date.now();
    response.once('finish', () => {
      logger.log(
        `${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms`,
      );
    });
    next();
  };
}
