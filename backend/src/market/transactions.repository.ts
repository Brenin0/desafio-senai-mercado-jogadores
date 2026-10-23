import { Injectable } from '@nestjs/common';
import { Transaction } from '../domain/transaction';
import { DatabaseClient } from '../prisma/transaction-runner';
import { TRANSACTION_COLUMNS, toTransaction } from './transaction-row';

export type NewTransaction = Omit<Transaction, 'id'>;

@Injectable()
export class TransactionsRepository {
  /** RN12: o clube já vendeu este jogador alguma vez? */
  async hasSale(
    clubId: number,
    playerId: number,
    db: DatabaseClient,
  ): Promise<boolean> {
    const sales = await db.transaction.count({
      where: { clubId, playerId, type: 'VENDA' },
    });
    return sales > 0;
  }

  async create(
    transaction: NewTransaction,
    db: DatabaseClient,
  ): Promise<Transaction> {
    const row = await db.transaction.create({
      data: transaction,
      select: TRANSACTION_COLUMNS,
    });
    return toTransaction(row);
  }
}
