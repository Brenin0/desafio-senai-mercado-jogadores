import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '../src/prisma/prisma.service';
import { apiClient, TeamWithLineup } from './api-client';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import { AGUIAS_STARTERS, DELTA_STARTERS } from './league.fixtures';
import { TestClock } from './test-clock';

const FIRST = new Date('2026-11-12T18:00:00Z');
const SECOND = new Date('2026-11-13T18:00:00Z');
const THIRD = new Date('2026-11-14T18:00:00Z');

describe('Histórico de partidas (GET /matches, RN21)', () => {
  const clock = new TestClock(FIRST);
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let api: ReturnType<typeof apiClient>;
  let aguias: TeamWithLineup;
  let delta: TeamWithLineup;
  let gama: TeamWithLineup;

  beforeAll(async () => {
    app = await createTestApp({ clock });
    prisma = app.get(PrismaService);
    api = apiClient(app);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    clock.set(FIRST);
    aguias = await api.createClubWithLineup(
      'Águias FC',
      'AGU',
      AGUIAS_STARTERS,
      clock.now(),
    );
    delta = await api.createClubWithLineup(
      'Delta FC',
      'DFC',
      DELTA_STARTERS,
      clock.now(),
    );
    gama = await api.createClubWithLineup(
      'Gama SC',
      'GSC',
      AGUIAS_STARTERS,
      clock.now(),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  /** Joga a partida no instante dado e devolve a resposta do POST sem os duelos. */
  async function playAt(
    instant: Date,
    home: TeamWithLineup,
    away: TeamWithLineup,
  ): Promise<Record<string, unknown>> {
    clock.set(instant);
    const response = await api.playMatch({
      home_club_id: home.clubId,
      away_club_id: away.clubId,
    });
    expect(response.status).toBe(201);
    const { duels, ...summary } = response.body as Record<string, unknown>;
    expect(duels).toHaveLength(6);
    return summary;
  }

  it('sem partidas: 200 com lista vazia', async () => {
    const response = await api.listMatches();

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual([]);
  });

  it('da mais recente para a mais antiga, no formato de 2.4.2 sem os duelos, com o placar e o result', async () => {
    const first = await playAt(FIRST, aguias, delta);
    const third = await playAt(THIRD, gama, aguias);
    const second = await playAt(SECOND, delta, gama);

    const response = await api.listMatches();

    expect(response.status).toBe(200);
    expect(response.body).toEqual([third, second, first]);
    // Aqui o Davi Lins está APTO: o duelo 3 vira gol (drible 74 contra defesa 63), e fica 2 × 2.
    expect(first).toMatchObject({
      home: { club_id: aguias.clubId, goals: 2 },
      away: { club_id: delta.clubId, goals: 2 },
      result: 'EMPATE',
    });
  });

  it('no mesmo instante, a partida de maior id vem primeiro', async () => {
    const older = await playAt(FIRST, aguias, delta);
    const newer = await playAt(FIRST, delta, aguias);

    const response = await api.listMatches();

    expect(response.body).toEqual([newer, older]);
  });

  it('club_id: só as partidas em que o clube foi mandante ou visitante, na mesma ordem', async () => {
    const first = await playAt(FIRST, aguias, delta);
    const second = await playAt(SECOND, gama, aguias);
    const third = await playAt(THIRD, delta, gama);

    const byClub = async (team: TeamWithLineup) =>
      (await api.listMatches(`?club_id=${team.clubId}`)).body as unknown;

    await expect(byClub(aguias)).resolves.toEqual([second, first]);
    await expect(byClub(delta)).resolves.toEqual([third, first]);
    await expect(byClub(gama)).resolves.toEqual([third, second]);
  });

  it('club_id de um clube que ainda não jogou: 200 com lista vazia', async () => {
    await playAt(FIRST, aguias, delta);
    const mangueId = await api.createClub('Mangue FC', 'MFC');

    const response = await api.listMatches(`?club_id=${mangueId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('parâmetro fora da tabela é ignorado', async () => {
    const first = await playAt(FIRST, aguias, delta);

    const response = await api.listMatches('?clube=1&sort=name');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([first]);
  });

  it.each(['', 'abc', '0', '01', '-1', '+1', '1.5', '1e1', '2147483648'])(
    '400: club_id=%s fora da forma aceita',
    async (clubId) => {
      expectRefusal(await api.listMatches(`?club_id=${clubId}`), 400);
    },
  );

  it('400: club_id repetido (D14)', async () => {
    expectRefusal(
      await api.listMatches(
        `?club_id=${aguias.clubId}&club_id=${delta.clubId}`,
      ),
      400,
    );
  });

  it('404: club_id de clube inexistente', async () => {
    expectRefusal(await api.listMatches('?club_id=2147483647'), 404);
  });
});
