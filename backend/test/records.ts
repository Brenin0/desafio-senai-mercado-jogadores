import { PrismaService } from '../src/prisma/prisma.service';

/*
 * Gravação direta no banco do que ainda não tem endpoint (compra e escalação), para os testes
 * prepararem jogadores com clube, contrato e escalação.
 */

export async function insertClub(
  prisma: PrismaService,
  name: string,
  acronym: string,
  cash = '300.00',
): Promise<number> {
  const club = await prisma.club.create({
    data: { name, normalizedName: name.toLowerCase(), acronym, cash },
  });
  return club.id;
}

/** O jogador entra no elenco com um contrato ATIVO, como depois de uma compra (RN12). */
export async function signPlayer(
  prisma: PrismaService,
  playerId: number,
  clubId: number,
  contract = {
    purchaseValue: '40.00',
    loyaltyUntil: new Date('2027-03-02T13:15:00Z'),
  },
): Promise<void> {
  await prisma.$transaction([
    prisma.player.update({ where: { id: playerId }, data: { clubId } }),
    prisma.contract.create({
      data: { playerId, clubId, status: 'ATIVO', ...contract },
    }),
  ]);
}

export async function addToLineup(
  prisma: PrismaService,
  clubId: number,
  playerId: number,
): Promise<void> {
  await prisma.lineupPlayer.create({ data: { clubId, playerId } });
}
