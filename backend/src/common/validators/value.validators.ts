import { applyDecorators } from '@nestjs/common';
import {
  ArrayUnique,
  IsArray,
  IsDefined,
  IsIn,
  ValidateBy,
  ValidationArguments,
} from 'class-validator';
import { MAX_INTEGER } from '../parsing/positive-integer';

function isIntegerBetween(value: unknown, min: number, max: number): boolean {
  return (
    Number.isInteger(value) &&
    (value as number) >= min &&
    (value as number) <= max
  );
}

/** V6: campo obrigatório ausente ou `null` é recusado. */
export function IsRequired(): PropertyDecorator {
  return IsDefined({ message: '$property é obrigatório' });
}

/**
 * V2 e Limites: número JSON inteiro dentro do limite, inclusivo. Texto (`"15"`) e parte fracionária
 * (`50.5`) são recusados; `50.0` chega como 50 e é aceito.
 */
export function IsIntegerBetween(
  min: number,
  max: number = MAX_INTEGER,
): PropertyDecorator {
  return ValidateBy({
    name: 'isIntegerBetween',
    constraints: [min, max],
    validator: {
      validate: (value: unknown) => isIntegerBetween(value, min, max),
      defaultMessage: () =>
        max === MAX_INTEGER
          ? '$property deve ser um número inteiro maior ou igual a $constraint1'
          : '$property deve ser um número inteiro de $constraint1 a $constraint2',
    },
  });
}

/** V5: valor de lista exatamente como escrito, com as mesmas maiúsculas e minúsculas. */
export function IsOneOf(values: readonly string[]): PropertyDecorator {
  return IsIn([...values], {
    message: `$property deve ser um destes valores: ${values.join(', ')}`,
  });
}

/**
 * Lista de ids do corpo (Limites, `player_ids`): exatamente `size` ids, inteiros positivos e
 * distintos, conferidos nessa ordem.
 */
export function IsDistinctIdList(size: number): PropertyDecorator {
  return applyDecorators(
    IsArray({ message: '$property deve ser uma lista' }),
    ValidateBy({
      name: 'hasExactSize',
      constraints: [size],
      validator: {
        validate: (value: unknown) =>
          Array.isArray(value) && value.length === size,
        defaultMessage: () => '$property deve ter exatamente $constraint1 ids',
      },
    }),
    ValidateBy({
      name: 'hasOnlyPositiveIntegers',
      validator: {
        validate: (value: unknown) =>
          Array.isArray(value) &&
          value.every((id) => isIntegerBetween(id, 1, MAX_INTEGER)),
        defaultMessage: () =>
          '$property deve ter só números inteiros maiores ou iguais a 1',
      },
    }),
    ArrayUnique({ message: '$property não pode ter ids repetidos' }),
  );
}

/** Os dois campos não podem ter o mesmo valor (Limites, `home_club_id` e `away_club_id`). */
export function IsDifferentFrom(otherProperty: string): PropertyDecorator {
  return ValidateBy({
    name: 'isDifferentFrom',
    constraints: [otherProperty],
    validator: {
      validate: (value: unknown, args: ValidationArguments) =>
        value !== (args.object as Record<string, unknown>)[otherProperty],
      defaultMessage: () => '$property deve ser diferente de $constraint1',
    },
  });
}
