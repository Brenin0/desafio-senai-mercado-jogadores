import { applyDecorators } from '@nestjs/common';
import { Matches, ValidateBy, ValidationArguments } from 'class-validator';
import {
  HasWordCountBetween,
  IsNormalizedText,
} from '../../common/validators/text.validators';
import { IsRequired } from '../../common/validators/value.validators';
import { acronymFitsName } from '../../domain/text';

const CLUB_NAME_CHARACTERS = /^[\p{L} .-]+$/u;
const ACRONYM_FORMAT = /^[A-Z]{3}$/;
const SAME_THREE_LETTERS = /^(.)\1\1$/;

/** Limites: 3 a 60 caracteres depois da V4, 2 a 5 palavras, só letras, espaços, hífen e ponto. */
export function IsClubName(): PropertyDecorator {
  return applyDecorators(
    IsRequired(),
    IsNormalizedText(3, 60),
    HasWordCountBetween(2, 5),
    Matches(CLUB_NAME_CHARACTERS, {
      message:
        'name só pode ter letras (com ou sem acento), espaços, hífen e ponto',
    }),
  );
}

/**
 * Limites: exatamente 3 letras de A a Z, maiúsculas e sem acento, não todas iguais, que aparecem
 * no nome nessa ordem, começando pela primeira letra do nome. A sigla não passa pela V4.
 */
export function IsAcronym(): PropertyDecorator {
  return applyDecorators(
    IsRequired(),
    Matches(ACRONYM_FORMAT, {
      message:
        'acronym deve ter exatamente 3 letras de A a Z, maiúsculas e sem acento',
    }),
    ValidateBy({
      name: 'hasDifferentLetters',
      validator: {
        validate: (acronym: unknown) =>
          !SAME_THREE_LETTERS.test(acronym as string),
        defaultMessage: () => 'as três letras de acronym não podem ser iguais',
      },
    }),
    ValidateBy({
      name: 'fitsClubName',
      validator: {
        validate: (acronym: unknown, args: ValidationArguments) => {
          const { name } = args.object as { name: unknown };
          return (
            typeof name !== 'string' || acronymFitsName(acronym as string, name)
          );
        },
        defaultMessage: () =>
          'acronym deve começar pela primeira letra do nome e ter as letras na ordem em que aparecem nele',
      },
    }),
  );
}
