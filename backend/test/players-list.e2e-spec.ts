import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import { MEIA_LUA, MEIA_LUA_RESPONSE } from './players.fixtures';
import { insertClub, signPlayer } from './records';

interface PlayerItem {
  id: number;
  name: string;
}

interface PlayerPage {
  data: PlayerItem[];
  meta: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

describe('Listagem de jogadores (2.1.1, RN07)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  /** Cadastra a partir do Meia Lua; com 33 anos ou mais, o potencial fica igual ao maior atributo. */
  async function createPlayer(overrides: Record<string, unknown> = {}) {
    const body = { ...MEIA_LUA, ...overrides };
    if (body.age >= 33) {
      body.potential = 82;
    }
    const response = await request(server()).post('/api/v1/players').send(body);
    expect(response.status).toBe(201);
    return (response.body as PlayerItem).id;
  }

  const changeCondition = (id: number, condition: string) =>
    request(server())
      .patch(`/api/v1/players/${id}/condition`)
      .send({ condition });

  const listPlayers = (query = '') =>
    request(server()).get(`/api/v1/players${query}`);

  async function listedNames(query: string): Promise<string[]> {
    const response = await listPlayers(query);
    expect(response.status).toBe(200);
    return (response.body as PlayerPage).data.map(({ name }) => name);
  }

  it('200: sem jogadores, devolve data vazio e o meta com os padrões', async () => {
    const response = await listPlayers();

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({
      data: [],
      meta: { page: 1, limit: 10, total_items: 0, total_pages: 0 },
    });
  });

  it('o exemplo de 2.1.1: search=lua, position=MEI e sort=value_desc acham o Meia Lua MAL_CONDICIONADO', async () => {
    const id = await createPlayer();
    await createPlayer({ name: 'Otto Rangel', position: 'ATA' });
    await changeCondition(id, 'MAL_CONDICIONADO');

    const response = await listPlayers(
      '?search=lua&position=MEI&sort=value_desc&page=1&limit=10',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          ...MEIA_LUA_RESPONSE,
          id,
          condition: 'MAL_CONDICIONADO',
          market_value: 37,
        },
      ],
      meta: { page: 1, limit: 10, total_items: 1, total_pages: 1 },
    });
  });

  describe('paginação, depois de buscar, filtrar e ordenar (tabela da RN07)', () => {
    const names = Array.from(
      { length: 23 },
      (_, index) => `Jogador ${String.fromCharCode(65 + index)} Lima`,
    );

    beforeEach(async () => {
      for (const name of [...names].reverse()) {
        await createPlayer({ name });
      }
    });

    it.each([
      ['?limit=10&page=1', names.slice(0, 10), 1, 10, 3],
      ['?limit=10&page=3', names.slice(20, 23), 3, 10, 3],
      ['?limit=10&page=4', [], 4, 10, 3],
      ['?limit=50&page=1', names, 1, 50, 1],
    ])('%s', async (query, expectedNames, page, limit, totalPages) => {
      const response = await listPlayers(query);

      expect(response.status).toBe(200);
      expect(
        (response.body as PlayerPage).data.map(({ name }) => name),
      ).toEqual(expectedNames);
      expect((response.body as PlayerPage).meta).toEqual({
        page,
        limit,
        total_items: 23,
        total_pages: totalPages,
      });
    });

    it('total_items conta os que atendem à busca, não só os da página', async () => {
      const response = await listPlayers('?search=jogador&limit=1&page=2');

      expect((response.body as PlayerPage).meta).toEqual({
        page: 2,
        limit: 1,
        total_items: 23,
        total_pages: 23,
      });
    });
  });

  it('RN09: o jogador excluído sai da lista e do total_items', async () => {
    await createPlayer({ name: 'Ana Lima' });
    const deleted = await createPlayer({ name: 'Bia Lima' });
    await request(server()).delete(`/api/v1/players/${deleted}`);

    const response = await listPlayers();

    expect((response.body as PlayerPage).data.map(({ name }) => name)).toEqual([
      'Ana Lima',
    ]);
    expect((response.body as PlayerPage).meta.total_items).toBe(1);
  });

  describe('search', () => {
    beforeEach(async () => {
      await createPlayer({ name: 'João Silva' });
      await createPlayer({ name: 'Meia Lua' });
      await createPlayer({ name: 'Ana Conceição' });
    });

    it.each([
      ['joao', ['João Silva']],
      ['LUA', ['Meia Lua']],
      ['conceicao', ['Ana Conceição']],
      ['%20%20meia%20%20%20lua%20', ['Meia Lua']],
      ['zeta', []],
    ])('search=%s', async (search, expected) => {
      await expect(listedNames(`?search=${search}`)).resolves.toEqual(expected);
    });
  });

  describe('filtros, combinados', () => {
    let clubId: number;

    beforeEach(async () => {
      clubId = await insertClub(prisma, 'Águias FC', 'AGU');
      const otherClubId = await insertClub(prisma, 'Delta FC', 'DFC');
      const signed = await createPlayer({
        name: 'Ana Lima',
        position: 'GOL',
        age: 20,
      });
      await signPlayer(prisma, signed, clubId);
      const otherSigned = await createPlayer({
        name: 'Bia Lima',
        position: 'GOL',
        age: 30,
      });
      await signPlayer(prisma, otherSigned, otherClubId);
      const sick = await createPlayer({ name: 'Caio Lima', age: 25 });
      await changeCondition(sick, 'MAL_CONDICIONADO');
      await createPlayer({ name: 'Davi Lima', position: 'ATA', age: 35 });
    });

    it.each([
      ['?position=GOL', ['Ana Lima', 'Bia Lima']],
      ['?condition=MAL_CONDICIONADO', ['Caio Lima']],
      ['?free=true', ['Caio Lima', 'Davi Lima']],
      ['?free=false', ['Ana Lima', 'Bia Lima']],
      ['?club_id=CLUB', ['Ana Lima']],
      ['?free=false&club_id=CLUB', ['Ana Lima']],
      ['?min_age=25&max_age=30', ['Bia Lima', 'Caio Lima']],
      ['?min_age=25', ['Bia Lima', 'Caio Lima', 'Davi Lima']],
      ['?max_age=20', ['Ana Lima']],
      ['?min_age=20&max_age=20', ['Ana Lima']],
      ['?position=GOL&free=true', []],
      ['?position=GOL&free=false&min_age=21', ['Bia Lima']],
      ['?apelido=lua', ['Ana Lima', 'Bia Lima', 'Caio Lima', 'Davi Lima']],
    ])('%s', async (query, expected) => {
      await expect(
        listedNames(query.replace('CLUB', String(clubId))),
      ).resolves.toEqual(expected);
    });

    it('404: club_id de clube inexistente', async () => {
      expectRefusal(await listPlayers('?club_id=2147483647'), 404);
    });
  });

  describe('faixa de valor pelo valor de mercado, nunca pelo valor base', () => {
    /* Meia Lua: valor base 40,00 e valor de mercado 37,00. Otto Rangel: overall 50, valor 5,00. */
    beforeEach(async () => {
      const meiaLua = await createPlayer();
      await changeCondition(meiaLua, 'MAL_CONDICIONADO');
      await createPlayer({
        name: 'Otto Rangel',
        position: 'ATA',
        pace: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        defending: 50,
        physical: 50,
        potential: 50,
      });
    });

    it.each([
      ['?min_value=38', []],
      ['?min_value=37', ['Meia Lua']],
      ['?max_value=37', ['Meia Lua', 'Otto Rangel']],
      ['?max_value=36.99', ['Otto Rangel']],
      ['?min_value=0&max_value=550', ['Meia Lua', 'Otto Rangel']],
      ['?min_value=5&max_value=5.00', ['Otto Rangel']],
      ['?min_value=5.01', ['Meia Lua']],
    ])('%s', async (query, expected) => {
      await expect(listedNames(query)).resolves.toEqual(expected);
    });
  });

  describe('ordenação, com empate pelo nome e depois pelo id', () => {
    it('sort=name (padrão) usa a ordem alfabética das Premissas', async () => {
      for (const name of [
        'Gama Reis',
        'Ana-Maria Paz',
        'Épsilon Dias',
        'Ana Lima',
        'Delta Sá',
      ]) {
        await createPlayer({ name });
      }

      await expect(listedNames('')).resolves.toEqual([
        'Ana Lima',
        'Ana-Maria Paz',
        'Delta Sá',
        'Épsilon Dias',
        'Gama Reis',
      ]);
      await expect(listedNames('?sort=name')).resolves.toEqual(
        await listedNames(''),
      );
    });

    it('homônimos seguem o id crescente', async () => {
      const first = await createPlayer({ name: 'Meia Lua' });
      const second = await createPlayer({ name: 'Meia Lua' });

      const response = await listPlayers();

      expect((response.body as PlayerPage).data.map(({ id }) => id)).toEqual([
        first,
        second,
      ]);
    });

    describe('com jogadores de valores, idades e posições diferentes', () => {
      /*
       * Atributos do Meia Lua em outras posições (RN06 e RN05): Ana, ATA, overall 72 → 34,00;
       * Bia, GOL de 20 anos DOENTE, overall 65, valor base 24,20 → 22,99; Caio, GOL, overall 65 →
       * 20,00; Davi, ZAG de 35 anos, overall 63, valor base 16,00 → 14,40.
       */
      beforeEach(async () => {
        await createPlayer({ name: 'Ana Lima', position: 'ATA', age: 30 });
        const sick = await createPlayer({
          name: 'Bia Lima',
          position: 'GOL',
          age: 20,
        });
        await changeCondition(sick, 'DOENTE');
        await createPlayer({ name: 'Caio Lima', position: 'GOL', age: 25 });
        await createPlayer({ name: 'Davi Lima', position: 'ZAG', age: 35 });
      });

      it.each([
        ['value_asc', ['Davi Lima', 'Caio Lima', 'Bia Lima', 'Ana Lima']],
        ['value_desc', ['Ana Lima', 'Bia Lima', 'Caio Lima', 'Davi Lima']],
        ['age_asc', ['Bia Lima', 'Caio Lima', 'Ana Lima', 'Davi Lima']],
        ['age_desc', ['Davi Lima', 'Ana Lima', 'Caio Lima', 'Bia Lima']],
        ['position', ['Bia Lima', 'Caio Lima', 'Davi Lima', 'Ana Lima']],
        [
          'position,value_asc',
          ['Caio Lima', 'Bia Lima', 'Davi Lima', 'Ana Lima'],
        ],
        [
          'position,age_desc',
          ['Caio Lima', 'Bia Lima', 'Davi Lima', 'Ana Lima'],
        ],
        ['value_desc,name', ['Ana Lima', 'Bia Lima', 'Caio Lima', 'Davi Lima']],
      ])('sort=%s', async (sort, expected) => {
        await expect(listedNames(`?sort=${sort}`)).resolves.toEqual(expected);
      });
    });
  });

  describe('400: parâmetro inválido, vazio ou contraditório', () => {
    it.each([
      'search=',
      'search=a',
      'search=%20%20',
      `search=${'a'.repeat(101)}`,
      'search=lu%09a',
      'position=',
      'position=mei',
      'condition=apto',
      'free=TRUE',
      'free=1',
      'free=',
      'sort=POSITION',
      'sort=',
      'sort=name,',
      'sort=name,%20age_asc',
      'sort=value_asc,value_desc',
      'sort=name,name',
      'sort=name,age_asc,position',
      'page=0',
      'page=01',
      'page=1.0',
      'page=%2B1',
      'page=1e1',
      'page=',
      'limit=0',
      'limit=51',
      'min_age=15',
      'max_age=46',
      'min_age=30&max_age=20',
      'min_value=-1',
      'min_value=00.5',
      'min_value=.5',
      'min_value=10,5',
      'min_value=10.555',
      'min_value=1e2',
      'max_value=550.01',
      'min_value=20&max_value=10',
      'free=true&club_id=1',
      'club_id=abc',
      'club_id=0',
      'page=1&page=2',
    ])('?%s', async (query) => {
      expectRefusal(await listPlayers(`?${query}`), 400);
    });
  });
});
