import { ApiProperty } from '@nestjs/swagger';
import type { Formation } from '../../domain/lineup';
import type {
  DuelAttribute,
  MatchCondition,
  MatchOutcome,
} from '../../domain/match-engine';
import type { Position } from '../../domain/player';

/** Um dos clubes da partida, com a formação e os gols do momento (RN20). */
export class MatchClubResponseDto {
  club_id!: number;
  club_name!: string;
  formation!: Formation;
  goals!: number;
}

/** Jogador no duelo, com o nome, a posição e a condição do momento e o valor já com a condição. */
export class DuelPlayerResponseDto {
  player_id!: number;
  player_name!: string;
  position!: Position;
  condition!: MatchCondition;
  attribute!: DuelAttribute;
  value!: number;
}

/** Duelo: 1 a 3 são os ataques do mandante; 4 a 6, os do visitante (RN20). */
export class DuelResponseDto {
  order!: number;
  attacking_club_id!: number;

  @ApiProperty({ type: () => DuelPlayerResponseDto })
  attacker!: DuelPlayerResponseDto;

  @ApiProperty({ type: () => DuelPlayerResponseDto })
  defender!: DuelPlayerResponseDto;

  /** O ataque foi maior que a defesa. */
  goal!: boolean;
}

/** Partida sem os duelos, como em GET /matches (RN21). */
export class MatchSummaryResponseDto {
  id!: number;

  @ApiProperty({ example: '2026-11-12T15:00:00-03:00' })
  played_at!: string;

  @ApiProperty({ type: () => MatchClubResponseDto })
  home!: MatchClubResponseDto;

  @ApiProperty({ type: () => MatchClubResponseDto })
  away!: MatchClubResponseDto;

  result!: MatchOutcome;
}

/** Partida com os 6 duelos (2.4.2): resposta de POST /matches e de GET /matches/{id}. */
export class MatchResponseDto extends MatchSummaryResponseDto {
  @ApiProperty({ type: () => [DuelResponseDto] })
  duels!: DuelResponseDto[];
}
