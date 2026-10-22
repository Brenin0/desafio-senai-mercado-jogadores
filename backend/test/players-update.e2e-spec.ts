import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import { MEIA_LUA, strikerWithOverall } from './players.fixtures';
import { addToLineup, insertClub, signPlayer } from './records';

/**
 * Cadastro do cenário de 2.1.5: Davi Melo, atacante de 22 anos, com overall 72 e valor base
 * 10,00 + 12 × 2,00 = 34,00 (RN06).
 */
const DAVI_MELO = {
  name: 'Davi Melo',
  position: 'ATA',
  agility: 60,
  age: 22,
  pace: 70,
  shooting: 72,
  passing: 75,
  dribbling: 74,
  defending: 40,
  physical: 65,
  potential: 80,
};

/** A edição enviada pela tela em 2.1.5. */
const DAVI_MELO_EDIT = {
  name: 'Davi Melo',
  position: 'MEI',
  agility: 70,
  age: 23,
};

describe('Edição e alteração de condição de jogadores (2.1.4 e 2.1.5)', () => {
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

  async function createPlayer(body: object): Promise<number> {
    const response = await request(server()).post('/api/v1/players').send(body);
    expect(response.status).toBe(201);
    return (response.body as { id: number }).id;
  }

  const findPlayer = (id: number) =>
    request(server()).get(`/api/v1/players/${id}`);

  const editPlayer = (id: number | string, body: object) =>
    request(server()).put(`/api/v1/players/${id}`).send(body);

  const changeCondition = (id: number | string, body: object) =>
    request(server()).patch(`/api/v1/players/${id}/condition`).send(body);

  async function deletePlayer(id: number): Promise<void> {
    await prisma.player.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async function playerInClub(): Promise<number> {
    const playerId = await createPlayer(DAVI_MELO);
    const clubId = await insertClub(prisma, 'Águias FC', 'AGU');
    await signPlayer(prisma, playerId, clubId);
    return playerId;
  }

  describe('PUT /players/{id}', () => {
    it('200: aplica a edição de 2.1.5; o overall segue a posição nova e o valor base fica o do cadastro', async () => {
      const id = await createPlayer(DAVI_MELO);
      const before = await findPlayer(id);
      expect(before.body).toMatchObject({ overall: 72, base_value: 34 });

      const response = await editPlayer(id, DAVI_MELO_EDIT);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toEqual({
        ...(before.body as object),
        ...DAVI_MELO_EDIT,
        overall: 71,
        base_value: 34,
        market_value: 34,
      });
      await expect(findPlayer(id)).resolves.toMatchObject({
        body: response.body as object,
      });
    });

    it('V7 e RN08: ignora indicadores, potencial, valor base, clube e condição, sem validar', async () => {
      const id = await createPlayer(DAVI_MELO);

      const response = await editPlayer(id, {
        ...DAVI_MELO_EDIT,
        pace: 'abc',
        shooting: 99,
        potential: 0,
        base_value: 999,
        overall: 99,
        club_id: 7,
        condition: 'DOENTE',
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        pace: 70,
        shooting: 72,
        potential: 80,
        base_value: 34,
        club_id: null,
        condition: 'APTO',
      });
    });

    it('V4: grava o nome com os espaços normalizados', async () => {
      const id = await createPlayer(DAVI_MELO);

      const response = await editPlayer(id, {
        ...DAVI_MELO_EDIT,
        name: '  Davi   Melo Jr. ',
      });

      expect(response.body).toMatchObject({ name: 'Davi Melo Jr.' });
    });

    it.each([
      ['a mesma idade', 22],
      ['uma idade maior', 30],
    ])('200: aceita %s', async (_, age) => {
      const id = await createPlayer(DAVI_MELO);

      const response = await editPlayer(id, { ...DAVI_MELO_EDIT, age });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ age });
    });

    it('200: aceita levar a idade a 33 ou mais, sem mudar o potencial', async () => {
      const id = await createPlayer(DAVI_MELO);

      const response = await editPlayer(id, { ...DAVI_MELO_EDIT, age: 33 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ age: 33, potential: 80 });
    });

    it('200: jogador com clube pode editar mantendo a posição', async () => {
      const id = await playerInClub();

      const response = await editPlayer(id, {
        ...DAVI_MELO_EDIT,
        position: 'ATA',
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ position: 'ATA', agility: 70 });
    });

    describe('400, sem gravar nada', () => {
      let id: number;

      beforeEach(async () => {
        id = await createPlayer(DAVI_MELO);
      });

      afterEach(async () => {
        await expect(findPlayer(id)).resolves.toMatchObject({
          body: { name: 'Davi Melo', position: 'ATA', agility: 60, age: 22 },
        });
      });

      it.each(Object.keys(DAVI_MELO_EDIT))(
        'V6: recusa %s ausente',
        async (field) => {
          const body: Record<string, unknown> = { ...DAVI_MELO_EDIT };
          delete body[field];

          expectRefusal(await editPlayer(id, body), 400);
        },
      );

      it.each(Object.keys(DAVI_MELO_EDIT))(
        'V6: recusa %s nulo',
        async (field) => {
          expectRefusal(
            await editPlayer(id, { ...DAVI_MELO_EDIT, [field]: null }),
            400,
          );
        },
      );

      it.each([
        ['nome com 1 palavra', { name: 'Davi' }],
        ['nome com dígito', { name: 'Davi Melo 2' }],
        ['posição em minúsculas', { position: 'mei' }],
        ['agilidade como texto', { agility: '70' }],
        ['agilidade 101', { agility: 101 }],
        ['idade 46', { age: 46 }],
        ['idade fracionária', { age: 23.5 }],
        ['idade 35 com agilidade 86', { age: 35, agility: 86 }],
      ])('recusa %s', async (_, overrides) => {
        expectRefusal(
          await editPlayer(id, { ...DAVI_MELO_EDIT, ...overrides }),
          400,
        );
      });

      it('V1: recusa corpo que não é objeto', async () => {
        const response = await request(server())
          .put(`/api/v1/players/${id}`)
          .set('Content-Type', 'application/json')
          .send('[]');

        expectRefusal(response, 400);
      });
    });

    describe('404', () => {
      it('jogador inexistente', async () => {
        expectRefusal(await editPlayer(2147483647, DAVI_MELO_EDIT), 404);
      });

      it('jogador excluído (RN09)', async () => {
        const id = await createPlayer(DAVI_MELO);
        await deletePlayer(id);

        expectRefusal(await editPlayer(id, DAVI_MELO_EDIT), 404);
      });

      it.each(['abc', '0', '01', '2147483648'])(
        'V8: id %s, fora do formato',
        async (id) => {
          expectRefusal(await editPlayer(id, DAVI_MELO_EDIT), 404);
        },
      );
    });

    describe('409 (RN08), sem gravar nada', () => {
      it('idade menor que a atual', async () => {
        const id = await createPlayer(DAVI_MELO);

        expectRefusal(
          await editPlayer(id, { ...DAVI_MELO_EDIT, age: 21 }),
          409,
        );
        await expect(findPlayer(id)).resolves.toMatchObject({
          body: { position: 'ATA', age: 22 },
        });
      });

      it('mudança de posição de jogador com clube', async () => {
        const id = await playerInClub();

        expectRefusal(await editPlayer(id, DAVI_MELO_EDIT), 409);
        await expect(findPlayer(id)).resolves.toMatchObject({
          body: { position: 'ATA', agility: 60, age: 22 },
        });
      });
    });
  });

  describe('PATCH /players/{id}/condition', () => {
    it('200: o Meia Lua passa a MAL_CONDICIONADO e o valor de mercado cai de 40,00 para 37,00 (2.1.4)', async () => {
      const id = await createPlayer(MEIA_LUA);

      const response = await changeCondition(id, {
        condition: 'MAL_CONDICIONADO',
      });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toMatchObject({
        id,
        condition: 'MAL_CONDICIONADO',
        base_value: 40,
        market_value: 37,
      });
      await expect(findPlayer(id)).resolves.toMatchObject({
        body: { condition: 'MAL_CONDICIONADO', market_value: 37 },
      });
    });

    it.each([
      [['MAL_CONDICIONADO', 'DOENTE', 'MAL_CONDICIONADO', 'APTO']],
      [['DOENTE', 'MAL_CONDICIONADO']],
    ])('200: aceita a sequência %p', async (sequence) => {
      const id = await createPlayer(MEIA_LUA);

      for (const condition of sequence) {
        const response = await changeCondition(id, { condition });
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ condition });
      }
    });

    it.each(['APTO', 'DOENTE'])(
      '200: enviar a condição atual (%s) é aceito, sem mudança',
      async (condition) => {
        const id = await createPlayer(MEIA_LUA);
        if (condition !== 'APTO') {
          await changeCondition(id, { condition });
        }

        const response = await changeCondition(id, { condition });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ condition });
      },
    );

    it('V7: ignora campos de outros endpoints, como name', async () => {
      const id = await createPlayer(MEIA_LUA);

      const response = await changeCondition(id, {
        condition: 'DOENTE',
        name: 'Outro Nome',
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: 'Meia Lua',
        condition: 'DOENTE',
      });
    });

    it('RN19: o titular que passa a DOENTE sai da escalação na mesma operação', async () => {
      const id = await createPlayer(MEIA_LUA);
      const clubId = await insertClub(prisma, 'Águias FC', 'AGU');
      await signPlayer(prisma, id, clubId);
      await addToLineup(prisma, clubId, id);

      const response = await changeCondition(id, { condition: 'DOENTE' });

      expect(response.status).toBe(200);
      await expect(
        prisma.lineupPlayer.count({ where: { playerId: id } }),
      ).resolves.toBe(0);
    });

    it('RN19: o titular MAL_CONDICIONADO continua na escalação', async () => {
      const id = await createPlayer(MEIA_LUA);
      const clubId = await insertClub(prisma, 'Águias FC', 'AGU');
      await signPlayer(prisma, id, clubId);
      await addToLineup(prisma, clubId, id);

      await changeCondition(id, { condition: 'MAL_CONDICIONADO' });

      await expect(
        prisma.lineupPlayer.count({ where: { playerId: id } }),
      ).resolves.toBe(1);
    });

    it.each([
      ['ausente', {}],
      ['nula', { condition: null }],
      ['em minúsculas', { condition: 'apto' }],
      ['com caixa trocada', { condition: 'Doente' }],
      ['fora da lista', { condition: 'LESIONADO' }],
      ['numérica', { condition: 1 }],
    ])('400: recusa condição %s, sem gravar nada', async (_, body) => {
      const id = await createPlayer(MEIA_LUA);

      expectRefusal(await changeCondition(id, body), 400);
      await expect(findPlayer(id)).resolves.toMatchObject({
        body: { condition: 'APTO' },
      });
    });

    it('404: jogador inexistente', async () => {
      expectRefusal(
        await changeCondition(2147483647, { condition: 'APTO' }),
        404,
      );
    });

    it('404: jogador excluído (RN09)', async () => {
      const id = await createPlayer(MEIA_LUA);
      await deletePlayer(id);

      expectRefusal(await changeCondition(id, { condition: 'DOENTE' }), 404);
    });

    it.each(['abc', '-1', '1.5', '2147483648'])(
      'V8: 404 para o id %s, fora do formato',
      async (id) => {
        expectRefusal(await changeCondition(id, { condition: 'APTO' }), 404);
      },
    );

    it('409: de DOENTE direto para APTO, sem gravar nada', async () => {
      const id = await createPlayer(MEIA_LUA);
      await changeCondition(id, { condition: 'DOENTE' });

      expectRefusal(await changeCondition(id, { condition: 'APTO' }), 409);
      await expect(findPlayer(id)).resolves.toMatchObject({
        body: { condition: 'DOENTE' },
      });
    });
  });

  describe('RN02 a RN05 · valor de mercado pela condição, agilidade e idade', () => {
    /*
     * Valor base, overall e potencial do cadastro, condição, agilidade, idade e valor de mercado.
     * Potencial igual ao overall: o jovem promessa não muda o valor base (RN06).
     */
    it.each([
      [82, 82, 82, 'APTO', 20, 25, 82.0],
      [82, 82, 82, 'APTO', 50, 19, 90.2],
      [82, 82, 82, 'MAL_CONDICIONADO', 50, 25, 69.7],
      [82, 82, 82, 'MAL_CONDICIONADO', 80, 21, 84.05],
      [82, 82, 82, 'MAL_CONDICIONADO', 30, 33, 53.3],
      [82, 82, 82, 'DOENTE', 90, 25, 69.7],
      [82, 82, 82, 'DOENTE', 30, 25, 49.2],
      [82, 82, 82, 'DOENTE', 10, 40, 49.2],
      [9.5, 59, 59, 'MAL_CONDICIONADO', 85, 25, 8.79],
      [1.0, 40, 40, 'MAL_CONDICIONADO', 50, 35, 1.0],
      [114.0, 85, 99, 'APTO', 60, 20, 125.4],
      [88.0, 83, 88, 'MAL_CONDICIONADO', 85, 27, 81.4],
      [46.0, 76, 76, 'DOENTE', 20, 34, 27.6],
      [1.5, 43, 43, 'DOENTE', 50, 36, 1.0],
      [9.5, 59, 59, 'MAL_CONDICIONADO', 25, 22, 7.13],
    ])(
      'valor base %d, %s, agilidade %i, %i anos → %d',
      async (
        baseValue,
        overall,
        potential,
        condition,
        agility,
        age,
        marketValue,
      ) => {
        const id = await createPlayer({
          ...strikerWithOverall(overall, potential, age),
          agility,
        });
        if (condition !== 'APTO') {
          await changeCondition(id, { condition });
        }

        const response = await findPlayer(id);

        expect(response.body).toMatchObject({
          condition,
          base_value: baseValue,
          market_value: marketValue,
        });
      },
    );
  });
});
