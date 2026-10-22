import { ArgumentMetadata, ValidationError } from '@nestjs/common';
import {
  createValidationPipe,
  formatValidationErrors,
} from './validation.pipe';

describe('createValidationPipe (V2)', () => {
  const pipe = createValidationPipe();

  it.each<ArgumentMetadata['type']>(['param', 'query'])(
    'não converte o texto de um %s declarado como número',
    async (type) => {
      const metadata: ArgumentMetadata = { type, metatype: Number, data: 'id' };

      await expect(pipe.transform('01', metadata)).resolves.toBe('01');
    },
  );

  it('não converte o texto de um parâmetro declarado como booleano', async () => {
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: Boolean,
      data: 'free',
    };

    await expect(pipe.transform('TRUE', metadata)).resolves.toBe('TRUE');
  });
});

describe('formatValidationErrors', () => {
  it('junta as mensagens de todos os campos, inclusive os aninhados', () => {
    const errors: ValidationError[] = [
      { property: 'name', constraints: { length: 'Nome inválido.' } },
      {
        property: 'contract',
        children: [
          {
            property: 'loyalty_until',
            constraints: { format: 'Data inválida.' },
          },
        ],
      },
    ];

    expect(formatValidationErrors(errors)).toBe(
      'Nome inválido.; Data inválida.',
    );
  });

  it('mostra uma vez a mesma mensagem vinda de campos diferentes', () => {
    const sum = 'A soma dos seis atributos não pode passar de 480.';
    const errors: ValidationError[] = [
      { property: 'pace', constraints: { sum } },
      { property: 'physical', constraints: { sum } },
      { property: 'age', constraints: { range: 'Idade inválida.' } },
    ];

    expect(formatValidationErrors(errors)).toBe(`${sum}; Idade inválida.`);
  });
});
