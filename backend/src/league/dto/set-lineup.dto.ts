import { ApiProperty } from '@nestjs/swagger';
import {
  IsDistinctIdList,
  IsOneOf,
  IsRequired,
} from '../../common/validators/value.validators';
import type { Formation } from '../../domain/lineup';
import { FORMATIONS, LINEUP_SIZE } from '../../domain/lineup';

/** Corpo de PUT /clubs/{id}/lineup (2.4.1); outros campos são ignorados (V7). */
export class SetLineupDto {
  @ApiProperty({
    enum: FORMATIONS,
    example: '2-1-1',
    description:
      'Formação dos 4 jogadores de linha, de trás para frente: defesa (ZAG ou LAT), meio (MEI) e ataque (ATA)',
  })
  @IsRequired()
  @IsOneOf(FORMATIONS)
  formation!: Formation;

  @ApiProperty({
    type: [Number],
    example: [34, 31, 30, 33, 32],
    description: `Os ${LINEUP_SIZE} titulares, em qualquer ordem: 1 GOL e os jogadores de linha de cada setor`,
  })
  @IsRequired()
  @IsDistinctIdList(LINEUP_SIZE)
  player_ids!: number[];
}
