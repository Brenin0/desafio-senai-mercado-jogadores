import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
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

const HEADER =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n';
const MEIA_LUA_SALE_LINE =
  '2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n';
const MEIA_LUA_PURCHASE_LINE =
  '2026-11-02T10:15:00-03:00;COMPRA;Meia Lua;37,00;1,85;0,00;;-38,85\n';

type BodyCallback = (error: Error | null, body: Buffer) => void;

/** Guarda os bytes da resposta como chegaram, para conferir o BOM e os fins de linha. */
function rawBytes(response: unknown, callback: BodyCallback): void {
  const stream = response as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk));
  stream.on('end', () => callback(null, Buffer.concat(chunks)));
}

describe('Exportação do histórico em CSV (2.3.4, RN18)', () => {
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

  const exportPath = (clubId: number | string, query = '') =>
    `/api/v1/clubs/${clubId}/transactions/export${query}`;

  /** Pedido da exportação com os bytes da resposta em `body`. */
  const exportCsv = (clubId: number, query = '') =>
    request(app.getHttpServer())
      .get(exportPath(clubId, query))
      .buffer(true)
      .parse(rawBytes);

  /** Pedido da exportação lido como JSON, para as recusas. */
  const exportRefused = (clubId: number | string, query = '') =>
    request(app.getHttpServer()).get(exportPath(clubId, query));

  async function csvText(clubId: number, query = ''): Promise<string> {
    const response = await exportCsv(clubId, query);
    expect(response.status).toBe(200);
    return (response.body as Buffer).toString('utf8');
  }

  async function buy(playerId: number, clubId: number): Promise<void> {
    const response = await api.buy(playerId, {
      club_id: clubId,
      loyalty_until: LOYALTY_UNTIL,
    });
    expect(response.status).toBe(200);
  }

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

  it('200: o exemplo da RN18, com text/csv, Content-Disposition, UTF-8 sem BOM e LF em todas as linhas', async () => {
    const { clubId } = await meiaLuaStory();

    const response = await exportCsv(clubId);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^text\/csv/);
    expect(response.headers['content-disposition']).toBe(
      `attachment; filename="historico-clube-${clubId}.csv"`,
    );
    const bytes = response.body as Buffer;
    expect([...bytes.subarray(0, 3)]).not.toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes.includes('\r')).toBe(false);
    expect(bytes.toString('utf8')).toBe(
      HEADER + MEIA_LUA_SALE_LINE + MEIA_LUA_PURCHASE_LINE,
    );
  });

  it('200: com type=VENDA, o exemplo de 2.3.4', async () => {
    const { clubId } = await meiaLuaStory();

    await expect(csvText(clubId, '?type=VENDA')).resolves.toBe(
      HEADER + MEIA_LUA_SALE_LINE,
    );
  });

  it('200: clube sem transações → só a linha de cabeçalho, com o \\n', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');

    await expect(csvText(clubId)).resolves.toBe(HEADER);
  });

  it('200: filtro que não deixa nenhuma transação → só o cabeçalho (o erro que zerou o B19 da ficha)', async () => {
    const clubId = await api.createClub('Gaviões Do Sertão', 'GDS');
    const playerId = await api.createPlayer({ name: 'Lucas "Foguete" Prado' });
    await buy(playerId, clubId);

    await expect(csvText(clubId, '?type=VENDA')).resolves.toBe(HEADER);
  });

  it('nome com aspas ou ponto e vírgula vai entre aspas duplas, com as aspas internas duplicadas', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const quoted = await api.createPlayer({ name: 'Zé "Foguete" Lima' });
    const semicolon = await api.createPlayer({ name: 'Ana;Lima Souza' });
    await buy(quoted, clubId);
    clock.set(SALE_MOMENT);
    await buy(semicolon, clubId);

    await expect(csvText(clubId)).resolves.toBe(
      HEADER +
        '2026-11-05T16:40:00-03:00;COMPRA;"Ana;Lima Souza";40,00;2,00;0,00;;-42,00\n' +
        '2026-11-02T10:15:00-03:00;COMPRA;"Zé ""Foguete"" Lima";40,00;2,00;0,00;;-42,00\n',
    );
  });

  it('as linhas seguem a mesma ordem do histórico, com os mesmos filtros', async () => {
    const { clubId, playerId } = await meiaLuaStory();
    const otto = await api.createPlayer({ name: 'Otto Rangel' });
    await buy(otto, clubId);

    for (const query of ['', '?type=COMPRA', `?player_id=${playerId}`]) {
      const history = await api.history(clubId, query);
      const lines = (await csvText(clubId, query)).split('\n').slice(1, -1);
      const expected = (
        history.body as {
          data: { created_at: string; type: string; player_name: string }[];
        }
      ).data.map(
        ({ created_at, type, player_name }) =>
          `${created_at};${type};${player_name}`,
      );
      expect(
        lines.map((line) => line.split(';').slice(0, 3).join(';')),
      ).toEqual(expected);
    }
  });

  it('RN09: o nome do jogador excluído continua no CSV, como foi gravado', async () => {
    const { clubId, playerId } = await meiaLuaStory();
    await api.deletePlayer(playerId);

    await expect(csvText(clubId)).resolves.toBe(
      HEADER + MEIA_LUA_SALE_LINE + MEIA_LUA_PURCHASE_LINE,
    );
  });

  describe('recusas, sempre em JSON e sem Content-Disposition', () => {
    let clubId: number;

    beforeEach(async () => {
      clubId = await api.createClub('Águias FC', 'AGU');
    });

    it.each([
      'type=compra',
      'type=COMPRA,COMPRA',
      'type=',
      'player_id=abc',
      'player_id=',
    ])('400: ?%s', async (query) => {
      const response = await exportRefused(clubId, `?${query}`);

      expectRefusal(response, 400);
      expect(response.headers['content-disposition']).toBeUndefined();
    });

    it('404: clube inexistente', async () => {
      const response = await exportRefused(2147483647);

      expectRefusal(response, 404);
      expect(response.headers['content-disposition']).toBeUndefined();
    });

    it.each(['abc', '0', '01', '2147483648'])(
      'V8: 404 para o id de clube %s, fora do formato',
      async (id) => {
        expectRefusal(await exportRefused(id), 404);
      },
    );

    it('404: player_id de jogador inexistente ou excluído', async () => {
      const playerId = await api.createPlayer();
      await api.deletePlayer(playerId);

      expectRefusal(await exportRefused(clubId, `?player_id=${playerId}`), 404);
      expectRefusal(await exportRefused(clubId, '?player_id=2147483647'), 404);
    });
  });
});
