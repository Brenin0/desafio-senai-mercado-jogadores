import { applyDecorators } from '@nestjs/common';
import { ValidateBy, ValidationArguments } from 'class-validator';
import {
  HasNoDigits,
  HasWordCountBetween,
  IsNormalizedText,
} from '../../common/validators/text.validators';
import {
  IsIntegerBetween,
  IsOneOf,
  IsRequired,
} from '../../common/validators/value.validators';
import {
  ATTRIBUTE_NAMES,
  PlayerAttributes,
  POSITIONS,
} from '../../domain/player';
import {
  EQUAL_POTENTIAL_FROM_AGE,
  highestAttribute,
  isAgilityAllowed,
  isAttributesSumAllowed,
  isPotentialAllowedAtRegistration,
  MAX_ATTRIBUTES_SUM,
  MAX_REDUCED_AGILITY,
  REDUCED_AGILITY_FROM_AGE,
} from '../../domain/player-limits';

type Body = Record<string, unknown>;

function bodyOf(args: ValidationArguments): Body {
  return args.object as Body;
}

function integerOrNull(value: unknown): number | null {
  return Number.isInteger(value) ? (value as number) : null;
}

/** Os seis atributos do corpo, se todos forem inteiros; um atributo inválido é recusado pela própria regra. */
function attributesOf(body: Body): PlayerAttributes | null {
  return ATTRIBUTE_NAMES.every((name) => Number.isInteger(body[name]))
    ? (body as unknown as PlayerAttributes)
    : null;
}

/** Limites: 3 a 100 caracteres depois da V4, pelo menos duas palavras e nenhum dígito. */
export function IsPlayerName(): PropertyDecorator {
  return applyDecorators(
    IsRequired(),
    IsNormalizedText(3, 100),
    HasWordCountBetween(2),
    HasNoDigits(),
  );
}

export function IsPosition(): PropertyDecorator {
  return applyDecorators(IsRequired(), IsOneOf(POSITIONS));
}

export function IsAge(): PropertyDecorator {
  return applyDecorators(IsRequired(), IsIntegerBetween(16, 45));
}

/** Limites: 1 a 100; com 35 anos ou mais, no máximo 85. */
export function IsAgility(): PropertyDecorator {
  return applyDecorators(
    IsRequired(),
    IsIntegerBetween(1, 100),
    ValidateBy({
      name: 'isAgilityAllowedForAge',
      validator: {
        validate: (agility: unknown, args: ValidationArguments) => {
          const age = integerOrNull(bodyOf(args).age);
          return age === null || isAgilityAllowed(agility as number, age);
        },
        defaultMessage: () =>
          `agility deve ser no máximo ${MAX_REDUCED_AGILITY} para jogadores com ${REDUCED_AGILITY_FROM_AGE} anos ou mais`,
      },
    }),
  );
}

/** Limites: cada atributo de 1 a 99, e a soma dos seis não pode passar de 480. */
export function IsAttribute(): PropertyDecorator {
  return applyDecorators(
    IsRequired(),
    IsIntegerBetween(1, 99),
    ValidateBy({
      name: 'isAttributesSumAllowed',
      validator: {
        validate: (_: unknown, args: ValidationArguments) => {
          const attributes = attributesOf(bodyOf(args));
          return attributes === null || isAttributesSumAllowed(attributes);
        },
        defaultMessage: () =>
          `a soma de ${ATTRIBUTE_NAMES.join(', ')} não pode passar de ${MAX_ATTRIBUTES_SUM}`,
      },
    }),
  );
}

function potentialMessage(args: ValidationArguments): string {
  const body = bodyOf(args);
  const attributes = attributesOf(body) as PlayerAttributes;
  const highest = highestAttribute(attributes);
  return (integerOrNull(body.age) ?? 0) >= EQUAL_POTENTIAL_FROM_AGE
    ? `potential deve ser igual ao maior dos seis atributos (${highest}) no cadastro de jogador com ${EQUAL_POTENTIAL_FROM_AGE} anos ou mais`
    : `potential deve ser maior ou igual ao maior dos seis atributos (${highest})`;
}

/**
 * RN06 e Limites: 1 a 99 e maior ou igual ao maior dos seis atributos; no cadastro de jogador com
 * 33 anos ou mais, igual a ele.
 */
export function IsPotential(): PropertyDecorator {
  return applyDecorators(
    IsRequired(),
    IsIntegerBetween(1, 99),
    ValidateBy({
      name: 'isPotentialAllowedAtRegistration',
      validator: {
        validate: (potential: unknown, args: ValidationArguments) => {
          const body = bodyOf(args);
          const attributes = attributesOf(body);
          const age = integerOrNull(body.age);
          return (
            attributes === null ||
            age === null ||
            isPotentialAllowedAtRegistration(
              potential as number,
              attributes,
              age,
            )
          );
        },
        defaultMessage: potentialMessage,
      },
    }),
  );
}
