import { NestExpressApplication } from '@nestjs/platform-express';
import { PlayersRepository } from '../src/players/players.repository';
import { PrismaService } from '../src/prisma/prisma.service';
import { apiClient } from './api-client';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';

/*
 * D13: compra e venda simultâneas do mesmo jogador. A corrida entre dois pedidos HTTP não é
 * reproduzível em teste; aqui a proteção é conferida direto nas atualizações condicionais que a
 * compra e a venda usam dentro da transação.
 */
describe('Jogador no elenco só por atualização condicional (D13)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let players: PlayersRepository;
  let api: ReturnType<typeof apiClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    players = app.get(PlayersRepository);
    api = apiClient(app);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const clubOf = async (playerId: number) =>
    (
      await prisma.player.findUniqueOrThrow({
        where: { id: playerId },
        select: { clubId: true },
      })
    ).clubId;

  it('compra: põe no elenco o jogador livre, mas não o que já tem clube', async () => {
    const first = await api.createClub('Águias FC', 'AGU');
    const second = await api.createClub('Delta FC', 'DFC');
    const playerId = await api.createPlayer();

    await expect(players.signForClub(playerId, first, prisma)).resolves.toBe(
      true,
    );
    await expect(players.signForClub(playerId, second, prisma)).resolves.toBe(
      false,
    );
    await expect(clubOf(playerId)).resolves.toBe(first);
  });

  it('compra: não põe no elenco o jogador excluído', async () => {
    const clubId = await api.createClub('Águias FC', 'AGU');
    const playerId = await api.createPlayer();
    await api.deletePlayer(playerId);

    await expect(players.signForClub(playerId, clubId, prisma)).resolves.toBe(
      false,
    );
    await expect(clubOf(playerId)).resolves.toBeNull();
  });

  it('venda: libera o jogador só do clube em que ele está, uma única vez', async () => {
    const owner = await api.createClub('Águias FC', 'AGU');
    const other = await api.createClub('Delta FC', 'DFC');
    const playerId = await api.createPlayer();
    await players.signForClub(playerId, owner, prisma);

    await expect(
      players.releaseFromClub(playerId, other, prisma),
    ).resolves.toBe(false);
    await expect(clubOf(playerId)).resolves.toBe(owner);
    await expect(
      players.releaseFromClub(playerId, owner, prisma),
    ).resolves.toBe(true);
    await expect(
      players.releaseFromClub(playerId, owner, prisma),
    ).resolves.toBe(false);
    await expect(clubOf(playerId)).resolves.toBeNull();
  });
});
