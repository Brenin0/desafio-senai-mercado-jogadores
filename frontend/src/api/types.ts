export type Position = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';

export type Condition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';

export interface Player {
  id: number;
  name: string;
  position: Position;
  agility: number;
  age: number;
  condition: Condition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
}

export interface PageMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export type TransactionType = 'COMPRA' | 'VENDA';

export interface Transaction {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: TransactionType;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface Purchase extends Transaction {
  contract: {
    purchase_value: number;
    loyalty_until: string;
    status: string;
  };
  club_cash: number;
}

export interface SquadPlayer extends Player {
  contract: {
    purchase_value: number;
    loyalty_until: string;
    remaining_days: number;
    penalty_rate: number;
  };
}

export interface ClubDetail extends Club {
  players: SquadPlayer[];
}

export interface Sale extends Transaction {
  profit: number;
  purchase_value: number;
  remaining_days: number;
  penalty_rate: number;
  contract_status: string;
  club_cash: number;
}

export interface TransactionSummary {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

export interface TransactionHistory {
  data: Transaction[];
  summary: TransactionSummary;
}

export type Formation = '3-1' | '2-2' | '2-1-1' | '1-2-1';

export interface Lineup {
  club_id: number;
  formation: Formation | null;
  complete: boolean;
  players: Player[];
}
