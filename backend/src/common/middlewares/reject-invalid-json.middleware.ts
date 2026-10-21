import { BadRequestException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export const INVALID_JSON_MESSAGE =
  'O corpo da requisição não é um JSON válido.';

export function rejectInvalidJson(
  error: unknown,
  _request: Request,
  _response: Response,
  next: NextFunction,
): void {
  next(
    isJsonParseError(error)
      ? new BadRequestException(INVALID_JSON_MESSAGE)
      : error,
  );
}

function isJsonParseError(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  );
}
