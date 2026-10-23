import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { formatBrasiliaDateTime } from '../src/domain/datetime';
import { PrismaService } from '../src/prisma/prisma.service';
import { StarterSpec, starterBody } from './league.fixtures';
import { MEIA_LUA } from './players.fixtures';

/** Data e hora no formato de entrada da RN01 (sem os segundos): AAAA-MM-DDTHH:MM-03:00. */
export function toDateTimeInput(date: Date): string {
  return formatBrasiliaDateTime(date).replace(/:\d{2}-03:00$/, '-03:00');
}

const DAY = 24 * 60 * 60 * 1000;

/** Clube com a escalação completa e os ids dos titulares, na ordem em que foram cadastrados. */
export interface TeamWithLineup {
  clubId: number;
  ids: number[];
}

/** Pedidos usados pelos testes do mercado e da liga, com os ajustes de valor feitos direto no banco. */
export function apiClient(app: NestExpressApplication) {
  const server = () => app.getHttpServer();
  const prisma = app.get(PrismaService);

  /** Cadastra a partir do Meia Lua (APTO e 25 anos: valor de mercado igual ao valor base). */
  async function createPlayer(
    overrides: Record<string, unknown> = {},
  ): Promise<number> {
    const response = await request(server())
      .post('/api/v1/players')
      .send({ ...MEIA_LUA, ...overrides });
    expect(response.status).toBe(201);
    return (response.body as { id: number }).id;
  }

  async function createClub(
    name: string,
    acronym: string,
    cash?: string,
  ): Promise<number> {
    const response = await request(server())
      .post('/api/v1/clubs')
      .send({ name, acronym });
    expect(response.status).toBe(201);
    const { id } = response.body as { id: number };
    if (cash) {
      await prisma.club.update({ where: { id }, data: { cash } });
    }
    return id;
  }

  /** Cadastra o jogador e o compra para o clube, com 1 ano de fidelidade a partir de `now`. */
  async function signPlayer(
    clubId: number,
    body: Record<string, unknown>,
    now: Date,
  ): Promise<number> {
    const playerId = await createPlayer(body);
    const response = await request(server())
      .post(`/api/v1/players/${playerId}/buy`)
      .send({
        club_id: clubId,
        loyalty_until: toDateTimeInput(new Date(now.getTime() + 365 * DAY)),
      });
    expect(response.status).toBe(200);
    return playerId;
  }

  return {
    createPlayer,
    createClub,
    signPlayer,

    /** Cria o clube, compra os titulares e escala os 5 na formação. */
    async createClubWithLineup(
      name: string,
      acronym: string,
      starters: StarterSpec[],
      now: Date,
      formation = '2-1-1',
    ): Promise<TeamWithLineup> {
      const clubId = await createClub(name, acronym);
      const ids: number[] = [];
      for (const starter of starters) {
        const body = starterBody(
          starter.name,
          starter.position,
          starter.values,
        );
        ids.push(await signPlayer(clubId, body, now));
      }
      const response = await request(server())
        .put(`/api/v1/clubs/${clubId}/lineup`)
        .send({ formation, player_ids: ids });
      expect(response.status).toBe(200);
      return { clubId, ids };
    },

    /** Valor base exato, para chegar aos valores de mercado das tabelas do enunciado. */
    async setBaseValue(playerId: number, baseValue: string): Promise<void> {
      await prisma.player.update({
        where: { id: playerId },
        data: { baseValue },
      });
    },

    changeCondition: (playerId: number, condition: string) =>
      request(server())
        .patch(`/api/v1/players/${playerId}/condition`)
        .send({ condition }),

    buy: (playerId: number | string, body: object) =>
      request(server()).post(`/api/v1/players/${playerId}/buy`).send(body),

    sell: (playerId: number | string) =>
      request(server()).post(`/api/v1/players/${playerId}/sell`),

    deletePlayer: (playerId: number) =>
      request(server()).delete(`/api/v1/players/${playerId}`),

    editPlayer: (playerId: number, body: object) =>
      request(server()).put(`/api/v1/players/${playerId}`).send(body),

    history: (clubId: number | string, query = '') =>
      request(server()).get(`/api/v1/clubs/${clubId}/transactions${query}`),

    findPlayer: (playerId: number) =>
      request(server()).get(`/api/v1/players/${playerId}`),

    findClub: (clubId: number) =>
      request(server()).get(`/api/v1/clubs/${clubId}`),

    setLineup: (clubId: number | string, body: object) =>
      request(server()).put(`/api/v1/clubs/${clubId}/lineup`).send(body),

    findLineup: (clubId: number | string) =>
      request(server()).get(`/api/v1/clubs/${clubId}/lineup`),

    playMatch: (body: object) =>
      request(server()).post('/api/v1/matches').send(body),

    findMatch: (matchId: number | string) =>
      request(server()).get(`/api/v1/matches/${matchId}`),

    listMatches: (query = '') =>
      request(server()).get(`/api/v1/matches${query}`),

    standings: () => request(server()).get('/api/v1/standings'),
  };
}
