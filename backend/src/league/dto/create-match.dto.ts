import { applyDecorators } from '@nestjs/common';
import {
  IsDifferentFrom,
  IsIntegerBetween,
  IsRequired,
} from '../../common/validators/value.validators';

/** Corpo de POST /matches (2.4.2); outros campos são ignorados (V7). */
export class CreateMatchDto {
  /** Clube mandante: inteiro positivo; 0, negativo, texto ou fração → 400. */
  @IsRequired()
  @IsIntegerBetween(1)
  home_club_id!: number;

  /** Clube visitante: inteiro positivo, diferente do mandante. */
  @IsRequired()
  @applyDecorators(IsIntegerBetween(1), IsDifferentFrom('home_club_id'))
  away_club_id!: number;
}
