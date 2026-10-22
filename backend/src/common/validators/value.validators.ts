import { IsDefined, IsIn, ValidateBy } from 'class-validator';
import { MAX_INTEGER } from '../parsing/positive-integer';

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
      validate: (value: unknown) =>
        Number.isInteger(value) &&
        (value as number) >= min &&
        (value as number) <= max,
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
