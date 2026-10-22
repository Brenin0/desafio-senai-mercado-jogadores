import type { Position } from '../../domain/player';
import {
  IsAge,
  IsAgility,
  IsPlayerName,
  IsPosition,
} from '../validators/player.validators';

/**
 * Corpo de PUT /players/{id} (RN08): os quatro campos editáveis, obrigatórios mesmo que só um mude.
 * Indicadores, potencial, valor base, clube e condição enviados aqui são ignorados sem validar (V7).
 */
export class UpdatePlayerDto {
  @IsPlayerName()
  name!: string;

  @IsPosition()
  position!: Position;

  @IsAgility()
  agility!: number;

  @IsAge()
  age!: number;
}
