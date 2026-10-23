import type { TransactionType } from '../../domain/transaction';

/** Transação nas respostas (2.3): os valores e o nome gravados no momento da operação (RN17). */
export class TransactionResponseDto {
  id!: number;
  club_id!: number;
  player_id!: number;
  player_name!: string;
  type!: TransactionType;
  value!: number;
  fee!: number;
  penalty!: number;
  profit!: number | null;
  cash_change!: number;
  created_at!: string;
}
