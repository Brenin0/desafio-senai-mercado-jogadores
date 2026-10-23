import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { apiClient } from './api-client';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { insertMatch } from './records';

/** Linha esperada: posição, clube, jogos, V, E, D, gols marcados, gols sofridos, saldo e pontos. */
type Row = [
  number,
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/*
 * As partidas destes testes são gravadas direto no banco, só com o placar: montar pela API os placares
 * exatos do exemplo exigiria escalações sob medida para cada partida. A conta da classificação está nos
 * testes do domínio (standings.spec.ts); aqui se confere o endpoint com o banco. A partida jogada pela
 * API entra na classificação no teste da história Águias FC × Delta FC.
 */
describe('Classificação (GET /standings, RN21)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let api: ReturnType<typeof apiClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    api = apiClient(app);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const standings = () => request(app.getHttpServer()).get('/api/v1/standings');

  async function expectStandings(
    clubIds: Record<string, number>,
    rows: Row[],
  ): Promise<void> {
    const response = await standings();
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual(
      rows.map(
        ([
          position,
          name,
          played,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference,
          points,
        ]) => ({
          position,
          club_id: clubIds[name],
          club_name: name,
          played,
          wins,
          draws,
          losses,
          goals_for: goalsFor,
          goals_against: goalsAgainst,
          goal_difference: goalDifference,
          points,
        }),
      ),
    );
  }

  it('sem clubes: 200 com lista vazia', async () => {
    const response = await standings();

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('exemplo da RN21: 6 clubes e 4 partidas, com os desempates por saldo, gols marcados e nome', async () => {
    // Criados fora da ordem dos nomes, para o desempate pelo nome não coincidir com o do id.
    const ids: Record<string, number> = {};
    for (const [name, acronym] of [
      ['Tubarões EC', 'TEC'],
      ['Águias FC', 'AGU'],
      ['Mangue FC', 'MFC'],
      ['Gama SC', 'GSC'],
      ['Épsilon EC', 'EEC'],
      ['Delta FC', 'DFC'],
    ]) {
      ids[name] = await api.createClub(name, acronym);
    }
    await insertMatch(prisma, ids['Águias FC'], ids['Delta FC'], 1, 2);
    await insertMatch(prisma, ids['Gama SC'], ids['Épsilon EC'], 2, 1);
    await insertMatch(prisma, ids['Épsilon EC'], ids['Águias FC'], 3, 2);
    await insertMatch(prisma, ids['Delta FC'], ids['Gama SC'], 0, 1);

    // prettier-ignore
    await expectStandings(ids, [
      [1, 'Gama SC', 2, 2, 0, 0, 3, 1, 2, 6],
      [2, 'Épsilon EC', 2, 1, 0, 1, 4, 4, 0, 3],
      [3, 'Delta FC', 2, 1, 0, 1, 2, 2, 0, 3],
      [4, 'Mangue FC', 0, 0, 0, 0, 0, 0, 0, 0],
      [5, 'Tubarões EC', 0, 0, 0, 0, 0, 0, 0, 0],
      [6, 'Águias FC', 2, 0, 0, 2, 3, 5, -2, 0],
    ]);
  });

  it('empate vale 1 ponto para cada clube; empatados em tudo, ordem alfabética sem acentos', async () => {
    const ids: Record<string, number> = {};
    ids['Gama SC'] = await api.createClub('Gama SC', 'GSC');
    ids['Épsilon EC'] = await api.createClub('Épsilon EC', 'EEC');
    ids['Delta FC'] = await api.createClub('Delta FC', 'DFC');
    await insertMatch(prisma, ids['Gama SC'], ids['Épsilon EC'], 1, 1);

    // prettier-ignore
    await expectStandings(ids, [
      [1, 'Épsilon EC', 1, 0, 1, 0, 1, 1, 0, 1],
      [2, 'Gama SC', 1, 0, 1, 0, 1, 1, 0, 1],
      [3, 'Delta FC', 0, 0, 0, 0, 0, 0, 0, 0],
    ]);
  });

  it('nomes iguais sem os acentos ("Águias FC" e "Aguias FC") empatam, e o empate é desfeito pelo id', async () => {
    const ids: Record<string, number> = {};
    ids['Águias FC'] = await api.createClub('Águias FC', 'AGU');
    ids['Aguias FC'] = await api.createClub('Aguias FC', 'AFC');

    // prettier-ignore
    await expectStandings(ids, [
      [1, 'Águias FC', 0, 0, 0, 0, 0, 0, 0, 0],
      [2, 'Aguias FC', 0, 0, 0, 0, 0, 0, 0, 0],
    ]);
  });

  it('é calculada a cada consulta: uma nova partida muda a classificação', async () => {
    const ids: Record<string, number> = {};
    ids['Delta FC'] = await api.createClub('Delta FC', 'DFC');
    ids['Gama SC'] = await api.createClub('Gama SC', 'GSC');
    await insertMatch(prisma, ids['Delta FC'], ids['Gama SC'], 2, 0);

    // prettier-ignore
    await expectStandings(ids, [
      [1, 'Delta FC', 1, 1, 0, 0, 2, 0, 2, 3],
      [2, 'Gama SC', 1, 0, 0, 1, 0, 2, -2, 0],
    ]);

    await insertMatch(prisma, ids['Gama SC'], ids['Delta FC'], 3, 0);

    // prettier-ignore
    await expectStandings(ids, [
      [1, 'Gama SC', 2, 1, 0, 1, 3, 2, 1, 3],
      [2, 'Delta FC', 2, 1, 0, 1, 2, 3, -1, 3],
    ]);
  });
});
