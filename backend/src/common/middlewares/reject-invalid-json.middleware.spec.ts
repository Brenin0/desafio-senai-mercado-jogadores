import { BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  INVALID_JSON_MESSAGE,
  rejectInvalidJson,
} from './reject-invalid-json.middleware';

const request = {} as Request;
const response = {} as Response;

describe('rejectInvalidJson (V1)', () => {
  it('troca o erro de JSON malformado do parser por 400 com mensagem própria', () => {
    let forwarded: unknown;
    const parseError = Object.assign(new SyntaxError('Unexpected token'), {
      type: 'entity.parse.failed',
    });

    rejectInvalidJson(parseError, request, response, (error?: unknown) => {
      forwarded = error;
    });

    expect(forwarded).toBeInstanceOf(BadRequestException);
    expect((forwarded as BadRequestException).message).toBe(
      INVALID_JSON_MESSAGE,
    );
  });

  it('repassa sem mudar qualquer outro erro', () => {
    const next = jest.fn();
    const tooLarge = { status: 413, type: 'entity.too.large' };

    rejectInvalidJson(tooLarge, request, response, next);

    expect(next).toHaveBeenCalledWith(tooLarge);
  });
});
