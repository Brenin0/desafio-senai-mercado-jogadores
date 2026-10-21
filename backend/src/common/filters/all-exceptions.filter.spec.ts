import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  INTERNAL_ERROR_MESSAGE,
  toErrorResponse,
} from './all-exceptions.filter';

const request = { method: 'GET', url: '/api/v1/players/1' };

describe('toErrorResponse', () => {
  it('mantém o status e a mensagem de uma HttpException', () => {
    expect(
      toErrorResponse(new BadRequestException('Nome inválido.'), request),
    ).toEqual({ status: 400, message: 'Nome inválido.' });
  });

  it('junta as mensagens quando a exceção traz uma lista', () => {
    const exception = new BadRequestException({
      message: ['Nome inválido.', 'Idade inválida.'],
    });

    expect(toErrorResponse(exception, request).message).toBe(
      'Nome inválido.; Idade inválida.',
    );
  });

  it('traduz o 404 de rota inexistente do Nest', () => {
    const exception = new NotFoundException('Cannot GET /api/v1/players/1');

    expect(toErrorResponse(exception, request)).toEqual({
      status: 404,
      message: 'Rota não encontrada: GET /api/v1/players/1',
    });
  });

  it('mantém o status de erros 4xx do parser, como corpo grande demais', () => {
    const tooLarge = { status: 413, type: 'entity.too.large' };

    expect(toErrorResponse(tooLarge, request).status).toBe(413);
  });

  it.each([
    new Error('detalhe interno'),
    new InternalServerErrorException('detalhe interno'),
    'texto solto',
  ])('esconde o detalhe de erro inesperado: %p', (exception) => {
    expect(toErrorResponse(exception, request)).toEqual({
      status: 500,
      message: INTERNAL_ERROR_MESSAGE,
    });
  });
});
