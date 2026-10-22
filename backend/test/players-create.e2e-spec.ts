import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import {
  MEIA_LUA,
  MEIA_LUA_RESPONSE,
  strikerWithOverall,
} from './players.fixtures';

describe('Cadastro e consulta de jogadores (2.1.2 e 2.1.3)', () => {
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

  const createPlayer = (body: object) =>
    request(app.getHttpServer()).post('/api/v1/players').send(body);

  const postRaw = (body: string) =>
    request(app.getHttpServer())
      .post('/api/v1/players')
      .set('Content-Type', 'application/json')
      .send(body);

  const findPlayer = (id: number | string) =>
    request(app.getHttpServer()).get(`/api/v1/players/${id}`);

  describe('POST /players → 201', () => {
    it('cadastra o Meia Lua livre e APTO, com Location e os campos de 2.1.3', async () => {
      const response = await createPlayer(MEIA_LUA);

      expect(response.status).toBe(201);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toEqual({
        id: expect.any(Number) as number,
        ...MEIA_LUA_RESPONSE,
      });
      const { id } = response.body as { id: number };
      expect(response.headers.location).toBe(`/api/v1/players/${id}`);
    });

    it('V7: ignora os campos calculados ou controlados pelo sistema e os desconhecidos', async () => {
      const response = await createPlayer({
        ...MEIA_LUA,
        id: 999,
        base_value: 500,
        market_value: 500,
        overall: 99,
        club_id: 1,
        condition: 'DOENTE',
        cash: 1000,
        apelido: 'Lua',
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(MEIA_LUA_RESPONSE);
      expect((response.body as { id: number }).id).not.toBe(999);
    });

    it('V4: grava o nome com os espaços normalizados', async () => {
      const response = await createPlayer({
        ...MEIA_LUA,
        name: '  Meia   Zeta ',
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ name: 'Meia Zeta' });
    });

    it('V2: aceita 50.0 como o inteiro 50', async () => {
      const response = await postRaw(
        JSON.stringify({ ...MEIA_LUA, agility: 1 }).replace(
          '"agility":1',
          '"agility":50.0',
        ),
      );

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ agility: 50 });
    });

    it.each([
      ['nome com 3 caracteres e 2 palavras', { name: 'A B' }],
      ['nome com 100 caracteres', { name: `Ana ${'b'.repeat(96)}` }],
      ['nome com aspas', { name: 'Zé "Foguete" Lima' }],
      ['nome com ponto e vírgula', { name: 'Ana;Lima Souza' }],
      ['agilidade 1', { agility: 1 }],
      ['agilidade 100', { agility: 100 }],
      ['idade 16', { age: 16 }],
      [
        'idade 45 com agilidade 85 e potencial igual ao maior atributo',
        { age: 45, potential: 82 },
      ],
      ['atributo 1', { pace: 1 }],
      ['atributo 99 com potencial 99', { pace: 99, potential: 99 }],
      ['potencial igual ao maior atributo', { potential: 82 }],
      ['potencial 99', { potential: 99 }],
      ['idade 35 com agilidade 85', { age: 35, potential: 82 }],
      ['idade 34 com agilidade 100', { age: 34, agility: 100, potential: 82 }],
      [
        'idade 33 com potencial igual ao maior atributo',
        { age: 33, potential: 82 },
      ],
      [
        'idade 32 com potencial acima do maior atributo',
        { age: 32, potential: 86 },
      ],
    ])('Limites: aceita %s', async (_, overrides) => {
      const response = await createPlayer({ ...MEIA_LUA, ...overrides });

      expect(response.status).toBe(201);
    });

    it('Limites: aceita a soma dos seis atributos igual a 480', async () => {
      const response = await createPlayer(strikerWithOverall(80, 80, 25, 80));

      expect(response.status).toBe(201);
    });
  });

  describe('RN06 · overall pelos pesos da posição', () => {
    it.each([
      ['MEI', [68, 65, 80, 78, 52, 60], 73],
      ['ATA', [78, 75, 73, 82, 48, 68], 76],
      ['LAT', [72, 70, 78, 76, 70, 66], 72],
      ['ZAG', [50, 90, 60, 40, 80, 75], 73],
      ['GOL', [55, 30, 65, 40, 72, 68], 68],
      ['ZAG', [60, 30, 55, 40, 81, 77], 74],
      ['ATA', [80, 77, 60, 74, 30, 70], 75],
      ['LAT', [60, 40, 60, 60, 62, 60], 61],
    ])(
      '%s com atributos %p → overall %i',
      async (position, values, overall) => {
        const [pace, shooting, passing, dribbling, defending, physical] =
          values;
        const response = await createPlayer({
          ...MEIA_LUA,
          position,
          pace,
          shooting,
          passing,
          dribbling,
          defending,
          physical,
          potential: Math.max(...values),
        });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({ overall });
      },
    );
  });

  describe('RN06 · valor base calculado no cadastro', () => {
    it.each([
      [75, 86, 25, 40.0, 40.0],
      [60, 70, 30, 10.0, 10.0],
      [61, 70, 30, 12.0, 12.0],
      [76, 80, 22, 46.0, 46.0],
      [85, 92, 27, 100.0, 100.0],
      [70, 84, 21, 34.2, 37.62],
      [70, 84, 22, 30.0, 30.0],
      [45, 90, 18, 3.63, 3.99],
      [85, 99, 20, 114.0, 125.4],
      [83, 88, 27, 88.0, 88.0],
    ])(
      'overall %i, potencial %i e %i anos → valor base %d (valor de mercado %d)',
      async (overall, potential, age, baseValue, marketValue) => {
        const response = await createPlayer(
          strikerWithOverall(overall, potential, age),
        );

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          overall,
          base_value: baseValue,
          market_value: marketValue,
        });
      },
    );

    it.each([
      [40, 66, 36, 1.0, 1.0],
      [43, 55, 36, 1.5, 1.35],
    ])(
      'overall %i, potencial %i e %i anos (potencial igual ao maior atributo) → valor base %d (valor de mercado %d)',
      async (overall, potential, age, baseValue, marketValue) => {
        const response = await createPlayer(
          strikerWithOverall(overall, potential, age, potential),
        );

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          overall,
          base_value: baseValue,
          market_value: marketValue,
        });
      },
    );
  });

  describe('POST /players → 400, sem gravar nada', () => {
    afterEach(async () => {
      await expect(prisma.player.count()).resolves.toBe(0);
    });

    it.each([
      ['JSON malformado', '{"name": }'],
      ['array', '[]'],
      ['texto', '"x"'],
      ['número', '10'],
      ['null', 'null'],
    ])('V1: recusa corpo que é %s', async (_, body) => {
      expectRefusal(await postRaw(body), 400);
    });

    it.each([
      ['agility como texto', { agility: '15' }],
      ['age fracionária', { age: 50.5 }],
      ['pace booleano', { pace: true }],
      ['name numérico', { name: 123 }],
      ['position numérica', { position: 1 }],
      ['nome com 2 caracteres', { name: 'AB' }],
      ['nome com 1 palavra', { name: 'Pelé' }],
      ['nome com 101 caracteres', { name: `Ana ${'b'.repeat(97)}` }],
      ['nome com dígito', { name: 'Meia Lua 2' }],
      ['nome com tabulação', { name: 'Meia\tLua' }],
      ['nome com quebra de linha', { name: 'Meia\nLua' }],
      ['nome que fica vazio depois da V4', { name: '    ' }],
      ['posição em minúsculas', { position: 'ata' }],
      ['posição fora da lista', { position: 'Mei' }],
      ['agilidade 0', { agility: 0 }],
      ['agilidade 101', { agility: 101 }],
      ['idade 15', { age: 15 }],
      ['idade 46', { age: 46 }],
      ['atributo 0', { shooting: 0 }],
      ['atributo 100', { dribbling: 100, potential: 99 }],
      ['potencial 0', { potential: 0 }],
      ['potencial 100', { potential: 100 }],
      ['potencial abaixo do maior atributo', { potential: 81 }],
      ['idade 35 com agilidade 86', { age: 35, agility: 86, potential: 82 }],
      [
        'idade 33 com potencial acima do maior atributo',
        { age: 33, potential: 83 },
      ],
    ])('recusa %s', async (_, overrides) => {
      expectRefusal(await createPlayer({ ...MEIA_LUA, ...overrides }), 400);
    });

    it('recusa a soma dos seis atributos acima de 480', async () => {
      expectRefusal(
        await createPlayer(strikerWithOverall(80, 81, 25, 81)),
        400,
      );
    });

    it.each(Object.keys(MEIA_LUA))('V6: recusa %s ausente', async (field) => {
      const body: Record<string, unknown> = { ...MEIA_LUA };
      delete body[field];

      expectRefusal(await createPlayer(body), 400);
    });

    it.each(Object.keys(MEIA_LUA))('V6: recusa %s nulo', async (field) => {
      expectRefusal(await createPlayer({ ...MEIA_LUA, [field]: null }), 400);
    });

    it('recusa o campo obrigatório enviado fora do snake_case (Agility)', async () => {
      const body: Record<string, unknown> = { ...MEIA_LUA, Agility: 85 };
      delete body.agility;

      expectRefusal(await createPlayer(body), 400);
    });
  });

  describe('GET /players/{id}', () => {
    it('200: devolve o jogador no formato de 2.1.2', async () => {
      const created = await createPlayer(MEIA_LUA);
      const { id } = created.body as { id: number };

      const response = await findPlayer(id);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toEqual({ id, ...MEIA_LUA_RESPONSE });
    });

    it('404: jogador inexistente', async () => {
      expectRefusal(await findPlayer(2147483647), 404);
    });

    it('404: jogador excluído (RN09)', async () => {
      const created = await createPlayer(MEIA_LUA);
      const { id } = created.body as { id: number };
      await prisma.player.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      expectRefusal(await findPlayer(id), 404);
    });

    it.each(['abc', '0', '-1', '1.5', '01', '+1', '2147483648'])(
      'V8: 404 para o id %s, fora do formato',
      async (id) => {
        expectRefusal(await findPlayer(id), 404);
      },
    );
  });
});
