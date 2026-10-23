import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '../src/prisma/prisma.service';
import { apiClient } from './api-client';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import { TestClock } from './test-clock';

/** Compra de 2.3.1 (2026-11-02T10:15-03:00) e venda de 2.3.2 (2026-11-05T16:40-03:00). */
const PURCHASE_MOMENT = new Date('2026-11-02T13:15:00Z');
const SALE_MOMENT = new Date('2026-11-05T19:40:00Z');
const LOYALTY_UNTIL = '2027-03-02T10:15-03:00';

const ZERO_SUMMARY = {
  total_spent: 0,
  total_received: 0,
  total_fees: 0,
  total_penalties: 0,
  total_profit: 0,
};

interface HistoryItem {
  id: number;
  type: string;
  player_id: number;
  cash_change: number;
}

describe('Histórico de transações (2.3.3, RN17)', () => {
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

  async function buy(playerId: number, clubId: number): Promise<void> {
    const response = await api.buy(playerId, {
      club_id: clubId,
      loyalty_until: LOYALTY_UNTIL,
    });
    expect(response.status).toBe(200);
  }

  /** A história do Meia Lua no Águias FC: MAL_CONDICIONADO, compra, volta a APTO e venda. */
  async function meiaLuaStory(): Promise<{ clubId: number; playerId: number }> {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const playerId = await api.createPlayer();
    await api.changeCondition(playerId, 'MAL_CONDICIONADO');
    await buy(playerId, clubId);
    await api.changeCondition(playerId, 'APTO');
    clock.set(SALE_MOMENT);
    expect((await api.sell(playerId)).status).toBe(200);
    return { clubId, playerId };
  }

  const meiaLuaSale = (clubId: number, playerId: number) => ({
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

  const meiaLuaPurchase = (clubId: number, playerId: number) => ({
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

  it('200: com type=VENDA, só a venda do Meia Lua e o summary dela (2.3.3)', async () => {
    const { clubId, playerId } = await meiaLuaStory();

    const response = await api.history(clubId, '?type=VENDA');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({
      data: [meiaLuaSale(clubId, playerId)],
      summary: {
        total_spent: 0,
        total_received: 35.7,
        total_fees: 0.3,
        total_penalties: 4,
        total_profit: 3,
      },
    });
  });

  it('200: sem filtro, a venda e depois a compra, com o summary de 2.3.3', async () => {
    const { clubId, playerId } = await meiaLuaStory();

    const response = await api.history(clubId);

    expect(response.body).toEqual({
      data: [meiaLuaSale(clubId, playerId), meiaLuaPurchase(clubId, playerId)],
      summary: {
        total_spent: 38.85,
        total_received: 35.7,
        total_fees: 2.15,
        total_penalties: 4,
        total_profit: 3,
      },
    });
  });

  it.each(['?type=COMPRA,VENDA', '?type=VENDA,COMPRA', '?apelido=lua'])(
    '%s é o mesmo que sem filtro',
    async (query) => {
      const { clubId } = await meiaLuaStory();

      const filtered = await api.history(clubId, query);

      expect(filtered.body).toEqual((await api.history(clubId)).body);
    },
  );

  it('type=COMPRA: só a compra, e o summary só dela', async () => {
    const { clubId, playerId } = await meiaLuaStory();

    const response = await api.history(clubId, '?type=COMPRA');

    expect(response.body).toEqual({
      data: [meiaLuaPurchase(clubId, playerId)],
      summary: { ...ZERO_SUMMARY, total_spent: 38.85, total_fees: 1.85 },
    });
  });

  it('ordem: da mais recente para a mais antiga; no mesmo instante, o maior id primeiro', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const first = await api.createPlayer({ name: 'Ana Lima' });
    const second = await api.createPlayer({ name: 'Bia Lima' });
    const third = await api.createPlayer({ name: 'Caio Lima' });
    await buy(first, clubId);
    await buy(second, clubId);
    clock.set(SALE_MOMENT);
    await buy(third, clubId);

    const response = await api.history(clubId);

    const items = (response.body as { data: HistoryItem[] }).data;
    expect(items.map(({ player_id }) => player_id)).toEqual([
      third,
      second,
      first,
    ]);
    expect(items[1].id).toBeGreaterThan(items[2].id);
  });

  it('RN17: guarda o nome e os valores do momento, mesmo depois de editar o jogador', async () => {
    const { clubId, playerId } = await meiaLuaStory();
    await api.editPlayer(playerId, {
      name: 'Lua Nova',
      position: 'ATA',
      agility: 20,
      age: 30,
    });
    await api.changeCondition(playerId, 'DOENTE');

    const response = await api.history(clubId);

    expect(response.body).toMatchObject({
      data: [meiaLuaSale(clubId, playerId), meiaLuaPurchase(clubId, playerId)],
    });
  });

  it('RN09: as transações do jogador excluído continuam no histórico, mas o filtro por ele dá 404', async () => {
    const { clubId, playerId } = await meiaLuaStory();
    expect((await api.deletePlayer(playerId)).status).toBe(204);

    const response = await api.history(clubId);

    expect(response.body).toMatchObject({
      data: [meiaLuaSale(clubId, playerId), meiaLuaPurchase(clubId, playerId)],
    });
    expectRefusal(await api.history(clubId, `?player_id=${playerId}`), 404);
  });

  it('RN17: 300,00 + soma de cash_change = caixa atual', async () => {
    const { clubId } = await meiaLuaStory();
    const other = await api.createPlayer({ name: 'Otto Rangel' });
    await buy(other, clubId);

    const history = await api.history(clubId);
    const club = await api.findClub(clubId);

    const total = (history.body as { data: HistoryItem[] }).data.reduce(
      (sum, { cash_change }) => sum + cash_change,
      300,
    );
    expect((club.body as { cash: number }).cash).toBeCloseTo(total, 2);
    expect(club.body).toMatchObject({ cash: 254.85 });
  });

  describe('filtro player_id, combinado com type', () => {
    let clubId: number;
    let meiaLua: number;
    let otto: number;

    beforeEach(async () => {
      ({ clubId, playerId: meiaLua } = await meiaLuaStory());
      otto = await api.createPlayer({ name: 'Otto Rangel' });
      await buy(otto, clubId);
    });

    it('só as transações do jogador, com o summary delas', async () => {
      const response = await api.history(clubId, `?player_id=${otto}`);

      expect(response.body).toMatchObject({
        data: [{ player_id: otto, type: 'COMPRA', value: 40, fee: 2 }],
        summary: { ...ZERO_SUMMARY, total_spent: 42, total_fees: 2 },
      });
    });

    it('type e player_id ao mesmo tempo', async () => {
      const response = await api.history(
        clubId,
        `?type=VENDA&player_id=${meiaLua}`,
      );

      expect((response.body as { data: HistoryItem[] }).data).toMatchObject([
        { player_id: meiaLua, type: 'VENDA' },
      ]);
      await expect(
        api.history(clubId, `?type=VENDA&player_id=${otto}`),
      ).resolves.toMatchObject({ body: { data: [], summary: ZERO_SUMMARY } });
    });

    it('jogador sem transações no clube → 200, data vazio e summary zerado', async () => {
      const stranger = await api.createPlayer({ name: 'Ivo Teles' });

      const response = await api.history(clubId, `?player_id=${stranger}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: [], summary: ZERO_SUMMARY });
    });
  });

  it('as transações de outro clube não aparecem', async () => {
    const { clubId } = await meiaLuaStory();
    const otherClub = await api.createClub('Delta FC', 'DFC');
    const otto = await api.createPlayer({ name: 'Otto Rangel' });
    await buy(otto, otherClub);

    await expect(api.history(otherClub)).resolves.toMatchObject({
      body: { data: [{ player_id: otto }] },
    });
    expect(
      ((await api.history(clubId)).body as { data: HistoryItem[] }).data,
    ).toHaveLength(2);
  });

  it('200: clube sem transações tem data vazio e summary zerado', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');

    const response = await api.history(clubId);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [], summary: ZERO_SUMMARY });
  });

  describe('recusas', () => {
    let clubId: number;

    beforeEach(async () => {
      clubId = await api.createClub('Águias FC', 'AGU');
    });

    it.each([
      'type=compra',
      'type=COMPRA,venda',
      'type=COMPRA,COMPRA',
      'type=COMPRA,',
      'type=COMPRA,%20VENDA',
      'type=',
      'type=COMPRA&type=VENDA',
      'player_id=abc',
      'player_id=0',
      'player_id=01',
      'player_id=-1',
      'player_id=',
    ])('400: ?%s', async (query) => {
      expectRefusal(await api.history(clubId, `?${query}`), 400);
    });

    it('404: player_id de jogador inexistente', async () => {
      expectRefusal(await api.history(clubId, '?player_id=2147483647'), 404);
    });

    it('404: clube inexistente', async () => {
      expectRefusal(await api.history(2147483647), 404);
    });

    it.each(['abc', '0', '-1', '1.5', '01', '2147483648'])(
      'V8: 404 para o id de clube %s, fora do formato',
      async (id) => {
        expectRefusal(await api.history(id), 404);
      },
    );
  });
});
