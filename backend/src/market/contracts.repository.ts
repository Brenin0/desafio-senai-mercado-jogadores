import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ActiveContract, ACTIVE_CONTRACT_STATUS } from '../domain/contract';
import { DatabaseClient } from '../prisma/transaction-runner';

export interface NewContract extends ActiveContract {
  playerId: number;
  clubId: number;
  startedAt: Date;
}

@Injectable()
export class ContractsRepository {
  /** RN12: a compra cria o contrato ATIVO, com o valor de compra (sem a taxa) e o fim da fidelidade. */
  async createActive(
    contract: NewContract,
    db: DatabaseClient,
  ): Promise<ActiveContract> {
    const { purchaseValue, loyaltyUntil } = await db.contract.create({
      data: { ...contract, status: ACTIVE_CONTRACT_STATUS },
      select: { purchaseValue: true, loyaltyUntil: true },
    });
    return {
      purchaseValue: new Decimal(purchaseValue.toString()),
      loyaltyUntil,
    };
  }
}
