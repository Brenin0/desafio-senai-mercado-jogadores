import {
  canPlay,
  fitsFormation,
  Formation,
  FORMATIONS,
  isLineupComplete,
  LINEUP_SIZE,
} from './lineup';
import { Condition, Position } from './player';

describe('RN19 – formações aceitas (tabela de exemplos, na ordem do elenco)', () => {
  it('são as 4 da tabela: 3-1, 2-2, 2-1-1 e 1-2-1', () => {
    expect(FORMATIONS).toEqual(['3-1', '2-2', '2-1-1', '1-2-1']);
  });

  it.each<[Formation, Position[]]>([
    ['3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA']],
    ['2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA']],
    ['2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA']],
  ])('%s com %j fecha a formação', (formation, positions) => {
    expect(fitsFormation(formation, positions)).toBe(true);
  });
});

describe('RN19 – as posições precisam fechar a formação: 1 GOL e cada setor', () => {
  it('ZAG e LAT contam juntos na defesa: 3-1 com 3 ZAG', () => {
    expect(fitsFormation('3-1', ['GOL', 'ZAG', 'ZAG', 'ZAG', 'ATA'])).toBe(
      true,
    );
  });

  it('os titulares podem vir em qualquer ordem', () => {
    expect(fitsFormation('2-1-1', ['ATA', 'LAT', 'GOL', 'MEI', 'ZAG'])).toBe(
      true,
    );
  });

  it.each<[string, Formation, Position[]]>([
    ['defesa com um a mais', '2-1-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA']],
    ['meio com um a mais', '2-2', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['ataque com um a mais', '1-2-1', ['GOL', 'ZAG', 'MEI', 'ATA', 'ATA']],
    ['sem goleiro', '2-1-1', ['ZAG', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['com dois goleiros', '1-2-1', ['GOL', 'GOL', 'MEI', 'MEI', 'ATA']],
  ])('%s: %s com %j não fecha', (_, formation, positions) => {
    expect(fitsFormation(formation, positions)).toBe(false);
  });

  it('os 4 jogadores de linha do 2-1-1 sem o goleiro não fecham', () => {
    expect(fitsFormation('2-1-1', ['ZAG', 'LAT', 'MEI', 'ATA'])).toBe(false);
  });
});

describe('RN19 – titular DOENTE: não é escalado e não joga', () => {
  it.each<[Condition, boolean]>([
    ['APTO', true],
    ['MAL_CONDICIONADO', true],
    ['DOENTE', false],
  ])('%s → %s', (condition, expected) => {
    expect(canPlay({ condition })).toBe(expected);
  });
});

describe('RN19 – escalação completa: formação salva e os 5 titulares', () => {
  const starters = (...conditions: Condition[]) =>
    conditions.map((condition) => ({ condition }));

  it('a escalação tem 5 titulares', () => {
    expect(LINEUP_SIZE).toBe(5);
  });

  it('formação e 5 titulares APTO ou MAL_CONDICIONADO: completa', () => {
    expect(
      isLineupComplete(
        '2-1-1',
        starters('APTO', 'APTO', 'MAL_CONDICIONADO', 'APTO', 'APTO'),
      ),
    ).toBe(true);
  });

  it('o clube nasce sem escalação: sem formação e sem titulares, incompleta', () => {
    expect(isLineupComplete(null, [])).toBe(false);
  });

  it('titular vendido sai: a mesma formação com 4 titulares, incompleta', () => {
    expect(
      isLineupComplete('2-1-1', starters('APTO', 'APTO', 'APTO', 'APTO')),
    ).toBe(false);
  });

  it('5 titulares sem formação salva: incompleta', () => {
    expect(
      isLineupComplete(null, starters('APTO', 'APTO', 'APTO', 'APTO', 'APTO')),
    ).toBe(false);
  });

  it('titular DOENTE não conta: incompleta', () => {
    expect(
      isLineupComplete(
        '3-1',
        starters('APTO', 'APTO', 'APTO', 'APTO', 'DOENTE'),
      ),
    ).toBe(false);
  });
});
