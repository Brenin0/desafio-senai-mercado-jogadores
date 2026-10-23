import { PrismaService } from '../src/prisma/prisma.service';

/*
 * Gravação direta no banco, para os testes prepararem jogadores com clube, contrato e escalação sem
 * passar pela compra, e partidas com um placar escolhido sem montar escalações sob medida.
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

/** Partida só com o placar, sem os duelos: a classificação lê apenas o placar de `partidas` (RN21). */
export async function insertMatch(
  prisma: PrismaService,
  homeClubId: number,
  awayClubId: number,
  homeGoals: number,
  awayGoals: number,
): Promise<void> {
  await prisma.match.create({
    data: {
      homeClubId,
      awayClubId,
      homeGoals,
      awayGoals,
      homeFormation: '2-1-1',
      awayFormation: '2-1-1',
    },
  });
}
