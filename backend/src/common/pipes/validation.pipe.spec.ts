import { ValidationError } from '@nestjs/common';
import { formatValidationErrors } from './validation.pipe';

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
});
