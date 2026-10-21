import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { BodyMustBeObjectPipe } from './body-must-be-object.pipe';

const body: ArgumentMetadata = { type: 'body' };
const query: ArgumentMetadata = { type: 'query' };

describe('BodyMustBeObjectPipe (V1)', () => {
  const pipe = new BodyMustBeObjectPipe();

  it('deixa passar um objeto', () => {
    const value = { name: 'Meia Lua' };

    expect(pipe.transform(value, body)).toBe(value);
  });

  it.each([[[]], ['x'], [10], [null], [true], [undefined]])(
    'recusa corpo que não é objeto: %p',
    (value) => {
      expect(() => pipe.transform(value, body)).toThrow(BadRequestException);
    },
  );

  it('não mexe no que não é corpo', () => {
    const value = ['COMPRA', 'VENDA'];

    expect(pipe.transform(value, query)).toBe(value);
  });
});
