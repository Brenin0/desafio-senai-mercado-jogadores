import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import Decimal from 'decimal.js';
import {
  IsNotGreaterThan,
  IsNotTrueWith,
  IsQueryBoolean,
  IsQueryDecimal,
  IsQueryInteger,
  IsQuerySort,
} from '../../common/validators/query.validators';
import { IsNormalizedText } from '../../common/validators/text.validators';
import { IsOneOf } from '../../common/validators/value.validators';
import {
  CONDITIONS,
  POSITIONS,
  type Condition,
  type Position,
} from '../../domain/player';
import {
  MAX_PLAYER_SORT_CRITERIA,
  PLAYER_SORT_CRITERIA,
} from '../../domain/player-listing';

/**
 * Query params de GET /players (Filtros e query params aceitos). Ausente usa o padrão; presente e
 * vazio, ou fora da forma aceita, é recusado com 400; nome fora da tabela é ignorado.
 */
export class ListPlayersQueryDto {
  @IsOptional()
  @IsNormalizedText(2, 100)
  search?: string;

  @IsOptional()
  @IsOneOf(POSITIONS)
  position?: Position;

  @IsOptional()
  @IsOneOf(CONDITIONS)
  condition?: Condition;

  @IsOptional()
  @IsQueryBoolean()
  @IsNotTrueWith('club_id')
  free?: boolean;

  @IsOptional()
  @IsQueryInteger()
  club_id?: number;

  @IsOptional()
  @IsQueryInteger(16, 45)
  @IsNotGreaterThan('max_age')
  min_age?: number;

  @IsOptional()
  @IsQueryInteger(16, 45)
  max_age?: number;

  @ApiPropertyOptional({ type: String, example: '10.5' })
  @IsOptional()
  @IsQueryDecimal(0, 550)
  @IsNotGreaterThan('max_value')
  min_value?: Decimal;

  @ApiPropertyOptional({ type: String, example: '50' })
  @IsOptional()
  @IsQueryDecimal(0, 550)
  max_value?: Decimal;

  @ApiPropertyOptional({
    description: `Até ${MAX_PLAYER_SORT_CRITERIA} critérios separados por vírgula: ${PLAYER_SORT_CRITERIA.join(', ')}`,
    example: 'position,value_desc',
  })
  @IsOptional()
  @IsQuerySort(PLAYER_SORT_CRITERIA, MAX_PLAYER_SORT_CRITERIA)
  sort: string = 'name';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsQueryInteger()
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsQueryInteger(1, 50)
  limit: number = 10;
}
