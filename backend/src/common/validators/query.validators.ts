import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, ValidateBy, ValidationArguments } from 'class-validator';
import Decimal from 'decimal.js';
import { parseDecimalAmount } from '../parsing/decimal-amount';
import { MAX_INTEGER, parsePositiveInteger } from '../parsing/positive-integer';
import { isCommaList, isSortList } from '../parsing/comma-list';
import { IsIntegerBetween } from './value.validators';

/**
 * Converte o texto do query param quando ele está na forma aceita. Fora dela, o valor segue como
 * chegou (texto em outra forma, ou lista, quando o parâmetro é repetido) e é recusado pela validação.
 */
function ConvertText<T>(parse: (text: string) => T | null): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? (parse(value) ?? value) : value,
  );
}

function parseBooleanText(text: string): boolean | null {
  if (text === 'true') {
    return true;
  }
  return text === 'false' ? false : null;
}

/** Inteiro positivo, só com dígitos, sem sinal, sem zeros à esquerda, sem ponto e sem expoente. */
export function IsQueryInteger(
  min: number = 1,
  max: number = MAX_INTEGER,
): PropertyDecorator {
  return applyDecorators(
    ConvertText(parsePositiveInteger),
    IsIntegerBetween(min, max),
  );
}

/** V5: só `true` ou `false`, em minúsculas. */
export function IsQueryBoolean(): PropertyDecorator {
  return applyDecorators(
    ConvertText(parseBooleanText),
    IsBoolean({ message: '$property deve ser true ou false' }),
  );
}

/** Valor em moedas na forma `10`, `10.5` ou `10.55`, dentro da faixa, inclusiva. */
export function IsQueryDecimal(min: number, max: number): PropertyDecorator {
  return applyDecorators(
    ConvertText(parseDecimalAmount),
    ValidateBy({
      name: 'isQueryDecimal',
      constraints: [min, max],
      validator: {
        validate: (value: unknown) =>
          value instanceof Decimal && value.gte(min) && value.lte(max),
        defaultMessage: () =>
          '$property deve ser um valor de $constraint1 a $constraint2, com até 2 casas decimais separadas por ponto',
      },
    }),
  );
}

/** Critérios de ordenação separados por vírgula, sem espaços e sem repetir o campo. */
export function IsQuerySort(
  accepted: readonly string[],
  maxCriteria: number,
): PropertyDecorator {
  return ValidateBy({
    name: 'isQuerySort',
    constraints: [accepted, maxCriteria],
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && isSortList(value, accepted, maxCriteria),
      defaultMessage: () =>
        `$property aceita até ${maxCriteria} destes valores, separados por vírgula, sem espaços e sem repetir o campo: ${accepted.join(', ')}`,
    },
  });
}

/** Um ou mais valores aceitos, separados por vírgula, sem espaços e sem repetição. */
export function IsQueryList(accepted: readonly string[]): PropertyDecorator {
  return ValidateBy({
    name: 'isQueryList',
    constraints: [accepted],
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        isCommaList(value, accepted, accepted.length),
      defaultMessage: () =>
        `$property aceita um ou mais destes valores, separados por vírgula, sem espaços e sem repetição: ${accepted.join(', ')}`,
    },
  });
}

function isComparable(value: unknown): value is number | Decimal {
  return typeof value === 'number' || value instanceof Decimal;
}

/**
 * Faixa contraditória: o limite inferior não pode passar do superior. Só compara quando os dois
 * limites são válidos; um limite inválido é recusado pela validação dele.
 */
export function IsNotGreaterThan(otherProperty: string): PropertyDecorator {
  return ValidateBy({
    name: 'isNotGreaterThan',
    constraints: [otherProperty],
    validator: {
      validate: (value: unknown, args: ValidationArguments) => {
        const other = (args.object as Record<string, unknown>)[otherProperty];
        return (
          !isComparable(value) ||
          !isComparable(other) ||
          new Decimal(value).lte(other)
        );
      },
      defaultMessage: () => '$property não pode ser maior que $constraint1',
    },
  });
}

/** Combinação contraditória: o parâmetro com valor `true` não pode vir junto com o outro. */
export function IsNotTrueWith(otherProperty: string): PropertyDecorator {
  return ValidateBy({
    name: 'isNotTrueWith',
    constraints: [otherProperty],
    validator: {
      validate: (value: unknown, args: ValidationArguments) =>
        value !== true ||
        (args.object as Record<string, unknown>)[otherProperty] === undefined,
      defaultMessage: () =>
        '$property=true não pode vir junto com $constraint1',
    },
  });
}
