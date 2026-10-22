import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { IsOneOf } from '../../common/validators/value.validators';
import { CLUB_SORTS, type ClubSort } from '../../domain/club-listing';

/** Query params de GET /clubs: um só valor de `sort` (Filtros e query params aceitos). */
export class ListClubsQueryDto {
  @ApiPropertyOptional({ enum: CLUB_SORTS, default: 'name' })
  @IsOptional()
  @IsOneOf(CLUB_SORTS)
  sort: ClubSort = 'name';
}
