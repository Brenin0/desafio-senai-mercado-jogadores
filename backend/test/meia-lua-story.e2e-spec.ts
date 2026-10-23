import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { MEIA_LUA, MEIA_LUA_RESPONSE } from './players.fixtures';
import { TestClock } from './test-clock';

/** Momentos dos exemplos: a compra (2.3.1) e a venda (2.3.2). */
const PURCHASE_MOMENT = new Date('2026-11-02T13:15:00Z');
const SALE_MOMENT = new Date('2026-11-05T19:40:00Z');

/**
 * A história do Meia Lua no Águias FC (2. Endpoints): cadastro → MAL_CONDICIONADO → compra →
 * consulta do clube → volta a APTO → venda → histórico → CSV. Cada passo depende do anterior, e cada
 * resposta é conferida campo a campo com o exemplo do enunciado.
 */
describe('História do Meia Lua no Águias FC, campo a campo', () => {
  const clock = new TestClock(PURCHASE_MOMENT);
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let clubId: number;
  let playerId: number;

  beforeAll(async () => {
    app = await createTestApp({ clock });
    prisma = app.get(PrismaService);
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  const meiaLua = (overrides: object = {}) => ({
    id: playerId,
    ...MEIA_LUA_RESPONSE,
    ...overrides,
  });

  const meiaLuaSale = () => ({
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
  });

  const meiaLuaPurchase = () => ({
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
  });

  it('2.2.1 · POST /clubs: o Águias FC nasce com 300,00 em caixa', async () => {
    const response = await request(server())
      .post('/api/v1/clubs')
      .send({ name: 'Águias FC', acronym: 'AGU' });

    expect(response.status).toBe(201);
    clubId = (response.body as { id: number }).id;
    expect(response.headers.location).toBe(`/api/v1/clubs/${clubId}`);
    expect(response.body).toEqual({
      id: clubId,
      name: 'Águias FC',
      acronym: 'AGU',
      cash: 300,
      squad_value: 0,
      net_worth: 300,
    });
  });

  it('2.1.3 · POST /players: o Meia Lua nasce livre e APTO, com valor base 40,00 e overall 75', async () => {
    const response = await request(server())
      .post('/api/v1/players')
      .send(MEIA_LUA);

    expect(response.status).toBe(201);
    playerId = (response.body as { id: number }).id;
    expect(response.headers.location).toBe(`/api/v1/players/${playerId}`);
    expect(response.body).toEqual(meiaLua());
  });

  it('2.1.4 · PATCH /players/{id}/condition: MAL_CONDICIONADO, e o valor de mercado cai para 37,00', async () => {
    const response = await request(server())
      .patch(`/api/v1/players/${playerId}/condition`)
      .send({ condition: 'MAL_CONDICIONADO' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      meiaLua({ condition: 'MAL_CONDICIONADO', market_value: 37 }),
    );
  });

  it('2.1.2 · GET /players/{id}: o jogador depois da alteração de condição', async () => {
    const response = await request(server()).get(`/api/v1/players/${playerId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      meiaLua({ condition: 'MAL_CONDICIONADO', market_value: 37 }),
    );
  });

  it('2.1.1 · GET /players?search=lua&position=MEI&sort=value_desc&page=1&limit=10', async () => {
    const response = await request(server()).get(
      '/api/v1/players?search=lua&position=MEI&sort=value_desc&page=1&limit=10',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [meiaLua({ condition: 'MAL_CONDICIONADO', market_value: 37 })],
      meta: { page: 1, limit: 10, total_items: 1, total_pages: 1 },
    });
  });

  it('2.3.1 · POST /players/{id}/buy em 02/11/2026 às 10:15: valor 37,00, taxa 1,85 e caixa 261,15', async () => {
    clock.set(PURCHASE_MOMENT);

    const response = await request(server())
      .post(`/api/v1/players/${playerId}/buy`)
      .send({ club_id: clubId, loyalty_until: '2027-03-02T10:15-03:00' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ...meiaLuaPurchase(),
      contract: {
        purchase_value: 37,
        loyalty_until: '2027-03-02T10:15:00-03:00',
        status: 'ATIVO',
      },
      club_cash: 261.15,
    });
  });

  it('2.2.2 · GET /clubs/{id} logo depois da compra: elenco 37,00, patrimônio 298,15, 120 dias e 10%', async () => {
    const response = await request(server()).get(`/api/v1/clubs/${clubId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: clubId,
      name: 'Águias FC',
      acronym: 'AGU',
      cash: 261.15,
      squad_value: 37,
      net_worth: 298.15,
      players: [
        meiaLua({
          condition: 'MAL_CONDICIONADO',
          market_value: 37,
          club_id: clubId,
          contract: {
            purchase_value: 37,
            loyalty_until: '2027-03-02T10:15:00-03:00',
            remaining_days: 120,
            penalty_rate: 10,
          },
        }),
      ],
    });
  });

  it('PATCH /players/{id}/condition: o Meia Lua volta a APTO, e o valor de mercado volta a 40,00', async () => {
    const response = await request(server())
      .patch(`/api/v1/players/${playerId}/condition`)
      .send({ condition: 'APTO' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(meiaLua({ club_id: clubId }));
  });

  it('2.3.2 · POST /players/{id}/sell em 05/11/2026 às 16:40: 117 dias, multa 4,00, comissão 0,30 e caixa 296,85', async () => {
    clock.set(SALE_MOMENT);

    const response = await request(server()).post(
      `/api/v1/players/${playerId}/sell`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ...meiaLuaSale(),
      purchase_value: 37,
      remaining_days: 117,
      penalty_rate: 10,
      contract_status: 'RESCINDIDO',
      club_cash: 296.85,
    });
  });

  it('2.3.3 · GET /clubs/{id}/transactions?type=VENDA: a venda e o summary dela', async () => {
    const response = await request(server()).get(
      `/api/v1/clubs/${clubId}/transactions?type=VENDA`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [meiaLuaSale()],
      summary: {
        total_spent: 0,
        total_received: 35.7,
        total_fees: 0.3,
        total_penalties: 4,
        total_profit: 3,
      },
    });
  });

  it('2.3.3 · sem o filtro: a compra vem depois da venda, e o summary muda para 38,85 / 35,70 / 2,15 / 4,00 / 3,00', async () => {
    const response = await request(server()).get(
      `/api/v1/clubs/${clubId}/transactions`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [meiaLuaSale(), meiaLuaPurchase()],
      summary: {
        total_spent: 38.85,
        total_received: 35.7,
        total_fees: 2.15,
        total_penalties: 4,
        total_profit: 3,
      },
    });
  });

  it('2.3.4 · GET /clubs/{id}/transactions/export?type=VENDA', async () => {
    const response = await request(server()).get(
      `/api/v1/clubs/${clubId}/transactions/export?type=VENDA`,
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^text\/csv/);
    expect(response.text).toBe(
      'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n' +
        '2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n',
    );
  });

  it('RN18 · a exportação sem filtro é o exemplo da regra', async () => {
    const response = await request(server()).get(
      `/api/v1/clubs/${clubId}/transactions/export`,
    );

    expect(response.text).toBe(
      'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n' +
        '2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n' +
        '2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85\n',
    );
  });

  it('no fim: o Meia Lua está livre, o Águias FC tem 296,85 = 300,00 + soma das variações e o contrato foi rescindido', async () => {
    const club = await request(server()).get(`/api/v1/clubs/${clubId}`);
    const player = await request(server()).get(`/api/v1/players/${playerId}`);
    const free = await request(server()).get('/api/v1/players?free=true');
    const contracts = await prisma.contract.findMany({
      select: { status: true, startedAt: true, endedAt: true },
    });

    expect(club.body).toEqual({
      id: clubId,
      name: 'Águias FC',
      acronym: 'AGU',
      cash: 296.85,
      squad_value: 0,
      net_worth: 296.85,
      players: [],
    });
    const history = await request(server()).get(
      `/api/v1/clubs/${clubId}/transactions`,
    );
    const cashChanges = (
      history.body as { data: { cash_change: number }[] }
    ).data.map(({ cash_change }) => cash_change);
    expect(cashChanges).toEqual([35.7, -38.85]);
    expect(
      cashChanges.reduce((cash, change) => cash + change, 300),
    ).toBeCloseTo(296.85, 2);
    expect(player.body).toEqual(meiaLua());
    expect(free.body).toMatchObject({ data: [{ id: playerId }] });
    expect(contracts).toEqual([
      {
        status: 'RESCINDIDO',
        startedAt: PURCHASE_MOMENT,
        endedAt: SALE_MOMENT,
      },
    ]);
  });
});
