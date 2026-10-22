import {
  highestAttribute,
  isAgilityAllowed,
  isAttributesSumAllowed,
  isPotentialAllowedAtRegistration,
} from './player-limits';
import { PlayerAttributes } from './player';

const attributes = (values: number[]): PlayerAttributes => {
  const [pace, shooting, passing, dribbling, defending, physical] = values;
  return { pace, shooting, passing, dribbling, defending, physical };
};

describe('Limites – agilidade: com 35 anos ou mais, no máximo 85', () => {
  it.each([
    [35, 85, true],
    [35, 86, false],
    [45, 85, true],
    [34, 100, true],
    [16, 100, true],
  ])('idade %i e agilidade %i → %p', (age, agility, allowed) => {
    expect(isAgilityAllowed(agility, age)).toBe(allowed);
  });
});

describe('Limites – a soma dos seis atributos não pode passar de 480', () => {
  it('soma 480 é aceita', () => {
    expect(isAttributesSumAllowed(attributes([80, 80, 80, 80, 80, 80]))).toBe(
      true,
    );
  });

  it('soma 481 é recusada', () => {
    expect(isAttributesSumAllowed(attributes([81, 80, 80, 80, 80, 80]))).toBe(
      false,
    );
  });
});

describe('RN06 – potencial e o maior dos seis atributos', () => {
  const sample = attributes([70, 68, 82, 79, 55, 64]);

  it('o maior atributo do Meia Lua é o passe, 82', () => {
    expect(highestAttribute(sample)).toBe(82);
  });

  it.each([
    [82, 25, true],
    [86, 25, true],
    [81, 25, false],
    [86, 32, true],
    [82, 33, true],
    [83, 33, false],
    [81, 33, false],
    [82, 45, true],
  ])('potencial %i com %i anos no cadastro → %p', (potential, age, allowed) => {
    expect(isPotentialAllowedAtRegistration(potential, sample, age)).toBe(
      allowed,
    );
  });
});
