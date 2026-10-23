import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ActiveContract, ACTIVE_CONTRACT_STATUS } from '../domain/contract';
import { ClosedContractStatus } from '../domain/loyalty-penalty';
import { DatabaseClient } from '../prisma/transaction-runner';

export interface NewContract extends ActiveContract {
  playerId: number;
  clubId: number;
  startedAt: Date;
}

export interface StoredActiveContract extends ActiveContract {
  id: number;
}

const ACTIVE_CONTRACT_COLUMNS = {
  id: true,
  purchaseValue: true,
  loyaltyUntil: true,
} as const;

@Injectable()
export class ContractsRepository {
  /** RN12: a compra cria o contrato ATIVO, com o valor de compra (sem a taxa) e o fim da fidelidade. */
  async createActive(
    contract: NewContract,
    db: DatabaseClient,
  ): Promise<ActiveContract> {
    const { purchaseValue, loyaltyUntil } = await db.contract.create({
      data: { ...contract, status: ACTIVE_CONTRACT_STATUS },
      select: ACTIVE_CONTRACT_COLUMNS,
    });
    return {
      purchaseValue: new Decimal(purchaseValue.toString()),
      loyaltyUntil,
    };
  }

  /**
   * RN16: o contrato ATIVO do jogador com o clube. Todo jogador de um elenco tem um; se faltar, os
   * dados estão inconsistentes e a operação falha como erro interno.
   */
  async findActive(
    playerId: number,
    clubId: number,
    db: DatabaseClient,
  ): Promise<StoredActiveContract> {
    const row = await db.contract.findFirstOrThrow({
      where: { playerId, clubId, status: ACTIVE_CONTRACT_STATUS },
      select: ACTIVE_CONTRACT_COLUMNS,
    });
    return { ...row, purchaseValue: new Decimal(row.purchaseValue.toString()) };
  }

  /** RN15: na venda, o contrato passa a RESCINDIDO (com multa) ou ENCERRADO e ganha o fim. */
  async close(
    id: number,
    status: ClosedContractStatus,
    endedAt: Date,
    db: DatabaseClient,
  ): Promise<void> {
    await db.contract.update({ where: { id }, data: { status, endedAt } });
  }
}
