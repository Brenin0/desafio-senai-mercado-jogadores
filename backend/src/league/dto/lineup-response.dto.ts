import { ApiProperty } from '@nestjs/swagger';
import { Formation, FORMATIONS } from '../../domain/lineup';
import { PlayerResponseDto } from '../../players/dto/player-response.dto';

/** Resposta de PUT e GET /clubs/{id}/lineup (RN19). */
export class LineupResponseDto {
  club_id!: number;

  @ApiProperty({
    enum: FORMATIONS,
    nullable: true,
    description: 'Formação salva; null enquanto o clube não escalou',
  })
  formation!: Formation | null;

  /** true só com a formação salva e os 5 titulares. */
  complete!: boolean;

  @ApiProperty({
    type: () => [PlayerResponseDto],
    description:
      'Titulares na ordem do elenco (RN11), cada um com os campos de GET /players/{id}',
  })
  players!: PlayerResponseDto[];
}
