import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ValidateBy } from 'class-validator';
import { parseBrasiliaDateTime } from '../../domain/datetime';

/**
 * RN01: data e hora de Brasília só no formato AAAA-MM-DDTHH:MM-03:00, com data e hora que existem,
 * convertida para Date. Outro formato, data inexistente ou valor que não é texto segue como chegou e
 * é recusado; nunca é ajustado.
 */
export function IsBrasiliaDateTime(): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string'
        ? (parseBrasiliaDateTime(value) ?? value)
        : value,
    ),
    ValidateBy({
      name: 'isBrasiliaDateTime',
      validator: {
        validate: (value: unknown) => value instanceof Date,
        defaultMessage: () =>
          '$property deve ser uma data e hora que exista, no formato AAAA-MM-DDTHH:MM-03:00 (ex.: 2027-03-02T10:15-03:00)',
      },
    }),
  );
}
