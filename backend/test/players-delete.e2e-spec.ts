import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import { MEIA_LUA } from './players.fixtures';
import { insertClub, signPlayer } from './records';
import { TestClock } from './test-clock';

/** 2026-11-05T16:40-03:00 */
const NOW = new Date('2026-11-05T19:40:00Z');

describe('Exclusão lógica de jogadores (2.1.6, RN09)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp({ clock: new TestClock(NOW) });
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function createPlayer(): Promise<number> {
    const response = await request(server())
      .post('/api/v1/players')
      .send(MEIA_LUA);
    return (response.body as { id: number }).id;
  }

  const deletePlayer = (id: number | string) =>
    request(server()).delete(`/api/v1/players/${id}`);

  it('204: exclui o jogador livre, sem corpo, e grava o momento da exclusão sem apagar nada', async () => {
    const id = await createPlayer();

    const response = await deletePlayer(id);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
    expect(response.headers['content-type']).toBeUndefined();
    await expect(
      prisma.player.findUnique({ where: { id }, select: { deletedAt: true } }),
    ).resolves.toEqual({ deletedAt: NOW });
  });

  it('V1: ignora o corpo enviado ao DELETE', async () => {
    const id = await createPlayer();

    const response = await request(server())
      .delete(`/api/v1/players/${id}`)
      .set('Content-Type', 'application/json')
      .send('[]');

    expect(response.status).toBe(204);
  });

  describe('depois da exclusão, o jogador conta como inexistente (404)', () => {
    let id: number;

    beforeEach(async () => {
      id = await createPlayer();
      await deletePlayer(id);
    });

    it('na consulta', async () => {
      expectRefusal(await request(server()).get(`/api/v1/players/${id}`), 404);
    });

    it('na edição', async () => {
      const response = await request(server())
        .put(`/api/v1/players/${id}`)
        .send({ name: 'Meia Lua', position: 'MEI', agility: 85, age: 25 });

      expectRefusal(response, 404);
    });

    it('na alteração de condição', async () => {
      const response = await request(server())
        .patch(`/api/v1/players/${id}/condition`)
        .send({ condition: 'DOENTE' });

      expectRefusal(response, 404);
    });

    it('numa nova exclusão', async () => {
      expectRefusal(await deletePlayer(id), 404);
    });
  });

  it('404: jogador inexistente', async () => {
    expectRefusal(await deletePlayer(2147483647), 404);
  });

  it.each(['abc', '0', '-1', '1.5', '01', '+1', '2147483648'])(
    'V8: 404 para o id %s, fora do formato',
    async (id) => {
      expectRefusal(await deletePlayer(id), 404);
    },
  );

  it('409: jogador no elenco de um clube, sem gravar nada', async () => {
    const id = await createPlayer();
    const clubId = await insertClub(prisma, 'Águias FC', 'AGU');
    await signPlayer(prisma, id, clubId);

    expectRefusal(await deletePlayer(id), 409);
    await expect(
      prisma.player.findUnique({ where: { id }, select: { deletedAt: true } }),
    ).resolves.toEqual({ deletedAt: null });
  });
});
