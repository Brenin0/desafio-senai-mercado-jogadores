import Decimal from 'decimal.js';
import { Player } from './player';
import { listPlayers, PlayerListing } from './player-listing';

let nextId = 1;

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: nextId++,
    name: 'Meia Lua',
    position: 'MEI',
    agility: 85,
    age: 25,
    condition: 'APTO',
    baseValue: new Decimal('40.00'),
    pace: 70,
    shooting: 68,
    passing: 82,
    dribbling: 79,
    defending: 55,
    physical: 64,
    potential: 86,
    clubId: null,
    ...overrides,
  };
}

const DEFAULT_LISTING: PlayerListing = { sort: ['name'], page: 1, limit: 10 };

function listedNames(players: Player[], listing: Partial<PlayerListing>) {
  return listPlayers(players, { ...DEFAULT_LISTING, ...listing }).data.map(
    ({ name }) => name,
  );
}

function listedIds(players: Player[], listing: Partial<PlayerListing>) {
  return listPlayers(players, { ...DEFAULT_LISTING, ...listing }).data.map(
    ({ id }) => id,
  );
}

describe('RN07 – busca no nome, sem diferenciar maiúsculas, minúsculas e acentos', () => {
  const players = [
    player({ name: 'João Silva' }),
    player({ name: 'Meia Lua' }),
    player({ name: 'Ana Conceição' }),
  ];

  it.each([
    ['joao', ['João Silva']],
    ['LUA', ['Meia Lua']],
    ['conceicao', ['Ana Conceição']],
    ['a', ['Ana Conceição', 'João Silva', 'Meia Lua']],
    ['zeta', []],
  ])('search=%s', (search, names) => {
    expect(listedNames(players, { search })).toEqual(names);
  });
});

describe('RN07 – faixa de valor pelo valor de mercado, nunca pelo valor base', () => {
  const sick = player({ name: 'Meia Lua', condition: 'MAL_CONDICIONADO' });
  const fit = player({ name: 'Otto Rangel', baseValue: new Decimal('30.00') });

  it('o Meia Lua, com valor base 40,00 e valor de mercado 37,00, fica fora de min_value=38', () => {
    expect(listedNames([sick, fit], { minValue: new Decimal(38) })).toEqual([]);
  });

  it('as faixas são inclusivas', () => {
    expect(
      listedNames([sick, fit], {
        minValue: new Decimal(30),
        maxValue: new Decimal(37),
      }),
    ).toEqual(['Meia Lua', 'Otto Rangel']);
  });

  it('só com max_value, o mínimo é o extremo da faixa', () => {
    expect(listedNames([sick, fit], { maxValue: new Decimal(36.99) })).toEqual([
      'Otto Rangel',
    ]);
  });
});

describe('RN07 – ordenação, com empate desfeito pelo nome e depois pelo id', () => {
  it('sort=name usa a ordem alfabética das Premissas: "Épsilon" entre "Delta" e "Gama"; "Ana Lima" antes de "Ana-Maria"', () => {
    const players = [
      'Gama Reis',
      'Ana-Maria Paz',
      'Épsilon Dias',
      'Ana Lima',
      'Delta Sá',
    ].map((name) => player({ name }));

    expect(listedNames(players, { sort: ['name'] })).toEqual([
      'Ana Lima',
      'Ana-Maria Paz',
      'Delta Sá',
      'Épsilon Dias',
      'Gama Reis',
    ]);
  });

  it('nomes iguais na comparação seguem o id crescente', () => {
    const second = player({ name: 'Águias Lima' });
    const first = player({ name: 'Aguias Lima' });

    expect(listedIds([first, second], { sort: ['name'] })).toEqual([
      second.id,
      first.id,
    ]);
  });

  it('value_asc e value_desc usam o valor de mercado; o empate segue o nome', () => {
    const cheap = player({ name: 'Caio Lima', baseValue: new Decimal(10) });
    const tieB = player({ name: 'Bia Lima', baseValue: new Decimal(30) });
    const tieA = player({ name: 'Ana Lima', baseValue: new Decimal(30) });
    const sick = player({ name: 'Davi Lima', condition: 'MAL_CONDICIONADO' });

    expect(
      listedNames([cheap, tieB, tieA, sick], { sort: ['value_asc'] }),
    ).toEqual(['Caio Lima', 'Ana Lima', 'Bia Lima', 'Davi Lima']);
    expect(
      listedNames([cheap, tieB, tieA, sick], { sort: ['value_desc'] }),
    ).toEqual(['Davi Lima', 'Ana Lima', 'Bia Lima', 'Caio Lima']);
  });

  it('age_asc e age_desc ordenam pela idade', () => {
    const players = [
      player({ name: 'Ana Lima', age: 30 }),
      player({ name: 'Bia Lima', age: 18 }),
      player({ name: 'Caio Lima', age: 25 }),
    ];

    expect(listedNames(players, { sort: ['age_asc'] })).toEqual([
      'Bia Lima',
      'Caio Lima',
      'Ana Lima',
    ]);
    expect(listedNames(players, { sort: ['age_desc'] })).toEqual([
      'Ana Lima',
      'Caio Lima',
      'Bia Lima',
    ]);
  });

  it('sort=position segue GOL, ZAG, LAT, MEI, ATA, não a ordem alfabética', () => {
    const players = (['ATA', 'MEI', 'LAT', 'ZAG', 'GOL'] as const).map(
      (position) => player({ name: `Jogador ${position}`, position }),
    );

    expect(listedNames(players, { sort: ['position'] })).toEqual([
      'Jogador GOL',
      'Jogador ZAG',
      'Jogador LAT',
      'Jogador MEI',
      'Jogador ATA',
    ]);
  });

  it('com dois critérios, o segundo desempata o primeiro: position,value_desc', () => {
    const players = [
      player({ name: 'Ana Lima', position: 'ATA', baseValue: new Decimal(10) }),
      player({ name: 'Bia Lima', position: 'GOL', baseValue: new Decimal(10) }),
      player({
        name: 'Caio Lima',
        position: 'ATA',
        baseValue: new Decimal(50),
      }),
      player({
        name: 'Davi Lima',
        position: 'GOL',
        baseValue: new Decimal(20),
      }),
    ];

    expect(listedNames(players, { sort: ['position', 'value_desc'] })).toEqual([
      'Davi Lima',
      'Bia Lima',
      'Caio Lima',
      'Ana Lima',
    ]);
  });
});

describe('RN07 – paginação depois de buscar, filtrar e ordenar', () => {
  const players = Array.from({ length: 23 }, (_, index) =>
    player({ name: `Jogador ${String.fromCharCode(65 + index)} Lima` }),
  );

  it('23 jogadores, limit 10, page 3: do 21º ao 23º, com total_items 23 e total_pages 3', () => {
    const page = listPlayers(players, { ...DEFAULT_LISTING, page: 3 });

    expect(page.data.map(({ name }) => name)).toEqual([
      'Jogador U Lima',
      'Jogador V Lima',
      'Jogador W Lima',
    ]);
    expect(page.meta).toEqual({
      page: 3,
      limit: 10,
      totalItems: 23,
      totalPages: 3,
    });
  });

  it('total_items conta todos os que atendem à busca, não só os da página', () => {
    const page = listPlayers(players, {
      ...DEFAULT_LISTING,
      search: 'jogador a',
      limit: 1,
    });

    expect(page.meta).toEqual({
      page: 1,
      limit: 1,
      totalItems: 1,
      totalPages: 1,
    });
  });
});
