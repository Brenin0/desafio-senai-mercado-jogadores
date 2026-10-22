import { NotFoundException } from '@nestjs/common';
import { UrlIdPipe } from './url-id.pipe';

const NOT_FOUND_MESSAGE = 'Jogador não encontrado.';

describe('UrlIdPipe (V8)', () => {
  const pipe = new UrlIdPipe(NOT_FOUND_MESSAGE);

  it.each([
    ['1', 1],
    ['42', 42],
    ['2147483647', 2147483647],
  ])('converte o id %s para número', (value, expected) => {
    expect(pipe.transform(value)).toBe(expected);
  });

  it.each(['abc', '0', '-1', '1.5', '01', '+1', '1e3', '2147483648'])(
    'responde 404, com a mensagem do recurso, para o id %s',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(
        new NotFoundException(NOT_FOUND_MESSAGE),
      );
    },
  );

  it('responde 404 para um valor que já não é texto', () => {
    expect(() => pipe.transform(1)).toThrow(NotFoundException);
  });
});
