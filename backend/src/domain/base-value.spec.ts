import { calculateBaseValue } from './base-value';

describe('RN06 – valor base: parte do overall por faixas, jovem promessa e piso de 1,00', () => {
  it.each<[number, number, number, string]>([
    [75, 86, 25, '40.00'],
    [60, 70, 30, '10.00'],
    [61, 70, 30, '12.00'],
    [76, 80, 22, '46.00'],
    [85, 92, 27, '100.00'],
    [70, 84, 21, '34.20'],
    [70, 84, 22, '30.00'],
    [45, 90, 18, '3.63'],
    [40, 66, 36, '1.00'],
  ])(
    'overall %i, potencial %i, %i anos no cadastro → %s',
    (overall, potential, age, expected) => {
      const baseValue = calculateBaseValue({ overall, potential, age });
      expect(baseValue.toNumber()).toBe(Number(expected));
    },
  );
});
