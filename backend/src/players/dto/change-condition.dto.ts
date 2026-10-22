import type { Condition } from '../../domain/player';
import { IsCondition } from '../validators/player.validators';

/** Corpo de PATCH /players/{id}/condition; outros campos, como `name`, são ignorados (V7). */
export class ChangeConditionDto {
  @IsCondition()
  condition!: Condition;
}
