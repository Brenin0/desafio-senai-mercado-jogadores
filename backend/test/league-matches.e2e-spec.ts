import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '../src/prisma/prisma.service';
import { apiClient, TeamWithLineup } from './api-client';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import {
  AGUIAS_STARTERS,
  DELTA_STARTERS,
  StarterSpec,
} from './league.fixtures';
import { TestClock } from './test-clock';

/** Momento da partida de 2.4.2: 2026-11-12T15:00:00-03:00. */
const NOW = new Date('2026-11-12T18:00:00Z');

interface DuelSideBody {
  player_id: number;
  player_name: string;
  position: string;
  condition: string;
  attribute: string;
  value: number;
}

interface DuelBody {
  order: number;
  attacking_club_id: number;
  attacker: DuelSideBody;
  defender: DuelSideBody;
  goal: boolean;
}

interface MatchBody {
  id: number;
  played_at: string;
  home: { club_id: number; formation: string; goals: number };
  away: { club_id: number; formation: string; goals: number };
  result: string;
  duels: DuelBody[];
}

describe('Partida (2.4.2, RN20)', () => {
  const clock = new TestClock(NOW);
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
    clock.set(NOW);
  });

  afterAll(async () => {
    await app.close();
  });

  const clubWithLineup = (
    name: string,
    acronym: string,
    starters: StarterSpec[],
    formation?: string,
  ) =>
    api.createClubWithLineup(name, acronym, starters, clock.now(), formation);

  /** O cenário da RN20: Águias FC (com o LAT MAL_CONDICIONADO) e Delta FC, os dois no 2-1-1. */
  async function aguiasAndDelta(): Promise<{
    aguias: TeamWithLineup;
    delta: TeamWithLineup;
  }> {
    const aguias = await clubWithLineup('Águias FC', 'AGU', AGUIAS_STARTERS);
    await api.changeCondition(aguias.ids[2], 'MAL_CONDICIONADO');
    const delta = await clubWithLineup('Delta FC', 'DFC', DELTA_STARTERS);
    return { aguias, delta };
  }

  async function play(homeClubId: number, awayClubId: number) {
    const response = await api.playMatch({
      home_club_id: homeClubId,
      away_club_id: awayClubId,
    });
    expect(response.status).toBe(201);
    return response.body as MatchBody;
  }

  const savedRows = async () => ({
    matches: await prisma.match.count(),
    duels: await prisma.matchDuel.count(),
  });

  describe('201', () => {
    it('Águias FC × Delta FC: Location, placar 1 × 2, VISITANTE, played_at do servidor e os 6 duelos na ordem', async () => {
      const { aguias, delta } = await aguiasAndDelta();

      const response = await api.playMatch({
        home_club_id: aguias.clubId,
        away_club_id: delta.clubId,
      });

      expect(response.status).toBe(201);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      const body = response.body as MatchBody;
      expect(response.headers.location).toBe(`/api/v1/matches/${body.id}`);
      expect(body).toMatchObject({
        played_at: '2026-11-12T15:00:00-03:00',
        home: {
          club_id: aguias.clubId,
          club_name: 'Águias FC',
          formation: '2-1-1',
          goals: 1,
        },
        away: {
          club_id: delta.clubId,
          club_name: 'Delta FC',
          formation: '2-1-1',
          goals: 2,
        },
        result: 'VISITANTE',
      });
      expect(
        body.duels.map((duel) => [duel.order, duel.attacking_club_id]),
      ).toEqual([
        [1, aguias.clubId],
        [2, aguias.clubId],
        [3, aguias.clubId],
        [4, delta.clubId],
        [5, delta.clubId],
        [6, delta.clubId],
      ]);
    });

    it('grava a partida (jogada_em, placar e formações) e um duelo para cada ordem, de 1 a 6', async () => {
      const { aguias, delta } = await aguiasAndDelta();

      const { id } = await play(aguias.clubId, delta.clubId);

      const match = await prisma.match.findUniqueOrThrow({
        where: { id },
        include: { duels: { orderBy: { order: 'asc' } } },
      });
      expect(match).toMatchObject({
        homeClubId: aguias.clubId,
        awayClubId: delta.clubId,
        homeGoals: 1,
        awayGoals: 2,
        homeFormation: '2-1-1',
        awayFormation: '2-1-1',
        playedAt: NOW,
      });
      expect(match.duels.map((duel) => duel.order)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('trocar o mandante: Delta FC 2 × 1 Águias FC, MANDANTE, e os ataques do Delta FC passam a ser os duelos 1 a 3', async () => {
      const { aguias, delta } = await aguiasAndDelta();

      const body = await play(delta.clubId, aguias.clubId);

      expect(body.home).toMatchObject({ club_id: delta.clubId, goals: 2 });
      expect(body.away).toMatchObject({ club_id: aguias.clubId, goals: 1 });
      expect(body.result).toBe('MANDANTE');
      expect(body.duels.map((duel) => duel.attacking_club_id)).toEqual([
        delta.clubId,
        delta.clubId,
        delta.clubId,
        aguias.clubId,
        aguias.clubId,
        aguias.clubId,
      ]);
    });

    it('gols iguais dão EMPATE, e duelo empatado não é gol: dois times com 50 em tudo, 0 × 0', async () => {
      const evenTeam = (prefix: string): StarterSpec[] =>
        (['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const).map(
          (position, index) => ({
            name: `${prefix} ${['Alves', 'Braga', 'Costa', 'Dias', 'Esteves'][index]}`,
            position,
            values: { shooting: 50, passing: 50, dribbling: 50, defending: 50 },
          }),
        );
      const gama = await clubWithLineup('Gama SC', 'GSC', evenTeam('Gil'));
      const mangue = await clubWithLineup('Mangue FC', 'MFC', evenTeam('Rui'));

      const body = await play(gama.clubId, mangue.clubId);

      expect(body.home.goals).toBe(0);
      expect(body.away.goals).toBe(0);
      expect(body.result).toBe('EMPATE');
      expect(body.duels.map((duel) => duel.goal)).toEqual([
        false,
        false,
        false,
        false,
        false,
        false,
      ]);
    });

    it('o mesmo confronto pode se repetir: duas partidas, cada uma com o seu id', async () => {
      const { aguias, delta } = await aguiasAndDelta();

      const first = await play(aguias.clubId, delta.clubId);
      const second = await play(aguias.clubId, delta.clubId);

      expect(second.id).not.toBe(first.id);
      expect(await savedRows()).toEqual({ matches: 2, duels: 12 });
    });

    it('a partida não muda o caixa, a escalação nem os jogadores', async () => {
      const { aguias, delta } = await aguiasAndDelta();
      /** Clubes (caixa e elenco), escalações e jogadores, consultados um por vez. */
      const snapshot = async () => {
        const bodies: unknown[] = [];
        for (const clubId of [aguias.clubId, delta.clubId]) {
          bodies.push((await api.findClub(clubId)).body);
          bodies.push((await api.findLineup(clubId)).body);
        }
        for (const playerId of [...aguias.ids, ...delta.ids]) {
          bodies.push((await api.findPlayer(playerId)).body);
        }
        return bodies;
      };
      const before = await snapshot();

      await play(aguias.clubId, delta.clubId);

      expect(await snapshot()).toEqual(before);
    });
  });

  describe('Valores dos duelos (RN20)', () => {
    it('MAL_CONDICIONADO joga com 15% a menos, inteiro com meio para cima, no ataque e na defesa, sem mudar o jogador', async () => {
      const gama = await clubWithLineup('Gama SC', 'GSC', [
        { name: 'Gil Gomes', position: 'GOL', values: { defending: 10 } },
        { name: 'Zeca Dias', position: 'ZAG', values: { defending: 10 } },
        {
          name: 'Caio Reis',
          position: 'LAT',
          values: { dribbling: 50, defending: 10 },
        },
        { name: 'Bruno Alves', position: 'MEI', values: { passing: 10 } },
        { name: 'Ana Souza', position: 'ATA', values: { shooting: 43 } },
      ]);
      const mangue = await clubWithLineup('Mangue FC', 'MFC', [
        { name: 'Ivo Teles', position: 'GOL', values: { defending: 50 } },
        { name: 'Hugo Vaz', position: 'ZAG', values: { defending: 10 } },
        {
          name: 'Lino Matos',
          position: 'LAT',
          values: { dribbling: 10, defending: 43 },
        },
        { name: 'Nei Soares', position: 'MEI', values: { passing: 10 } },
        { name: 'Ugo Falcão', position: 'ATA', values: { shooting: 10 } },
      ]);
      const [caio, ivo] = [gama.ids[2], mangue.ids[0]];
      await api.changeCondition(caio, 'MAL_CONDICIONADO');
      await api.changeCondition(ivo, 'MAL_CONDICIONADO');

      const { duels, home, away } = await play(gama.clubId, mangue.clubId);

      // Duelo 1: finalização 43 (APTO) × defesa 50 × 0,85 = 42,5 → 43; empatado, não é gol.
      expect(duels[0].attacker).toMatchObject({ condition: 'APTO', value: 43 });
      expect(duels[0].defender).toMatchObject({
        player_id: ivo,
        condition: 'MAL_CONDICIONADO',
        attribute: 'defending',
        value: 43,
      });
      expect(duels[0].goal).toBe(false);
      // Duelo 3: drible 50 × 0,85 = 42,5 → 43 × defesa 43; empatado, não é gol.
      expect(duels[2].attacker).toMatchObject({
        player_id: caio,
        condition: 'MAL_CONDICIONADO',
        attribute: 'dribbling',
        value: 43,
      });
      expect(duels[2].goal).toBe(false);
      // Duelo 6: drible 10 × defesa 10 × 0,85 = 8,5 → 9; é gol.
      expect(duels[5].defender).toMatchObject({
        player_id: caio,
        condition: 'MAL_CONDICIONADO',
        value: 9,
      });
      expect(duels[5].goal).toBe(true);
      expect([home.goals, away.goals]).toEqual([0, 1]);
      // O efeito vale só na partida: os atributos gravados não mudam.
      expect((await api.findPlayer(caio)).body).toMatchObject({
        dribbling: 50,
        defending: 10,
      });
      expect((await api.findPlayer(ivo)).body).toMatchObject({ defending: 50 });
    });

    it('1-2-1: o MEI que vem antes pelo nome é o 2º jogador de linha, mesmo com id maior', async () => {
      const tubaroes = await clubWithLineup(
        'Tubarões EC',
        'TEC',
        [
          { name: 'Gil Gomes', position: 'GOL' },
          { name: 'Zeca Dias', position: 'ZAG' },
          { name: 'Bruno Alves', position: 'MEI', values: { passing: 60 } },
          { name: 'Ana Lima', position: 'MEI', values: { passing: 70 } },
          { name: 'Caio Reis', position: 'ATA' },
        ],
        '1-2-1',
      );
      const delta = await clubWithLineup('Delta FC', 'DFC', DELTA_STARTERS);

      const { duels, home } = await play(tubaroes.clubId, delta.clubId);

      expect(home.formation).toBe('1-2-1');
      // 3º jogador de linha: ataca no duelo 2.
      expect(duels[1].attacker).toMatchObject({
        player_name: 'Bruno Alves',
        attribute: 'passing',
        value: 60,
      });
      // 2º jogador de linha: ataca no duelo 3 e defende o 2º do adversário no duelo 6.
      expect(duels[2].attacker).toMatchObject({
        player_name: 'Ana Lima',
        attribute: 'passing',
        value: 70,
      });
      expect(duels[5].defender.player_name).toBe('Ana Lima');
      // 1º jogador de linha: defende no duelo 5.
      expect(duels[4].defender.player_name).toBe('Zeca Dias');
    });

    it('3-1 contra 2-2: atributo de ataque pela posição do atacante, defesa sempre pela defesa, e as formações gravadas', async () => {
      const gama = await clubWithLineup(
        'Gama SC',
        'GSC',
        [
          { name: 'Gil Gomes', position: 'GOL' },
          { name: 'Zeca Dias', position: 'ZAG' },
          { name: 'Davi Lins', position: 'LAT' },
          { name: 'Caio Reis', position: 'LAT' },
          { name: 'Otto Rangel', position: 'ATA' },
        ],
        '3-1',
      );
      const mangue = await clubWithLineup(
        'Mangue FC',
        'MFC',
        [
          { name: 'Ivo Teles', position: 'GOL' },
          { name: 'Hugo Vaz', position: 'ZAG' },
          { name: 'Lino Matos', position: 'LAT' },
          { name: 'Ugo Falcão', position: 'ATA' },
          { name: 'Rafa Moura', position: 'ATA' },
        ],
        '2-2',
      );

      const { duels, home, away } = await play(gama.clubId, mangue.clubId);

      expect([home.formation, away.formation]).toEqual(['3-1', '2-2']);
      expect(
        duels.map((duel) => [
          duel.attacker.player_name,
          duel.attacker.attribute,
          duel.defender.player_name,
          duel.defender.attribute,
        ]),
      ).toEqual([
        ['Otto Rangel', 'shooting', 'Ivo Teles', 'defending'],
        ['Davi Lins', 'dribbling', 'Hugo Vaz', 'defending'],
        ['Caio Reis', 'dribbling', 'Lino Matos', 'defending'],
        ['Ugo Falcão', 'shooting', 'Gil Gomes', 'defending'],
        ['Rafa Moura', 'shooting', 'Zeca Dias', 'defending'],
        ['Lino Matos', 'dribbling', 'Caio Reis', 'defending'],
      ]);
    });
  });

  describe('400: corpo inválido ou mandante igual ao visitante, sem gravar nada', () => {
    it.each<[string, (aguias: number, delta: number) => object]>([
      ['mandante ausente', (_, delta) => ({ away_club_id: delta })],
      [
        'mandante nulo',
        (_, delta) => ({ home_club_id: null, away_club_id: delta }),
      ],
      [
        'mandante em texto',
        (aguias, delta) => ({
          home_club_id: String(aguias),
          away_club_id: delta,
        }),
      ],
      [
        'mandante fracionário',
        (_, delta) => ({ home_club_id: 1.5, away_club_id: delta }),
      ],
      ['mandante 0', (_, delta) => ({ home_club_id: 0, away_club_id: delta })],
      [
        'mandante negativo',
        (_, delta) => ({ home_club_id: -1, away_club_id: delta }),
      ],
      ['visitante ausente', (aguias) => ({ home_club_id: aguias })],
      [
        'visitante em texto',
        (aguias, delta) => ({
          home_club_id: aguias,
          away_club_id: String(delta),
        }),
      ],
      [
        'mandante igual ao visitante',
        (aguias) => ({ home_club_id: aguias, away_club_id: aguias }),
      ],
    ])('%s', async (_, body) => {
      const { aguias, delta } = await aguiasAndDelta();

      const response = await api.playMatch(body(aguias.clubId, delta.clubId));

      expectRefusal(response, 400);
      expect(await savedRows()).toEqual({ matches: 0, duels: 0 });
    });
  });

  describe('404: clube inexistente, sem gravar nada', () => {
    it.each<[string, (aguias: number, delta: number) => object]>([
      [
        'mandante inexistente',
        (_, delta) => ({ home_club_id: 2147483647, away_club_id: delta }),
      ],
      [
        'visitante inexistente',
        (aguias) => ({ home_club_id: aguias, away_club_id: 2147483647 }),
      ],
    ])('%s', async (_, body) => {
      const { aguias, delta } = await aguiasAndDelta();

      const response = await api.playMatch(body(aguias.clubId, delta.clubId));

      expectRefusal(response, 404);
      expect(await savedRows()).toEqual({ matches: 0, duels: 0 });
    });

    it('a existência é conferida antes da escalação: visitante inexistente e mandante sem escalação → 404', async () => {
      const gamaId = await api.createClub('Gama SC', 'GSC');

      const response = await api.playMatch({
        home_club_id: gamaId,
        away_club_id: 2147483647,
      });

      expectRefusal(response, 404);
    });
  });

  describe('409: escalação incompleta, sem gravar nada', () => {
    it('mandante que nunca escalou', async () => {
      const { delta } = await aguiasAndDelta();
      const gamaId = await api.createClub('Gama SC', 'GSC');

      const response = await api.playMatch({
        home_club_id: gamaId,
        away_club_id: delta.clubId,
      });

      expectRefusal(response, 409);
      expect(await savedRows()).toEqual({ matches: 0, duels: 0 });
    });

    it('visitante que nunca escalou', async () => {
      const { aguias } = await aguiasAndDelta();
      const gamaId = await api.createClub('Gama SC', 'GSC');

      const response = await api.playMatch({
        home_club_id: aguias.clubId,
        away_club_id: gamaId,
      });

      expectRefusal(response, 409);
      expect(await savedRows()).toEqual({ matches: 0, duels: 0 });
    });

    it('mandante que perdeu um titular vendido e não escalou de novo', async () => {
      const { aguias, delta } = await aguiasAndDelta();
      expect((await api.sell(aguias.ids[4])).status).toBe(200);

      const response = await api.playMatch({
        home_club_id: aguias.clubId,
        away_club_id: delta.clubId,
      });

      expectRefusal(response, 409);
      expect(await savedRows()).toEqual({ matches: 0, duels: 0 });
    });

    it('visitante com um titular que passou a DOENTE: não joga até escalar de novo', async () => {
      const { aguias, delta } = await aguiasAndDelta();
      const lino = delta.ids[2];
      await api.changeCondition(lino, 'DOENTE');
      const body = {
        home_club_id: aguias.clubId,
        away_club_id: delta.clubId,
      };

      expectRefusal(await api.playMatch(body), 409);
      await api.changeCondition(lino, 'MAL_CONDICIONADO');
      expectRefusal(await api.playMatch(body), 409);
      expect(await savedRows()).toEqual({ matches: 0, duels: 0 });

      const lineup = await api.setLineup(delta.clubId, {
        formation: '2-1-1',
        player_ids: delta.ids,
      });
      expect(lineup.status).toBe(200);
      expect((await api.playMatch(body)).status).toBe(201);
    });
  });

  describe('GET /matches/{id} (RN21)', () => {
    it('devolve a partida no formato de 2.4.2, com os 6 duelos, igual à resposta do POST', async () => {
      const { aguias, delta } = await aguiasAndDelta();
      const played = await play(aguias.clubId, delta.clubId);

      const response = await api.findMatch(played.id);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toEqual(played);
      expect((response.body as MatchBody).duels).toHaveLength(6);
    });

    it('partida inexistente → 404', async () => {
      expectRefusal(await api.findMatch(2147483647), 404);
    });

    it.each(['abc', '0', '-1', '01', '1.5', '2147483648'])(
      'id fora do formato na URL (%s) → 404',
      async (id) => {
        expectRefusal(await api.findMatch(id), 404);
      },
    );
  });
});
