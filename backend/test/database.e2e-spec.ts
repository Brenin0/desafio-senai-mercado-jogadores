import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';

describe('Banco dos testes e2e', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  it('usa o banco separado, com o sufixo _e2e, e não o da aplicação', async () => {
    const [{ name }] = await prisma.$queryRaw<
      { name: string }[]
    >`SELECT current_database() AS name`;

    expect(name).toMatch(/_e2e$/);
  });

  it('apaga os dados das tabelas entre um teste e outro', async () => {
    const club = await prisma.club.create({
      data: { name: 'Águias FC', normalizedName: 'águias fc', acronym: 'AGU' },
    });
    await prisma.player.create({
      data: {
        name: 'Meia Lua',
        position: 'MEI',
        agility: 85,
        age: 25,
        baseValue: '40.00',
        condition: 'APTO',
        clubId: club.id,
        pace: 70,
        shooting: 68,
        passing: 82,
        dribbling: 79,
        defending: 55,
        physical: 64,
        potential: 86,
      },
    });

    await clearDatabase(prisma);

    await expect(prisma.club.count()).resolves.toBe(0);
    await expect(prisma.player.count()).resolves.toBe(0);
  });
});
