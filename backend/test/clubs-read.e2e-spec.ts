import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import { MEIA_LUA, MEIA_LUA_RESPONSE } from './players.fixtures';
import { signPlayer } from './records';

/** Momento da compra do exemplo 2.3.1: 2026-11-02T10:15-03:00. */
const NOW = new Date('2026-11-02T13:15:00Z');
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

interface ClubItem {
  id: number;
  name: string;
}

interface ClubDetail {
  players: {
    name: string;
    contract: { remaining_days: number; penalty_rate: number };
  }[];
}

describe('Consulta de clubes (2.2 e 2.2.2, RN11)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp({ now: NOW });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function createClub(
    name: string,
    acronym: string,
    cash?: string,
  ): Promise<number> {
    const response = await request(server())
      .post('/api/v1/clubs')
      .send({ name, acronym });
    expect(response.status).toBe(201);
    const { id } = response.body as ClubItem;
    if (cash) {
      await prisma.club.update({ where: { id }, data: { cash } });
    }
    return id;
  }

  async function createPlayer(overrides: Record<string, unknown> = {}) {
    const response = await request(server())
      .post('/api/v1/players')
      .send({ ...MEIA_LUA, ...overrides });
    expect(response.status).toBe(201);
    return (response.body as { id: number }).id;
  }

  const changeCondition = (id: number, condition: string) =>
    request(server())
      .patch(`/api/v1/players/${id}/condition`)
      .send({ condition });

  async function signFor(
    playerId: number,
    clubId: number,
    loyaltyUntil = new Date(NOW.getTime() + 120 * DAY),
  ): Promise<void> {
    await signPlayer(prisma, playerId, clubId, {
      purchaseValue: '37.00',
      loyaltyUntil,
    });
  }

  const listClubs = (query = '') =>
    request(server()).get(`/api/v1/clubs${query}`);

  const findClub = (id: number | string) =>
    request(server()).get(`/api/v1/clubs/${id}`);

  describe('GET /clubs', () => {
    it('200: sem clubes, devolve um array vazio', async () => {
      const response = await listClubs();

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toEqual([]);
    });

    it('ordena pelo nome por padrão, com os campos mínimos e sem o elenco; "Águias FC" e "Aguias FC" empatam e seguem o id', async () => {
      await createClub('Gama SC', 'GSC');
      await createClub('Épsilon EC', 'EEC');
      await createClub('Delta FC', 'DFC');
      const aguiasComAcento = await createClub('Águias FC', 'AGU');
      await createClub('Aguias FC', 'AFC');

      const response = await listClubs();

      expect(response.status).toBe(200);
      expect((response.body as ClubItem[]).map(({ name }) => name)).toEqual([
        'Águias FC',
        'Aguias FC',
        'Delta FC',
        'Épsilon EC',
        'Gama SC',
      ]);
      expect((response.body as ClubItem[])[0]).toEqual({
        id: aguiasComAcento,
        name: 'Águias FC',
        acronym: 'AGU',
        cash: 300,
        squad_value: 0,
        net_worth: 300,
      });
      await expect(listClubs('?sort=name')).resolves.toMatchObject({
        body: response.body as object,
      });
    });

    describe('pelo patrimônio calculado, com empate pelo nome', () => {
      /*
       * Águias FC: caixa 300,00, sem elenco → 300,00. Gama SC: 260,00 + Meia Lua APTO (40,00) →
       * 300,00. Delta FC: 261,15 + Meia Lua MAL_CONDICIONADO (37,00) → 298,15. Épsilon EC:
       * 298,15, sem elenco → 298,15.
       */
      beforeEach(async () => {
        await createClub('Águias FC', 'AGU');
        const gama = await createClub('Gama SC', 'GSC', '260.00');
        await signFor(await createPlayer({ name: 'Gama Lua' }), gama);
        const delta = await createClub('Delta FC', 'DFC', '261.15');
        const sick = await createPlayer({ name: 'Delta Lua' });
        await changeCondition(sick, 'MAL_CONDICIONADO');
        await signFor(sick, delta);
        await createClub('Épsilon EC', 'EEC', '298.15');
      });

      it('net_worth_desc', async () => {
        const response = await listClubs('?sort=net_worth_desc');

        expect(response.status).toBe(200);
        expect((response.body as ClubItem[]).map(({ name }) => name)).toEqual([
          'Águias FC',
          'Gama SC',
          'Delta FC',
          'Épsilon EC',
        ]);
        expect((response.body as ClubItem[])[2]).toMatchObject({
          cash: 261.15,
          squad_value: 37,
          net_worth: 298.15,
        });
      });

      it('net_worth_asc', async () => {
        const response = await listClubs('?sort=net_worth_asc');

        expect((response.body as ClubItem[]).map(({ name }) => name)).toEqual([
          'Delta FC',
          'Épsilon EC',
          'Águias FC',
          'Gama SC',
        ]);
      });
    });

    it.each([
      'sort=NET_WORTH_DESC',
      'sort=net_worth',
      'sort=name,net_worth_desc',
      'sort=value_desc',
      'sort=',
    ])('400: ?%s', async (query) => {
      expectRefusal(await listClubs(`?${query}`), 400);
    });
  });

  describe('GET /clubs/{id}', () => {
    it('200: o exemplo de 2.2.2, logo depois da compra do Meia Lua (120 dias e 10%)', async () => {
      const clubId = await createClub('Águias FC', 'AGU', '261.15');
      const playerId = await createPlayer();
      await changeCondition(playerId, 'MAL_CONDICIONADO');
      await signFor(playerId, clubId, new Date('2027-03-02T13:15:00Z'));

      const response = await findClub(clubId);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toEqual({
        id: clubId,
        name: 'Águias FC',
        acronym: 'AGU',
        cash: 261.15,
        squad_value: 37,
        net_worth: 298.15,
        players: [
          {
            ...MEIA_LUA_RESPONSE,
            id: playerId,
            condition: 'MAL_CONDICIONADO',
            market_value: 37,
            club_id: clubId,
            contract: {
              purchase_value: 37,
              loyalty_until: '2027-03-02T10:15:00-03:00',
              remaining_days: 120,
              penalty_rate: 10,
            },
          },
        ],
      });
    });

    it('200: clube sem jogadores tem o elenco vazio', async () => {
      const clubId = await createClub('Águias FC', 'AGU');

      const response = await findClub(clubId);

      expect(response.body).toMatchObject({
        squad_value: 0,
        net_worth: 300,
        players: [],
      });
    });

    it('RN11: elenco por posição (GOL, ZAG, LAT, MEI, ATA), depois pelo nome e depois pelo id', async () => {
      const clubId = await createClub('Águias FC', 'AGU');
      const squad: [string, string][] = [
        ['Otto Rangel', 'ATA'],
        ['Lauro Neves', 'MEI'],
        ['Téo Brandão', 'ZAG'],
        ['Davi Lins', 'LAT'],
        ['Ana Brandão', 'ZAG'],
        ['Rui Prado', 'GOL'],
        ['Ana Brandão', 'ZAG'],
      ];
      const ids: number[] = [];
      for (const [name, position] of squad) {
        const id = await createPlayer({ name, position });
        await signFor(id, clubId);
        ids.push(id);
      }

      const response = await findClub(clubId);

      expect(
        (response.body as { players: { id: number }[] }).players.map(
          ({ id }) => id,
        ),
      ).toEqual([ids[5], ids[4], ids[6], ids[2], ids[3], ids[1], ids[0]]);
    });

    it('RN11 e RN15: dias restantes para cima e percentual de multa de cada contrato, no momento da consulta', async () => {
      const clubId = await createClub('Águias FC', 'AGU');
      const contracts: [string, number][] = [
        ['Ana Lima', 365 * DAY + MINUTE],
        ['Bia Lima', 60 * DAY + HOUR],
        ['Caio Lima', 16 * DAY + MINUTE],
        ['Davi Lima', -MINUTE],
        ['Eva Lima', 0],
        ['Fabio Lima', 30 * DAY],
        ['Gil Lima', 30 * DAY + MINUTE],
        ['Hugo Lima', 180 * DAY],
        ['Ivo Lima', 180 * DAY + MINUTE],
      ];
      for (const [name, untilEnd] of contracts) {
        await signFor(
          await createPlayer({ name }),
          clubId,
          new Date(NOW.getTime() + untilEnd),
        );
      }

      const response = await findClub(clubId);

      expect(
        (response.body as ClubDetail).players.map(({ name, contract }) => [
          name,
          contract.remaining_days,
          contract.penalty_rate,
        ]),
      ).toEqual([
        ['Ana Lima', 366, 20],
        ['Bia Lima', 61, 10],
        ['Caio Lima', 17, 5],
        ['Davi Lima', 0, 0],
        ['Eva Lima', 0, 0],
        ['Fabio Lima', 30, 5],
        ['Gil Lima', 31, 10],
        ['Hugo Lima', 180, 10],
        ['Ivo Lima', 181, 20],
      ]);
    });

    it('404: clube inexistente', async () => {
      expectRefusal(await findClub(2147483647), 404);
    });

    it.each(['abc', '0', '-1', '1.5', '01', '+1', '2147483648'])(
      'V8: 404 para o id %s, fora do formato',
      async (id) => {
        expectRefusal(await findClub(id), 404);
      },
    );
  });
});
