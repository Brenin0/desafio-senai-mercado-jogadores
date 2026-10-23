import { NestExpressApplication } from '@nestjs/platform-express';
import { Position } from '../src/domain/player';
import { PrismaService } from '../src/prisma/prisma.service';
import { apiClient } from './api-client';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';
import { DuelValues, starterBody } from './league.fixtures';
import { TestClock } from './test-clock';

/** Momento do servidor em que os titulares são escalados. */
const NOW = new Date('2026-11-12T13:00:00Z');

/** Elenco do Águias FC: os 5 titulares do exemplo 2.4.1 e mais 4 jogadores. */
interface Squad {
  rui: number; // GOL
  gil: number; // GOL
  teo: number; // ZAG
  davi: number; // LAT
  caio: number; // LAT
  lauro: number; // MEI
  bruno: number; // MEI
  otto: number; // ATA
  ana: number; // ATA
}

describe('Escalação do clube (2.4.1, RN19)', () => {
  const clock = new TestClock(NOW);
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let api: ReturnType<typeof apiClient>;
  let clubId: number;
  let squad: Squad;

  beforeAll(async () => {
    app = await createTestApp({ clock });
    prisma = app.get(PrismaService);
    api = apiClient(app);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
    clock.set(NOW);
    clubId = await api.createClub('Águias FC', 'AGU');
    squad = await signSquad(clubId);
  });

  afterAll(async () => {
    await app.close();
  });

  const sign = (
    club: number,
    name: string,
    position: Position,
    values?: DuelValues,
  ) => api.signPlayer(club, starterBody(name, position, values), clock.now());

  async function signSquad(club: number): Promise<Squad> {
    return {
      rui: await sign(club, 'Rui Prado', 'GOL', { defending: 77 }),
      gil: await sign(club, 'Gil Gomes', 'GOL'),
      teo: await sign(club, 'Téo Brandão', 'ZAG', { defending: 84 }),
      davi: await sign(club, 'Davi Lins', 'LAT', {
        dribbling: 74,
        defending: 66,
      }),
      caio: await sign(club, 'Caio Reis', 'LAT'),
      lauro: await sign(club, 'Lauro Neves', 'MEI', { passing: 82 }),
      bruno: await sign(club, 'Bruno Alves', 'MEI'),
      otto: await sign(club, 'Otto Rangel', 'ATA', { shooting: 75 }),
      ana: await sign(club, 'Ana Souza', 'ATA'),
    };
  }

  /** Corpo do exemplo 2.4.1: `player_ids` fora da ordem do elenco ([34, 31, 30, 33, 32]). */
  const exampleLineup = () => ({
    formation: '2-1-1',
    player_ids: [squad.otto, squad.davi, squad.rui, squad.lauro, squad.teo],
  });

  /** Os jogadores como GET /players/{id} os devolve, na ordem pedida. */
  async function playerBodies(ids: number[]): Promise<unknown[]> {
    const responses = await Promise.all(ids.map((id) => api.findPlayer(id)));
    return responses.map((response) => response.body as unknown);
  }

  /** A formação do clube e os titulares como estão no banco. */
  async function storedLineup(club = clubId) {
    const { formation } = await prisma.club.findUniqueOrThrow({
      where: { id: club },
      select: { formation: true },
    });
    const starters = await prisma.lineupPlayer.findMany({
      where: { clubId: club },
      select: { playerId: true, createdAt: true },
      orderBy: { playerId: 'asc' },
    });
    return { formation, starters };
  }

  async function expectLineupSet(body: object): Promise<void> {
    const response = await api.setLineup(clubId, body);
    expect(response.status).toBe(200);
  }

  describe('200', () => {
    it('2.4.1: escala os 5 titulares no 2-1-1, em qualquer ordem, com o LAT MAL_CONDICIONADO, e os devolve na ordem do elenco', async () => {
      await api.changeCondition(squad.davi, 'MAL_CONDICIONADO');

      const response = await api.setLineup(clubId, exampleLineup());

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toEqual({
        club_id: clubId,
        formation: '2-1-1',
        complete: true,
        players: await playerBodies([
          squad.rui,
          squad.teo,
          squad.davi,
          squad.lauro,
          squad.otto,
        ]),
      });
      expect(response.body).toMatchObject({
        players: [
          { name: 'Rui Prado', position: 'GOL', defending: 77 },
          { name: 'Téo Brandão', position: 'ZAG', defending: 84 },
          {
            name: 'Davi Lins',
            position: 'LAT',
            condition: 'MAL_CONDICIONADO',
            dribbling: 74,
            defending: 66,
          },
          { name: 'Lauro Neves', position: 'MEI', passing: 82 },
          { name: 'Otto Rangel', position: 'ATA', shooting: 75 },
        ],
      });
    });

    it('grava a formação em clubes.formacao e os 5 titulares em escalacoes, escalados no instante do servidor', async () => {
      await expectLineupSet(exampleLineup());

      expect(await storedLineup()).toEqual({
        formation: '2-1-1',
        starters: [squad.rui, squad.teo, squad.davi, squad.lauro, squad.otto]
          .sort((a, b) => a - b)
          .map((playerId) => ({ playerId, createdAt: NOW })),
      });
    });

    it('GET devolve a escalação salva, no mesmo formato do PUT', async () => {
      const saved = await api.setLineup(clubId, exampleLineup());

      const response = await api.findLineup(clubId);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toEqual(saved.body);
    });

    it('GET de clube que nunca escalou: formation null, complete false e players vazio', async () => {
      const deltaId = await api.createClub('Delta FC', 'DFC');

      const response = await api.findLineup(deltaId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        club_id: deltaId,
        formation: null,
        complete: false,
        players: [],
      });
    });

    it.each<[string, (s: Squad) => number[], string[]]>([
      [
        '3-1',
        (s) => [s.otto, s.caio, s.davi, s.teo, s.rui],
        ['Rui Prado', 'Téo Brandão', 'Caio Reis', 'Davi Lins', 'Otto Rangel'],
      ],
      [
        '2-2',
        (s) => [s.otto, s.ana, s.davi, s.teo, s.rui],
        ['Rui Prado', 'Téo Brandão', 'Davi Lins', 'Ana Souza', 'Otto Rangel'],
      ],
      [
        '2-1-1',
        (s) => [s.otto, s.lauro, s.davi, s.teo, s.rui],
        ['Rui Prado', 'Téo Brandão', 'Davi Lins', 'Lauro Neves', 'Otto Rangel'],
      ],
      [
        '1-2-1',
        (s) => [s.otto, s.lauro, s.bruno, s.teo, s.rui],
        [
          'Rui Prado',
          'Téo Brandão',
          'Bruno Alves',
          'Lauro Neves',
          'Otto Rangel',
        ],
      ],
    ])(
      'aceita o %s com as posições da tabela, na ordem do elenco (posição, nome e id)',
      async (formation, playerIds, names) => {
        const response = await api.setLineup(clubId, {
          formation,
          player_ids: playerIds(squad),
        });

        expect(response.status).toBe(200);
        const body = response.body as {
          formation: string;
          complete: boolean;
          players: { name: string }[];
        };
        expect(body.formation).toBe(formation);
        expect(body.complete).toBe(true);
        expect(body.players.map((player) => player.name)).toEqual(names);
      },
    );

    it('substitui a escalação inteira: a nova formação e só os novos titulares', async () => {
      await expectLineupSet(exampleLineup());

      const response = await api.setLineup(clubId, {
        formation: '2-2',
        player_ids: [squad.gil, squad.teo, squad.caio, squad.otto, squad.ana],
      });

      expect(response.status).toBe(200);
      const expected = {
        club_id: clubId,
        formation: '2-2',
        complete: true,
        players: await playerBodies([
          squad.gil,
          squad.teo,
          squad.caio,
          squad.ana,
          squad.otto,
        ]),
      };
      expect(response.body).toEqual(expected);
      expect((await api.findLineup(clubId)).body).toEqual(expected);
      const { formation, starters } = await storedLineup();
      expect(formation).toBe('2-2');
      expect(starters.map((starter) => starter.playerId)).toEqual(
        [squad.gil, squad.teo, squad.caio, squad.otto, squad.ana].sort(
          (a, b) => a - b,
        ),
      );
    });

    it('escalar não muda o caixa', async () => {
      const before = await api.findClub(clubId);

      await expectLineupSet(exampleLineup());

      const after = await api.findClub(clubId);
      expect((after.body as { cash: number }).cash).toBe(
        (before.body as { cash: number }).cash,
      );
    });
  });

  describe('400: formato inválido, sem gravar nada', () => {
    const base = (s: Squad) => [s.rui, s.teo, s.davi, s.lauro, s.otto];

    it.each<[string, (s: Squad) => object]>([
      ['formation ausente', (s) => ({ player_ids: base(s) })],
      ['formation nula', (s) => ({ formation: null, player_ids: base(s) })],
      [
        'formation fora da lista',
        (s) => ({ formation: '4-1', player_ids: base(s) }),
      ],
      [
        'formation com espaço',
        (s) => ({ formation: '2-1-1 ', player_ids: base(s) }),
      ],
      [
        'formation como número',
        (s) => ({ formation: 211, player_ids: base(s) }),
      ],
      ['player_ids ausente', () => ({ formation: '2-1-1' })],
      ['player_ids nulo', () => ({ formation: '2-1-1', player_ids: null })],
      [
        'player_ids que não é lista',
        (s) => ({ formation: '2-1-1', player_ids: base(s).join(',') }),
      ],
      [
        'player_ids com 4 ids',
        (s) => ({ formation: '2-1-1', player_ids: base(s).slice(0, 4) }),
      ],
      [
        'player_ids com 6 ids',
        (s) => ({ formation: '2-1-1', player_ids: [...base(s), s.ana] }),
      ],
      [
        'player_ids com id repetido',
        (s) => ({
          formation: '2-1-1',
          player_ids: [s.rui, s.rui, s.teo, s.lauro, s.otto],
        }),
      ],
      [
        'player_ids com id em texto',
        (s) => ({
          formation: '2-1-1',
          player_ids: [String(s.rui), s.teo, s.davi, s.lauro, s.otto],
        }),
      ],
      [
        'player_ids com 0',
        (s) => ({
          formation: '2-1-1',
          player_ids: [0, s.teo, s.davi, s.lauro, s.otto],
        }),
      ],
      [
        'player_ids com id negativo',
        (s) => ({
          formation: '2-1-1',
          player_ids: [-1, s.teo, s.davi, s.lauro, s.otto],
        }),
      ],
      [
        'player_ids com id fracionário',
        (s) => ({
          formation: '2-1-1',
          player_ids: [1.5, s.teo, s.davi, s.lauro, s.otto],
        }),
      ],
    ])('%s', async (_, body) => {
      await expectLineupSet(exampleLineup());
      const before = await storedLineup();

      const response = await api.setLineup(clubId, body(squad));

      expectRefusal(response, 400);
      expect(await storedLineup()).toEqual(before);
    });
  });

  describe('404: clube ou jogador inexistente, sem gravar nada', () => {
    it('clube inexistente', async () => {
      const response = await api.setLineup(2147483647, exampleLineup());

      expectRefusal(response, 404);
      expect(await prisma.lineupPlayer.count()).toBe(0);
      expectRefusal(await api.findLineup(2147483647), 404);
    });

    it.each(['abc', '0', '-1', '01', '1.5', '2147483648'])(
      'id do clube fora do formato na URL (%s)',
      async (id) => {
        expectRefusal(await api.setLineup(id, exampleLineup()), 404);
        expectRefusal(await api.findLineup(id), 404);
      },
    );

    it('jogador inexistente', async () => {
      await expectLineupSet(exampleLineup());
      const before = await storedLineup();

      const response = await api.setLineup(clubId, {
        formation: '2-1-1',
        player_ids: [squad.rui, squad.teo, squad.davi, squad.lauro, 2147483647],
      });

      expectRefusal(response, 404);
      expect(await storedLineup()).toEqual(before);
    });

    it('jogador excluído (RN09)', async () => {
      await expectLineupSet(exampleLineup());
      const before = await storedLineup();
      const deletedId = await api.createPlayer(
        starterBody('Ugo Falcão', 'ATA'),
      );
      expect((await api.deletePlayer(deletedId)).status).toBe(204);

      const response = await api.setLineup(clubId, {
        formation: '2-1-1',
        player_ids: [squad.rui, squad.teo, squad.davi, squad.lauro, deletedId],
      });

      expectRefusal(response, 404);
      expect(await storedLineup()).toEqual(before);
    });
  });

  describe('409: regra de negócio, sem gravar nada (a escalação anterior continua)', () => {
    it.each<[string, (s: Squad) => Promise<object>]>([
      [
        'jogador de outro clube',
        async (s) => {
          const deltaId = await api.createClub('Delta FC', 'DFC');
          const ugo = await sign(deltaId, 'Ugo Falcão', 'ATA');
          return {
            formation: '2-1-1',
            player_ids: [s.rui, s.teo, s.davi, s.lauro, ugo],
          };
        },
      ],
      [
        'jogador livre',
        async (s) => {
          const free = await api.createPlayer(starterBody('Ugo Falcão', 'ATA'));
          return {
            formation: '2-1-1',
            player_ids: [s.rui, s.teo, s.davi, s.lauro, free],
          };
        },
      ],
      [
        'jogador DOENTE',
        async (s) => {
          await api.changeCondition(s.ana, 'DOENTE');
          return {
            formation: '2-1-1',
            player_ids: [s.rui, s.teo, s.davi, s.lauro, s.ana],
          };
        },
      ],
      [
        'dois GOL',
        (s) =>
          Promise.resolve({
            formation: '2-1-1',
            player_ids: [s.rui, s.gil, s.davi, s.lauro, s.otto],
          }),
      ],
      [
        'nenhum GOL',
        (s) =>
          Promise.resolve({
            formation: '3-1',
            player_ids: [s.teo, s.davi, s.caio, s.lauro, s.otto],
          }),
      ],
      [
        '2-1-1 com dois MEI e nenhum LAT',
        (s) =>
          Promise.resolve({
            formation: '2-1-1',
            player_ids: [s.rui, s.teo, s.lauro, s.bruno, s.otto],
          }),
      ],
      [
        '2-2 com um MEI (o segundo número é o ataque, não o meio)',
        (s) =>
          Promise.resolve({
            formation: '2-2',
            player_ids: [s.rui, s.teo, s.davi, s.lauro, s.otto],
          }),
      ],
    ])('%s', async (_, body) => {
      await expectLineupSet(exampleLineup());
      const before = await storedLineup();
      const refused = await body(squad);

      const response = await api.setLineup(clubId, refused);

      expectRefusal(response, 409);
      expect(await storedLineup()).toEqual(before);
    });

    it('D01: fora do elenco é conferido antes do DOENTE, e o DOENTE antes da formação', async () => {
      const free = await api.createPlayer(starterBody('Ugo Falcão', 'ATA'));
      await api.changeCondition(squad.ana, 'DOENTE');
      const message = async (playerIds: number[]) =>
        (
          (
            await api.setLineup(clubId, {
              formation: '2-1-1',
              player_ids: playerIds,
            })
          ).body as { message: string }
        ).message;

      await expect(
        message([free, squad.ana, squad.rui, squad.gil, squad.teo]),
      ).resolves.toMatch(/não é do elenco/);
      await expect(
        message([squad.ana, squad.rui, squad.gil, squad.teo, squad.lauro]),
      ).resolves.toMatch(/DOENTE/);
      await expect(
        message([squad.otto, squad.rui, squad.gil, squad.teo, squad.lauro]),
      ).resolves.toMatch(/não fecham a formação 2-1-1/);
    });
  });

  describe('Titular que sai da escalação (RN19, item 5)', () => {
    it('titular vendido sai: a formação continua, complete false e os outros 4 titulares (2.4.1)', async () => {
      await expectLineupSet(exampleLineup());

      expect((await api.sell(squad.otto)).status).toBe(200);

      const response = await api.findLineup(clubId);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        club_id: clubId,
        formation: '2-1-1',
        complete: false,
        players: await playerBodies([
          squad.rui,
          squad.teo,
          squad.davi,
          squad.lauro,
        ]),
      });
    });

    it('titular que passa a DOENTE sai e não volta sozinho quando deixa de estar DOENTE; volta ao ser escalado de novo', async () => {
      await expectLineupSet(exampleLineup());

      await api.changeCondition(squad.davi, 'DOENTE');
      const sick = await api.findLineup(clubId);
      expect(sick.body).toMatchObject({ formation: '2-1-1', complete: false });
      expect((sick.body as { players: unknown[] }).players).toHaveLength(4);

      await api.changeCondition(squad.davi, 'MAL_CONDICIONADO');
      const recovered = await api.findLineup(clubId);
      expect(recovered.body).toEqual(sick.body);

      const again = await api.setLineup(clubId, exampleLineup());
      expect(again.status).toBe(200);
      expect(again.body).toMatchObject({ complete: true });
    });
  });
});
