import { Condition, Position } from '../../domain/player';

/** Jogador nas respostas (2.1.2): `overall` e `market_value` calculados a cada consulta (RN05, RN06). */
export class PlayerResponseDto {
  id!: number;
  name!: string;
  position!: Position;
  agility!: number;
  age!: number;
  condition!: Condition;
  base_value!: number;
  market_value!: number;
  pace!: number;
  shooting!: number;
  passing!: number;
  dribbling!: number;
  defending!: number;
  physical!: number;
  potential!: number;
  overall!: number;
  club_id!: number | null;
}
