import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '../src/prisma/prisma.service';
import { apiClient } from './api-client';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import {
  AGUIAS_STARTERS,
  DELTA_STARTERS,
  starterBody,
} from './league.fixtures';
import { TestClock } from './test-clock';

/** Compras e escalações antes do jogo; a partida de 2.4.2 em 2026-11-12T15:00:00-03:00. */
const SIGNING_MOMENT = new Date('2026-11-10T13:00:00Z');
const MATCH_MOMENT = new Date('2026-11-12T18:00:00Z');

/** Jogador no duelo: nome, posição, condição, atributo e valor já com o efeito da condição. */
type Side = [string, string, string, string, number];

/** Tabela de duelos da RN20: ordem, clube que ataca, atacante, defensor e gol. */
// prettier-ignore
const DUELS: [number, 'Águias FC' | 'Delta FC', Side, Side, boolean][] = [
  [1, 'Águias FC', ['Otto Rangel', 'ATA', 'APTO', 'shooting', 75], ['Ivo Teles', 'GOL', 'APTO', 'defending', 72], true],
  [2, 'Águias FC', ['Lauro Neves', 'MEI', 'APTO', 'passing', 82], ['Hugo Vaz', 'ZAG', 'APTO', 'defending', 84], false],
  [3, 'Águias FC', ['Davi Lins', 'LAT', 'MAL_CONDICIONADO', 'dribbling', 63], ['Lino Matos', 'LAT', 'APTO', 'defending', 63], false],
  [4, 'Delta FC', ['Ugo Falcão', 'ATA', 'APTO', 'shooting', 81], ['Rui Prado', 'GOL', 'APTO', 'defending', 77], true],
  [5, 'Delta FC', ['Nei Soares', 'MEI', 'APTO', 'passing', 70], ['Téo Brandão', 'ZAG', 'APTO', 'defending', 84], false],
  [6, 'Delta FC', ['Lino Matos', 'LAT', 'APTO', 'dribbling', 79], ['Davi Lins', 'LAT', 'MAL_CONDICIONADO', 'defending', 56], true],
];

/**
 * A partida de exemplo da RN20 e da seção 2.4, toda pela API: clubes → cadastro e compra dos 10
 * titulares → Davi Lins MAL_CONDICIONADO → escalações (2.4.1) → partida (2.4.2) → consulta, histórico
 * e classificação (2.4.3) → mudanças nos jogadores que não alteram a partida gravada. Cada passo
 * depende do anterior.
 */
