import { IsOptional } from 'class-validator';
import { IsQueryInteger } from '../../common/validators/query.validators';

/**
 * Query params de GET /matches (RN21). Presente e vazio, ou fora da forma aceita, é recusado com
 * 400; nome fora da tabela é ignorado.
 */
export class ListMatchesQueryDto {
  /** Só as partidas em que o clube foi mandante ou visitante. */
  @IsOptional()
  @IsQueryInteger()
  club_id?: number;
}
