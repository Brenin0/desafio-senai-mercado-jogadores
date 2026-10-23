import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { apiClient, toDateTimeInput } from './api-client';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import { addToLineup } from './records';
import { TestClock } from './test-clock';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compra de 2.3.1 (2026-11-02T10:15-03:00) e venda de 2.3.2 (2026-11-05T16:40-03:00). */
const PURCHASE_MOMENT = new Date('2026-11-02T13:15:00Z');
const SALE_MOMENT = new Date('2026-11-05T19:40:00Z');

/** Fim de fidelidade distante, para escolher os dias restantes pelo momento da venda. */
const FAR_LOYALTY_END = new Date(PURCHASE_MOMENT.getTime() + 400 * DAY);

describe('Venda de jogadores (2.3.2, RN15 e RN16)', () => {
  const clock = new TestClock(PURCHASE_MOMENT);
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let api: ReturnType<typeof apiClient>;

  beforeAll(async () => {
    app = await createTestApp({ clock });
    prisma = app.get(PrismaService);
    api = apiClient(app);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    clock.set(PURCHASE_MOMENT);
  });

  afterAll(async () => {
    await app.close();
  });

  async function buy(
    playerId: number,
    clubId: number,
    loyaltyUntil: Date = FAR_LOYALTY_END,
  ): Promise<void> {
    const response = await api.buy(playerId, {
      club_id: clubId,
      loyalty_until: toDateTimeInput(loyaltyUntil),
    });
    expect(response.status).toBe(200);
  }

  /** Jogador APTO de 25 anos (valor de mercado igual ao valor base) comprado pelo Águias FC. */
  async function signedPlayer(
    purchaseValue = '40.00',
    loyaltyUntil: Date = FAR_LOYALTY_END,
  ): Promise<{ clubId: number; playerId: number }> {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const playerId = await api.createPlayer();
    await api.setBaseValue(playerId, purchaseValue);
    await buy(playerId, clubId, loyaltyUntil);
    return { clubId, playerId };
  }

  it('200: o Águias FC vende o Meia Lua com 117 dias de fidelidade: multa 4,00, comissão 0,30 e crédito 35,70 (2.3.2)', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const playerId = await api.createPlayer();
    await api.changeCondition(playerId, 'MAL_CONDICIONADO');
    await buy(playerId, clubId, new Date('2027-03-02T13:15:00Z'));
    await api.changeCondition(playerId, 'APTO');
    clock.set(SALE_MOMENT);

    const response = await api.sell(playerId);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({
      id: expect.any(Number) as number,
      club_id: clubId,
      player_id: playerId,
      player_name: 'Meia Lua',
      type: 'VENDA',
      value: 40,
      fee: 0.3,
      penalty: 4,
      profit: 3,
      cash_change: 35.7,
      created_at: '2026-11-05T16:40:00-03:00',
      purchase_value: 37,
      remaining_days: 117,
      penalty_rate: 10,
      contract_status: 'RESCINDIDO',
      club_cash: 296.85,
    });
  });

  it('RN16: numa única operação, credita o caixa, deixa o jogador livre, fecha o contrato e grava a VENDA', async () => {
    const { clubId, playerId } = await signedPlayer();
    clock.set(SALE_MOMENT);

    await api.sell(playerId);

    await expect(api.findPlayer(playerId)).resolves.toMatchObject({
      body: { club_id: null },
    });
    const freePlayers = await request(app.getHttpServer()).get(
      '/api/v1/players?free=true',
    );
    expect(freePlayers.body).toMatchObject({ data: [{ id: playerId }] });
    await expect(api.findClub(clubId)).resolves.toMatchObject({
      body: { players: [] },
    });
    await expect(
      prisma.contract.findMany({ select: { status: true, endedAt: true } }),
    ).resolves.toEqual([{ status: 'RESCINDIDO', endedAt: SALE_MOMENT }]);
    const sale = await prisma.transaction.findFirstOrThrow({
      where: { type: 'VENDA' },
    });
    expect(sale).toMatchObject({ clubId, playerId, createdAt: SALE_MOMENT });
  });

  it('RN17: 300,00 + soma das variações do caixa = caixa atual', async () => {
    const { clubId, playerId } = await signedPlayer();
    clock.set(SALE_MOMENT);
    await api.sell(playerId);

    const transactions = await prisma.transaction.findMany({
      select: { cashChange: true },
    });
    const total = transactions.reduce(
      (sum, { cashChange }) => sum + cashChange.toNumber(),
      300,
    );
    const club = await api.findClub(clubId);
    expect((club.body as { cash: number }).cash).toBeCloseTo(total, 2);
  });

  it('RN19: o titular vendido sai da escalação na mesma operação, e a formação continua a salva', async () => {
    const { clubId, playerId } = await signedPlayer();
    await prisma.club.update({
      where: { id: clubId },
      data: { formation: '2-1-1' },
    });
    await addToLineup(prisma, clubId, playerId);
    clock.set(SALE_MOMENT);

    expect((await api.sell(playerId)).status).toBe(200);

    await expect(prisma.lineupPlayer.count()).resolves.toBe(0);
    await expect(
      prisma.club.findUniqueOrThrow({
        where: { id: clubId },
        select: { formation: true },
      }),
    ).resolves.toEqual({ formation: '2-1-1' });
  });

  describe('RN15: dias restantes arredondados para cima, percentual da multa e situação do contrato', () => {
    it.each([
      ['10 dias e 2 horas', 10 * DAY + 2 * HOUR, 11, 5, 2, 'RESCINDIDO'],
      ['exatamente 30 dias', 30 * DAY, 30, 5, 2, 'RESCINDIDO'],
      ['30 dias e 1 minuto', 30 * DAY + MINUTE, 31, 10, 4, 'RESCINDIDO'],
      [
        '30 dias, 6 h, 1 min e 29 s (ficha)',
        30 * DAY + 6 * HOUR + MINUTE + 29 * SECOND,
        31,
        10,
        4,
        'RESCINDIDO',
      ],
      [
        '116 dias, 17 h e 35 min (Meia Lua)',
        116 * DAY + 17 * HOUR + 35 * MINUTE,
        117,
        10,
        4,
        'RESCINDIDO',
      ],
      ['exatamente 180 dias', 180 * DAY, 180, 10, 4, 'RESCINDIDO'],
      ['180 dias e 1 minuto', 180 * DAY + MINUTE, 181, 20, 8, 'RESCINDIDO'],
      [
        '199 dias e 23 h 57 min (ficha)',
        199 * DAY + 23 * HOUR + 57 * MINUTE,
        200,
        20,
        8,
        'RESCINDIDO',
      ],
      ['200 dias', 200 * DAY, 200, 20, 8, 'RESCINDIDO'],
      ['o próprio momento da venda', 0, 0, 0, 0, 'ENCERRADO'],
      ['já passou', -DAY, 0, 0, 0, 'ENCERRADO'],
    ])(
      'fim da fidelidade %s depois da venda → %i dias, %i%%, multa %d, %s',
      async (
        _,
        untilLoyaltyEnd,
        remainingDays,
        penaltyRate,
        penalty,
        contractStatus,
      ) => {
        const { playerId } = await signedPlayer();
        clock.set(new Date(FAR_LOYALTY_END.getTime() - untilLoyaltyEnd));

        const response = await api.sell(playerId);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          remaining_days: remainingDays,
          penalty_rate: penaltyRate,
          penalty,
          contract_status: contractStatus,
        });
        await expect(
          prisma.contract.findFirstOrThrow({ select: { status: true } }),
        ).resolves.toEqual({ status: contractStatus });
      },
    );

    it('a consulta do clube e a venda, no mesmo instante, dão os mesmos dias e o mesmo percentual', async () => {
      const { clubId, playerId } = await signedPlayer();
      clock.set(
        new Date(
          FAR_LOYALTY_END.getTime() -
            (30 * DAY + 6 * HOUR + MINUTE + 29 * SECOND),
        ),
      );

      const club = await api.findClub(clubId);
      const sale = await api.sell(playerId);

      expect(club.body).toMatchObject({
        players: [{ contract: { remaining_days: 31, penalty_rate: 10 } }],
      });
      expect(sale.body).toMatchObject({ remaining_days: 31, penalty_rate: 10 });
    });

    it.each([
      ['20% de 76,00 = 15,20', '76.00', 200 * DAY, 20, 6.2, 59.8],
      ['10% de 120,00 = 12,00', '120.00', 60 * DAY, 10, 15, 95],
    ])(
      'teto da multa: %s → 10,00',
      async (
        _,
        saleValue,
        untilLoyaltyEnd,
        penaltyRate,
        commission,
        credit,
      ) => {
        const { playerId } = await signedPlayer();
        await api.setBaseValue(playerId, saleValue);
        clock.set(new Date(FAR_LOYALTY_END.getTime() - untilLoyaltyEnd));

        const response = await api.sell(playerId);

        expect(response.body).toMatchObject({
          value: Number(saleValue),
          penalty_rate: penaltyRate,
          penalty: 10,
          fee: commission,
          cash_change: credit,
        });
      },
    );
  });

  describe('RN16: lucro, comissão progressiva e crédito no caixa (tabela do enunciado)', () => {
    it.each([
      ['37.00', 1.85, '40.00', 60 * DAY, 4, 3, 0.3, 35.7, 'RESCINDIDO'],
      ['50.00', 2.5, '42.50', 200 * DAY, 8.5, -7.5, 0, 34, 'RESCINDIDO'],
      ['26.15', 0, '30.00', 10 * DAY, 1.5, 3.85, 0.39, 28.11, 'RESCINDIDO'],
      ['25.00', 0, '25.00', -DAY, 0, 0, 0, 25, 'ENCERRADO'],
      ['60.00', 3, '75.00', 200 * DAY, 10, 15, 2, 63, 'RESCINDIDO'],
    ])(
      'compra %s (taxa %d), venda %s → multa %d, lucro %d, comissão %d, crédito %d',
      async (
        purchaseValue,
        purchaseFee,
        saleValue,
        untilLoyaltyEnd,
        penalty,
        profit,
        commission,
        credit,
        contractStatus,
      ) => {
        const { playerId } = await signedPlayer(purchaseValue);
        await api.setBaseValue(playerId, saleValue);
        clock.set(new Date(FAR_LOYALTY_END.getTime() - untilLoyaltyEnd));

        const response = await api.sell(playerId);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          type: 'VENDA',
          value: Number(saleValue),
          fee: commission,
          penalty,
          profit,
          cash_change: credit,
          purchase_value: Number(purchaseValue),
          contract_status: contractStatus,
          club_cash: Number(
            (300 - Number(purchaseValue) - purchaseFee + credit).toFixed(2),
          ),
        });
      },
    );
  });

  describe('B16: venda recusada', () => {
    it('409: jogador livre, sem gravar nada', async () => {
      const playerId = await api.createPlayer();

      expectRefusal(await api.sell(playerId), 409);
      await expect(prisma.transaction.count()).resolves.toBe(0);
    });

    it('404: jogador excluído (RN09)', async () => {
      const playerId = await api.createPlayer();
      await api.deletePlayer(playerId);

      expectRefusal(await api.sell(playerId), 404);
    });

    it('404: jogador inexistente', async () => {
      expectRefusal(await api.sell(2147483647), 404);
    });

    it.each(['abc', '0', '-1', '1.5', '01', '2147483648'])(
      'V8: 404 para o id %s, fora do formato',
      async (id) => {
        expectRefusal(await api.sell(id), 404);
      },
    );

    it('V1: o corpo enviado à venda é ignorado', async () => {
      const { playerId } = await signedPlayer();

      const response = await request(app.getHttpServer())
        .post(`/api/v1/players/${playerId}/sell`)
        .set('Content-Type', 'application/json')
        .send('[]');

      expect(response.status).toBe(200);
    });

    it('duas vendas do mesmo jogador ao mesmo tempo: uma vende, a outra recebe 409', async () => {
      const { clubId, playerId } = await signedPlayer();

      const responses = await Promise.all([
        api.sell(playerId),
        api.sell(playerId),
      ]);

      expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
      await expect(
        prisma.transaction.count({ where: { type: 'VENDA' } }),
      ).resolves.toBe(1);
      await expect(api.findClub(clubId)).resolves.toMatchObject({
        // Uma venda só: 400 dias de fidelidade → multa de 20% (8,00) e crédito de 32,00.
        body: { cash: 300 - 42 + 32 },
      });
    });
  });

  it('RN12 e B16: o clube que vendeu não compra de novo; outro clube compra', async () => {
    const seller = await api.createClub('Águias FC', 'AGU');
    const other = await api.createClub('Delta FC', 'DFC');
    const playerId = await api.createPlayer();
    const purchase = (clubId: number) =>
      api.buy(playerId, {
        club_id: clubId,
        loyalty_until: toDateTimeInput(FAR_LOYALTY_END),
      });

    expect((await purchase(seller)).status).toBe(200);
    expect((await api.sell(playerId)).status).toBe(200);
    expectRefusal(await purchase(seller), 409);
    await expect(prisma.transaction.count()).resolves.toBe(2);
    expect((await purchase(other)).status).toBe(200);
    expect((await api.sell(playerId)).status).toBe(200);
    expectRefusal(await purchase(seller), 409);
    expectRefusal(await purchase(other), 409);
    await expect(prisma.transaction.count()).resolves.toBe(4);
  });
});