describe('Águias FC 1 × 2 Delta FC, duelo a duelo (RN19 a RN21)', () => {
  const clock = new TestClock(SIGNING_MOMENT);
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let api: ReturnType<typeof apiClient>;
  const clubIds: Record<string, number> = {};
  const playerIds: Record<string, number> = {};
  let matchId: number;
  let playedMatch: unknown;
  let beforeMatch: unknown[];

  beforeAll(async () => {
    app = await createTestApp({ clock });
    prisma = app.get(PrismaService);
    api = apiClient(app);
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const duelSide = ([name, position, condition, attribute, value]: Side) => ({
    player_id: playerIds[name],
    player_name: name,
    position,
    condition,
    attribute,
    value,
  });

  /** Clubes (caixa e elenco), escalações e jogadores, consultados um por vez. */
  async function snapshot(): Promise<unknown[]> {
    const bodies: unknown[] = [];
    for (const clubId of Object.values(clubIds)) {
      bodies.push((await api.findClub(clubId)).body);
      bodies.push((await api.findLineup(clubId)).body);
    }
    for (const playerId of Object.values(playerIds)) {
      bodies.push((await api.findPlayer(playerId)).body);
    }
    return bodies;
  }

  it('POST /clubs: Águias FC, Delta FC e Gama SC', async () => {
    clubIds['Águias FC'] = await api.createClub('Águias FC', 'AGU');
    clubIds['Delta FC'] = await api.createClub('Delta FC', 'DFC');
    clubIds['Gama SC'] = await api.createClub('Gama SC', 'GSC');
  });

  it('POST /players e POST /players/{id}/buy: os 10 titulares da RN20, com os valores do duelo', async () => {
    for (const [club, starters] of [
      ['Águias FC', AGUIAS_STARTERS],
      ['Delta FC', DELTA_STARTERS],
    ] as const) {
      for (const { name, position, values } of starters) {
        playerIds[name] = await api.signPlayer(
          clubIds[club],
          starterBody(name, position, values),
          clock.now(),
        );
      }
    }

    const aguias = await api.findClub(clubIds['Águias FC']);
    expect(
      (aguias.body as { players: { name: string }[] }).players.map(
        (player) => player.name,
      ),
    ).toEqual([
      'Rui Prado',
      'Téo Brandão',
      'Davi Lins',
      'Lauro Neves',
      'Otto Rangel',
    ]);
  });

  it('PATCH /players/{id}/condition: Davi Lins passa a MAL_CONDICIONADO, sem mudar os atributos', async () => {
    const response = await api.changeCondition(
      playerIds['Davi Lins'],
      'MAL_CONDICIONADO',
    );

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      condition: 'MAL_CONDICIONADO',
      dribbling: 74,
      defending: 66,
    });
  });

  it('2.4.1 · PUT /clubs/{id}/lineup: o Águias FC escala [34, 31, 30, 33, 32] no 2-1-1 e recebe os titulares na ordem do elenco', async () => {
    const ids = [
      'Otto Rangel',
      'Davi Lins',
      'Rui Prado',
      'Lauro Neves',
      'Téo Brandão',
    ];

    const response = await api.setLineup(clubIds['Águias FC'], {
      formation: '2-1-1',
      player_ids: ids.map((name) => playerIds[name]),
    });

    expect(response.status).toBe(200);
    const inRosterOrder = [
      'Rui Prado',
      'Téo Brandão',
      'Davi Lins',
      'Lauro Neves',
      'Otto Rangel',
    ];
    const players: unknown[] = [];
    for (const name of inRosterOrder) {
      players.push((await api.findPlayer(playerIds[name])).body);
    }
    expect(response.body).toEqual({
      club_id: clubIds['Águias FC'],
      formation: '2-1-1',
      complete: true,
      players,
    });
    // Os campos principais do exemplo de 2.4.1.
    // prettier-ignore
    expect(response.body).toMatchObject({
      players: [
        { id: playerIds['Rui Prado'], name: 'Rui Prado', position: 'GOL', condition: 'APTO', defending: 77 },
        { id: playerIds['Téo Brandão'], name: 'Téo Brandão', position: 'ZAG', condition: 'APTO', defending: 84 },
        { id: playerIds['Davi Lins'], name: 'Davi Lins', position: 'LAT', condition: 'MAL_CONDICIONADO', dribbling: 74, defending: 66 },
        { id: playerIds['Lauro Neves'], name: 'Lauro Neves', position: 'MEI', condition: 'APTO', passing: 82 },
        { id: playerIds['Otto Rangel'], name: 'Otto Rangel', position: 'ATA', condition: 'APTO', shooting: 75 },
      ],
    });
  });

  it('PUT /clubs/{id}/lineup: o Delta FC escala os seus 5 titulares no 2-1-1', async () => {
    const response = await api.setLineup(clubIds['Delta FC'], {
      formation: '2-1-1',
      player_ids: DELTA_STARTERS.map(({ name }) => playerIds[name]),
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ formation: '2-1-1', complete: true });
  });

  it('2.4.2 · POST /matches: Águias FC 1 × 2 Delta FC, VISITANTE, com Location e os 6 duelos', async () => {
    clock.set(MATCH_MOMENT);
    // No mesmo instante da partida, para os dias restantes dos contratos não mudarem na comparação.
    beforeMatch = await snapshot();

    const response = await api.playMatch({
      home_club_id: clubIds['Águias FC'],
      away_club_id: clubIds['Delta FC'],
    });

    expect(response.status).toBe(201);
    matchId = (response.body as { id: number }).id;
    playedMatch = response.body;
    expect(response.headers.location).toBe(`/api/v1/matches/${matchId}`);
    expect(response.body).toEqual({
      id: matchId,
      played_at: '2026-11-12T15:00:00-03:00',
      home: {
        club_id: clubIds['Águias FC'],
        club_name: 'Águias FC',
        formation: '2-1-1',
        goals: 1,
      },
      away: {
        club_id: clubIds['Delta FC'],
        club_name: 'Delta FC',
        formation: '2-1-1',
        goals: 2,
      },
      result: 'VISITANTE',
      duels: DUELS.map(([order, club, attacker, defender, goal]) => ({
        order,
        attacking_club_id: clubIds[club],
        attacker: duelSide(attacker),
        defender: duelSide(defender),
        goal,
      })),
    });
  });

  it.each(DUELS)(
    'duelo %i, ataque do %s: %j contra %j, gol: %s',
    (order, club, attacker, defender, goal) => {
      const { duels } = playedMatch as { duels: unknown[] };
      expect(duels[order - 1]).toEqual({
        order,
        attacking_club_id: clubIds[club],
        attacker: duelSide(attacker),
        defender: duelSide(defender),
        goal,
      });
    },
  );

  it('grava em partidas e duelos_partida as formações, os nomes, as posições, as condições, os atributos e os valores do momento', async () => {
    const match = await prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { duels: { orderBy: { order: 'asc' } } },
    });

    expect(match).toMatchObject({
      homeClubId: clubIds['Águias FC'],
      awayClubId: clubIds['Delta FC'],
      homeGoals: 1,
      awayGoals: 2,
      homeFormation: '2-1-1',
      awayFormation: '2-1-1',
      playedAt: MATCH_MOMENT,
    });
    expect(match.duels).toEqual(
      DUELS.map(([order, club, attacker, defender, goal]) => ({
        id: expect.any(Number) as number,
        matchId,
        order,
        attackingClubId: clubIds[club],
        attackerId: playerIds[attacker[0]],
        attackerName: attacker[0],
        attackerPosition: attacker[1],
        attackerCondition: attacker[2],
        attackAttribute: attacker[3],
        attackValue: attacker[4],
        defenderId: playerIds[defender[0]],
        defenderName: defender[0],
        defenderPosition: defender[1],
        defenderCondition: defender[2],
        defenseAttribute: defender[3],
        defenseValue: defender[4],
        goal,
      })),
    );
  });

  it('a partida não muda o caixa, a escalação nem os jogadores', async () => {
    expect(await snapshot()).toEqual(beforeMatch);
  });

  it('GET /matches/{id}: a mesma partida, com os 6 duelos', async () => {
    const response = await api.findMatch(matchId);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(playedMatch);
  });

  it('GET /matches: a partida no histórico, sem os duelos', async () => {
    const { duels, ...summary } = playedMatch as Record<string, unknown>;

    const response = await api.listMatches();

    expect(response.status).toBe(200);
    expect(duels).toHaveLength(6);
    expect(response.body).toEqual([summary]);
  });

  it('2.4.3 · GET /standings: Delta FC 3 pontos, Gama SC sem jogar e Águias FC sem pontos', async () => {
    const response = await api.standings();

    expect(response.status).toBe(200);
    // prettier-ignore
    expect(response.body).toEqual([
      { position: 1, club_id: clubIds['Delta FC'], club_name: 'Delta FC', played: 1, wins: 1, draws: 0, losses: 0, goals_for: 2, goals_against: 1, goal_difference: 1, points: 3 },
      { position: 2, club_id: clubIds['Gama SC'], club_name: 'Gama SC', played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, goal_difference: 0, points: 0 },
      { position: 3, club_id: clubIds['Águias FC'], club_name: 'Águias FC', played: 1, wins: 0, draws: 0, losses: 1, goals_for: 1, goals_against: 2, goal_difference: -1, points: 0 },
    ]);
  });

  it('nada é recalculado depois: editar o nome e a condição do Davi Lins não muda a partida gravada', async () => {
    const davi = playerIds['Davi Lins'];
    const edited = await api.editPlayer(davi, {
      name: 'Davi Lins Souza',
      position: 'LAT',
      agility: 50,
      age: 26,
    });
    expect(edited.status).toBe(200);
    expect((await api.changeCondition(davi, 'APTO')).status).toBe(200);

    const response = await api.findMatch(matchId);

    expect(response.body).toEqual(playedMatch);
  });

  it('2.4.1 · Otto Rangel vendido: a escalação mantém o 2-1-1 com 4 titulares, incompleta, a partida antiga não muda e o Águias FC não joga até escalar de novo', async () => {
    expect((await api.sell(playerIds['Otto Rangel'])).status).toBe(200);

    const lineup = await api.findLineup(clubIds['Águias FC']);
    expect(lineup.body).toMatchObject({ formation: '2-1-1', complete: false });
    expect(
      (lineup.body as { players: { name: string }[] }).players.map(
        (player) => player.name,
      ),
    ).toEqual(['Rui Prado', 'Téo Brandão', 'Davi Lins Souza', 'Lauro Neves']);
    expect((await api.findMatch(matchId)).body).toEqual(playedMatch);
    expectRefusal(
      await api.playMatch({
        home_club_id: clubIds['Águias FC'],
        away_club_id: clubIds['Delta FC'],
      }),
      409,
    );
  });
});
