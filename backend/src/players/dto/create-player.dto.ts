import type { Position } from '../../domain/player';
import {
  IsAge,
  IsAgility,
  IsAttribute,
  IsPlayerName,
  IsPosition,
  IsPotential,
} from '../validators/player.validators';

/**
 * Corpo de POST /players. Os campos calculados ou controlados pelo sistema (`id`, `base_value`,
 * `market_value`, `overall`, `club_id` e `condition`) não fazem parte dele e são ignorados (V7).
 */
export class CreatePlayerDto {
  @IsPlayerName()
  name!: string;

  @IsPosition()
  position!: Position;

  @IsAgility()
  agility!: number;

  @IsAge()
  age!: number;

  @IsAttribute()
  pace!: number;

  @IsAttribute()
  shooting!: number;

  @IsAttribute()
  passing!: number;

  @IsAttribute()
  dribbling!: number;

  @IsAttribute()
  defending!: number;

  @IsAttribute()
  physical!: number;

  @IsPotential()
  potential!: number;
}
