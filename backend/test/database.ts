import { PrismaService } from '../src/prisma/prisma.service';
import { isE2eDatabase } from './e2e-database-url';

/** Apaga os dados de todas as tabelas, na ordem das chaves estrangeiras. Só roda no banco `_e2e`. */
export async function clearDatabase(prisma: PrismaService): Promise<void> {
  const [{ name }] = await prisma.$queryRaw<
    { name: string }[]
  >`SELECT current_database() AS name`;
  if (!isE2eDatabase(name)) {
    throw new Error(`Os testes e2e não apagam o banco "${name}".`);
  }
  await prisma.$transaction([
    prisma.matchDuel.deleteMany(),
    prisma.match.deleteMany(),
    prisma.lineupPlayer.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.player.deleteMany(),
    prisma.club.deleteMany(),
  ]);
}
