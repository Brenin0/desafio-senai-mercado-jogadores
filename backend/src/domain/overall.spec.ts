import { calculateOverall } from './overall';
import { Position } from './player';

describe('RN06 – overall: soma de atributo × peso da posição, ÷ 100, inteiro com meio para cima', () => {
  it.each<[Position, number, number, number, number, number, number, number]>([
    ['MEI', 68, 65, 80, 78, 52, 60, 73],
    ['ATA', 78, 75, 73, 82, 48, 68, 76],
    ['LAT', 72, 70, 78, 76, 70, 66, 72],
    ['ZAG', 50, 90, 60, 40, 80, 75, 73],
    ['GOL', 55, 30, 65, 40, 72, 68, 68],
  ])(
    '%s com velocidade %i, finalização %i, passe %i, drible %i, defesa %i e físico %i → %i',
    (
      position,
      pace,
      shooting,
      passing,
      dribbling,
      defending,
      physical,
      expected,
    ) => {
      const attributes = {
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical,
      };
      expect(calculateOverall(position, attributes)).toBe(expected);
    },
  );

  it('exemplo 2.1.3: Meia Lua (MEI 70, 68, 82, 79, 55, 64) → 75', () => {
    const attributes = {
      pace: 70,
      shooting: 68,
      passing: 82,
      dribbling: 79,
      defending: 55,
      physical: 64,
    };
    expect(calculateOverall('MEI', attributes)).toBe(75);
  });
});
