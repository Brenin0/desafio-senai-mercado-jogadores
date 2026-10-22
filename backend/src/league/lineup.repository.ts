import { Injectable } from '@nestjs/common';
import { DatabaseClient } from '../prisma/transaction-runner';

@Injectable()
export class LineupRepository {
  /** RN19: o titular sai da escalação, que fica incompleta, com a mesma formação. */
  async removePlayer(playerId: number, db: DatabaseClient): Promise<void> {
    await db.lineupPlayer.deleteMany({ where: { playerId } });
  }
}
