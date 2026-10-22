import { ATTRIBUTE_NAMES, PlayerAttributes } from './player';

export const REDUCED_AGILITY_FROM_AGE = 35;
export const MAX_REDUCED_AGILITY = 85;
export const MAX_ATTRIBUTES_SUM = 480;
export const EQUAL_POTENTIAL_FROM_AGE = 33;

/** Limites: com 35 anos ou mais, a agilidade vai no máximo a 85. */
export function isAgilityAllowed(agility: number, age: number): boolean {
  return age < REDUCED_AGILITY_FROM_AGE || agility <= MAX_REDUCED_AGILITY;
}

/** Limites: a soma dos seis atributos não pode passar de 480. */
export function isAttributesSumAllowed(attributes: PlayerAttributes): boolean {
  const sum = ATTRIBUTE_NAMES.reduce(
    (total, name) => total + attributes[name],
    0,
  );
  return sum <= MAX_ATTRIBUTES_SUM;
}

export function highestAttribute(attributes: PlayerAttributes): number {
  return Math.max(...ATTRIBUTE_NAMES.map((name) => attributes[name]));
}

/**
 * RN06 e Limites: o potencial nunca é menor que o maior dos seis atributos e, no cadastro de jogador
 * com 33 anos ou mais, é igual a ele.
 */
export function isPotentialAllowedAtRegistration(
  potential: number,
  attributes: PlayerAttributes,
  age: number,
): boolean {
  const highest = highestAttribute(attributes);
  return age >= EQUAL_POTENTIAL_FROM_AGE
    ? potential === highest
    : potential >= highest;
}
