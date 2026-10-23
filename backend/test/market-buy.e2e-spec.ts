import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { apiClient, toDateTimeInput } from './api-client';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import { TestClock } from './test-clock';

/** Momento da compra de 2.3.1: 2026-11-02T10:15-03:00. */
const NOW = new Date('2026-11-02T13:15:00Z');
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const LOYALTY_UNTIL = '2027-03-02T10:15-03:00';

describe('Compra de jogadores (2.3.1, RN12 a RN14)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let api: ReturnType<typeof apiClient>;

  beforeAll(async () => {
    app = await createTestApp({ clock: new TestClock(NOW) });
    prisma = app.get(PrismaService);
    api = apiClient(app);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const buy = (
    playerId: number | string,
    clubId: unknown,
    loyaltyUntil: unknown = LOYALTY_UNTIL,
  ) => api.buy(playerId, { club_id: clubId, loyalty_until: loyaltyUntil });

  /** Nenhuma recusa grava: caixa, elenco, contrato e transação continuam como estavam. */
  async function expectNothingRecorded(
    clubId: number,
    playerId: number,
    cash: number,
  ): Promise<void> {
    await expect(api.findClub(clubId)).resolves.toMatchObject({
      body: { cash, players: [] },
    });
    await expect(api.findPlayer(playerId)).resolves.toMatchObject({
      body: { club_id: null },
    });
    await expect(prisma.contract.count()).resolves.toBe(0);
    await expect(prisma.transaction.count()).resolves.toBe(0);
  }

  it('200: o Águias FC compra o Meia Lua MAL_CONDICIONADO por 37,00 + 1,85 de taxa (2.3.1)', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const playerId = await api.createPlayer();
    await api.changeCondition(playerId, 'MAL_CONDICIONADO');

    const response = await buy(playerId, clubId);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({
      id: expect.any(Number) as number,
      club_id: clubId,
      player_id: playerId,
      player_name: 'Meia Lua',
      type: 'COMPRA',
      value: 37,
      fee: 1.85,
      penalty: 0,
      profit: null,
      cash_change: -38.85,
      created_at: '2026-11-02T10:15:00-03:00',
      contract: {
        purchase_value: 37,
        loyalty_until: '2027-03-02T10:15:00-03:00',
        status: 'ATIVO',
      },
      club_cash: 261.15,
    });
  });

  it('RN12: numa única operação, desconta o caixa, põe o jogador no elenco, cria o contrato ATIVO e grava a COMPRA', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const playerId = await api.createPlayer();

    await buy(playerId, clubId);

    await expect(api.findPlayer(playerId)).resolves.toMatchObject({
      body: { club_id: clubId },
    });
    await expect(api.findClub(clubId)).resolves.toMatchObject({
      body: { cash: 258, players: [{ id: playerId }] },
    });
    const contracts = await prisma.contract.findMany();
    expect(
      contracts.map(({ purchaseValue, ...contract }) => ({
        ...contract,
        purchaseValue: purchaseValue.toNumber(),
      })),
    ).toEqual([
      {
        id: expect.any(Number) as number,
        playerId,
        clubId,
        purchaseValue: 40,
        loyaltyUntil: new Date('2027-03-02T13:15:00Z'),
        status: 'ATIVO',
        startedAt: NOW,
        endedAt: null,
      },
    ]);
    const [transaction] = await prisma.transaction.findMany();
    expect(transaction).toMatchObject({
      clubId,
      playerId,
      playerName: 'Meia Lua',
      type: 'COMPRA',
      createdAt: NOW,
    });
    expect(transaction.cashChange.toString()).toBe('-42');
  });

  it('RN12: o preço é o valor de mercado do momento, nunca o valor base', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const playerId = await api.createPlayer();
    await api.setBaseValue(playerId, '100.00');
    await api.changeCondition(playerId, 'DOENTE');

    const response = await buy(playerId, clubId);

    expect(response.body).toMatchObject({
      value: 85,
      fee: 4.25,
      cash_change: -89.25,
      contract: { purchase_value: 85 },
      club_cash: 210.75,
    });
  });

  it('V7: ignora campos que a compra não recebe', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const playerId = await api.createPlayer();

    const response = await api.buy(playerId, {
      club_id: clubId,
      loyalty_until: LOYALTY_UNTIL,
      value: 1,
      fee: 0,
      cash: 9999,
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ value: 40, fee: 2 });
  });

  describe('RN13: taxa de 5% acima de 30,00 e custo até 50% do caixa, sem arredondar o limite', () => {
    it.each([
      ['300.00', '28.00', 0, -28, 272],
      ['300.00', '30.00', 0, -30, 270],
      ['300.00', '30.01', 1.5, -31.51, 268.49],
      ['100.00', '47.62', 2.38, -50, 50],
      ['261.15', '124.35', 6.22, -130.57, 130.58],
      ['189.41', '90.19', 4.51, -94.7, 94.71],
    ])(
      'caixa %s e valor %s → aceita: taxa %d, variação %d, caixa %d',
      async (cash, value, fee, cashChange, clubCash) => {
        const clubId = await api.createClub('Águias FC', 'AGU', cash);
        const playerId = await api.createPlayer();
        await api.setBaseValue(playerId, value);

        const response = await buy(playerId, clubId);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          value: Number(value),
          fee,
          cash_change: cashChange,
          club_cash: clubCash,
        });
      },
    );

    it.each([
      ['100.00', '48.00', 'custo 50,40 acima do limite de 50,00'],
      ['261.15', '124.36', 'custo 130,58 acima do limite de 130,575'],
      ['189.41', '90.20', 'custo 94,71 acima do limite de 94,705 (ficha)'],
    ])(
      'caixa %s e valor %s → 409: %s, sem gravar nada',
      async (cash, value) => {
        const clubId = await api.createClub('Águias FC', 'AGU', cash);
        const playerId = await api.createPlayer();
        await api.setBaseValue(playerId, value);

        expectRefusal(await buy(playerId, clubId), 409);
        await expectNothingRecorded(clubId, playerId, Number(cash));
      },
    );
  });

  describe('B11: compra recusada, sem gravar nada', () => {
    it('409: jogador que já está no elenco de outro clube', async () => {
      const ownerId = await api.createClub('Águias FC', 'AGU');
      const buyerId = await api.createClub('Delta FC', 'DFC');
      const playerId = await api.createPlayer();
      await buy(playerId, ownerId);

      expectRefusal(await buy(playerId, buyerId), 409);
      await expect(api.findClub(buyerId)).resolves.toMatchObject({
        body: { cash: 300, players: [] },
      });
      await expect(prisma.transaction.count()).resolves.toBe(1);
    });

    it('409 (RN14): a 13ª compra de um clube com 12 jogadores', async () => {
      const clubId = await api.createClub('Águias FC', 'AGU');
      for (let index = 0; index < 12; index++) {
        const playerId = await api.createPlayer();
        await api.setBaseValue(playerId, '1.00');
        expect((await buy(playerId, clubId)).status).toBe(200);
      }
      const thirteenth = await api.createPlayer();
      await api.setBaseValue(thirteenth, '1.00');

      expectRefusal(await buy(thirteenth, clubId), 409);
      await expect(api.findPlayer(thirteenth)).resolves.toMatchObject({
        body: { club_id: null },
      });
      await expect(prisma.transaction.count()).resolves.toBe(12);
    });

    it('404: jogador excluído (RN09)', async () => {
      const clubId = await api.createClub('Águias FC', 'AGU');
      const playerId = await api.createPlayer();
      await request(app.getHttpServer()).delete(`/api/v1/players/${playerId}`);

      expectRefusal(await buy(playerId, clubId), 404);
      await expect(prisma.transaction.count()).resolves.toBe(0);
    });

    it('404: jogador inexistente', async () => {
      const clubId = await api.createClub('Águias FC', 'AGU');

      expectRefusal(await buy(2147483647, clubId), 404);
    });

    it.each(['abc', '0', '-1', '1.5', '01', '2147483648'])(
      'V8: 404 para o id %s, fora do formato',
      async (id) => {
        const clubId = await api.createClub('Águias FC', 'AGU');

        expectRefusal(await buy(id, clubId), 404);
      },
    );

    it('404: club_id de clube inexistente', async () => {
      const playerId = await api.createPlayer();

      expectRefusal(await buy(playerId, 2147483647), 404);
      await expect(api.findPlayer(playerId)).resolves.toMatchObject({
        body: { club_id: null },
      });
    });

    it.each([
      ['ausente', undefined],
      ['nulo', null],
      ['0', 0],
      ['negativo', -1],
      ['texto', '1'],
      ['fracionário', 1.5],
    ])('400: club_id %s', async (_, clubId) => {
      const realClubId = await api.createClub('Águias FC', 'AGU');
      const playerId = await api.createPlayer();

      expectRefusal(await buy(playerId, clubId), 400);
      await expectNothingRecorded(realClubId, playerId, 300);
    });

    it('V1: 400 para corpo que não é objeto', async () => {
      const playerId = await api.createPlayer();

      const response = await request(app.getHttpServer())
        .post(`/api/v1/players/${playerId}/buy`)
        .set('Content-Type', 'application/json')
        .send('[]');

      expectRefusal(response, 400);
    });
  });

  describe('B12: fim da fidelidade (RN01 e Limites)', () => {
    let clubId: number;
    let playerId: number;

    beforeEach(async () => {
      clubId = await api.createClub('Águias FC', 'AGU');
      playerId = await api.createPlayer();
    });

    it.each([
      [
        '29 de fevereiro de ano bissexto',
        '2028-02-29T10:00-03:00',
        '2028-02-29T10:00:00-03:00',
      ],
      ['meia-noite', '2027-01-15T00:00-03:00', '2027-01-15T00:00:00-03:00'],
      [
        'agora + 1.095 dias',
        toDateTimeInput(new Date(NOW.getTime() + 1095 * DAY)),
        '2029-11-01T10:15:00-03:00',
      ],
      [
        'o minuto seguinte',
        '2026-11-02T10:16-03:00',
        '2026-11-02T10:16:00-03:00',
      ],
    ])(
      '200: aceita %s, devolvido com os segundos',
      async (_, input, output) => {
        const response = await buy(playerId, clubId, input);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          contract: { loyalty_until: output },
        });
      },
    );

    it.each([
      ['sem o fuso', '2027-03-02T10:15'],
      ['com Z', '2027-03-02T10:15Z'],
      ['com -02:00', '2027-03-02T10:15-02:00'],
      ['com os segundos', '2027-03-02T10:15:00-03:00'],
      ['30 de fevereiro', '2027-02-30T10:15-03:00'],
      ['24:00', '2027-03-02T24:00-03:00'],
      ['número', 20270302],
      ['nulo', null],
      ['no passado', '2026-11-01T10:15-03:00'],
      ['no minuto atual, que já passou', '2026-11-02T10:15-03:00'],
      [
        'agora + 1.095 dias + 1 minuto',
        toDateTimeInput(new Date(NOW.getTime() + 1095 * DAY + MINUTE)),
      ],
    ])(
      '400: recusa fim da fidelidade %s, sem gravar nada',
      async (_, input) => {
        expectRefusal(await buy(playerId, clubId, input), 400);
        await expectNothingRecorded(clubId, playerId, 300);
      },
    );

    it('400: recusa fim da fidelidade ausente, sem gravar nada', async () => {
      expectRefusal(await api.buy(playerId, { club_id: clubId }), 400);
      await expectNothingRecorded(clubId, playerId, 300);
    });
  });

  it('D13: dois clubes comprando o mesmo jogador ao mesmo tempo: um compra, o outro recebe 409', async () => {
    const firstClub = await api.createClub('Águias FC', 'AGU');
    const secondClub = await api.createClub('Delta FC', 'DFC');
    const playerId = await api.createPlayer();

    const responses = await Promise.all([
      buy(playerId, firstClub),
      buy(playerId, secondClub),
    ]);

    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    await expect(prisma.contract.count()).resolves.toBe(1);
    await expect(prisma.transaction.count()).resolves.toBe(1);
    const clubs = await prisma.club.findMany({ select: { cash: true } });
    expect(clubs.map(({ cash }) => cash.toNumber()).sort()).toEqual([258, 300]);
  });
});
