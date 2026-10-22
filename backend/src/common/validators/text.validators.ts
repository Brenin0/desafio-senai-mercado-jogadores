/*
 * O class-validator confere os decoradores empilhados num campo de baixo para cima. Para a mensagem
 * apontar a primeira regra violada na ordem de leitura, cada DTO junta as regras de um campo com
 * applyDecorators, que as registra na ordem em que são escritas.
 */
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateBy } from 'class-validator';
import {
  countCharacters,
  countWords,
  hasControlCharacter,
  hasDigit,
  normalizeSpaces,
} from '../../domain/text';

function isBetween(count: number, min: number, max: number): boolean {
  return count >= min && count <= max;
}

/** V4: tira os espaços das pontas e junta os repetidos, antes de validar o tamanho e de gravar. */
function NormalizeSpaces(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalizeSpaces(value) : value,
  );
}

function HasNoControlCharacters(): PropertyDecorator {
  return ValidateBy({
    name: 'hasNoControlCharacters',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && !hasControlCharacter(value),
      defaultMessage: () =>
        '$property não pode ter caracteres de controle, como tabulação ou quebra de linha',
    },
  });
}

function HasLengthBetween(min: number, max: number): PropertyDecorator {
  return ValidateBy({
    name: 'hasLengthBetween',
    constraints: [min, max],
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        isBetween(countCharacters(value), min, max),
      defaultMessage: () =>
        '$property deve ter de $constraint1 a $constraint2 caracteres',
    },
  });
}

/**
 * V4: texto com os espaços normalizados, sem caracteres de controle e com o tamanho em pontos de
 * código. Texto que fica vazio depois da V4 conta como ausente e é recusado.
 */
export function IsNormalizedText(
  minLength: number,
  maxLength: number,
): PropertyDecorator {
  return applyDecorators(
    NormalizeSpaces(),
    IsString({ message: '$property deve ser um texto' }),
    IsNotEmpty({ message: '$property não pode ser vazio' }),
    HasNoControlCharacters(),
    HasLengthBetween(minLength, maxLength),
  );
}

/**
 * Limites: quantidade de palavras (sequências sem espaço com pelo menos uma letra). Valor que não é
 * texto passa, porque o tipo é conferido pelo IsNormalizedText.
 */
export function HasWordCountBetween(
  min: number,
  max: number = Infinity,
): PropertyDecorator {
  return ValidateBy({
    name: 'hasWordCountBetween',
    constraints: [min, max],
    validator: {
      validate: (value: unknown) =>
        typeof value !== 'string' || isBetween(countWords(value), min, max),
      defaultMessage: () =>
        max === Infinity
          ? '$property deve ter pelo menos $constraint1 palavras'
          : '$property deve ter de $constraint1 a $constraint2 palavras',
    },
  });
}

/** Limites: nenhum dígito de 0 a 9. Valor que não é texto passa, como em HasWordCountBetween. */
export function HasNoDigits(): PropertyDecorator {
  return ValidateBy({
    name: 'hasNoDigits',
    validator: {
      validate: (value: unknown) =>
        typeof value !== 'string' || !hasDigit(value),
      defaultMessage: () => '$property não pode ter dígitos',
    },
  });
}
