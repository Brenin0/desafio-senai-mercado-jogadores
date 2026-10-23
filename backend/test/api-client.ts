import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { formatBrasiliaDateTime } from '../src/domain/datetime';
import { PrismaService } from '../src/prisma/prisma.service';
import { MEIA_LUA } from './players.fixtures';

/** Data e hora no formato de entrada da RN01 (sem os segundos): AAAA-MM-DDTHH:MM-03:00. */
export function toDateTimeInput(date: Date): string {
  return formatBrasiliaDateTime(date).replace(/:\d{2}-03:00$/, '-03:00');
}

const DAY = 24 * 60 * 60 * 1000;

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

  return {
    createPlayer,

    /** Cadastra o jogador e o compra para o clube, com 1 ano de fidelidade a partir de `now`. */
    async signPlayer(
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
    },

    /** Valor base exato, para chegar aos valores de mercado das tabelas do enunciado. */
    async setBaseValue(playerId: number, baseValue: string): Promise<void> {
      await prisma.player.update({
        where: { id: playerId },
        data: { baseValue },
      });
    },

    async createClub(
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
  };
}
