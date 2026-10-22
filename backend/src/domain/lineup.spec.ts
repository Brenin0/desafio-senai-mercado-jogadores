import { fitsFormation, Formation } from './lineup';
import { Position } from './player';

describe('RN19 – formações aceitas (tabela de exemplos, na ordem do elenco)', () => {
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
