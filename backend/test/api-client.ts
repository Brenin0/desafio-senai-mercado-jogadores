import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { formatBrasiliaDateTime } from '../src/domain/datetime';
import { PrismaService } from '../src/prisma/prisma.service';
import { MEIA_LUA } from './players.fixtures';

/** Data e hora no formato de entrada da RN01 (sem os segundos): AAAA-MM-DDTHH:MM-03:00. */
export function toDateTimeInput(date: Date): string {
  return formatBrasiliaDateTime(date).replace(/:\d{2}-03:00$/, '-03:00');
}

/** Pedidos usados pelos testes do mercado, com os ajustes de valor feitos direto no banco. */
export function apiClient(app: NestExpressApplication) {
  const server = () => app.getHttpServer();
  const prisma = app.get(PrismaService);

  return {
    /** Cadastra a partir do Meia Lua (APTO e 25 anos: valor de mercado igual ao valor base). */
    async createPlayer(
      overrides: Record<string, unknown> = {},
    ): Promise<number> {
      const response = await request(server())
        .post('/api/v1/players')
        .send({ ...MEIA_LUA, ...overrides });
      expect(response.status).toBe(201);
      return (response.body as { id: number }).id;
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
  };
}
