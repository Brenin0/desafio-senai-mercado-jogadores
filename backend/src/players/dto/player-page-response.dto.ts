import { ApiProperty } from '@nestjs/swagger';
import { PlayerResponseDto } from './player-response.dto';

/** RN07: `total_items` conta todos os que atendem à busca e aos filtros, não só os da página. */
export class PageMetaDto {
  page!: number;
  limit!: number;
  total_items!: number;
  total_pages!: number;
}

/**
 * Resposta de GET /players (2.1.1). Os campos que são outra classe declaram o tipo no @ApiProperty:
 * numa pasta com acento, o plugin do Swagger aponta o tipo para um caminho de `src` que não existe
 * depois do build.
 */
export class PlayerPageResponseDto {
  @ApiProperty({ type: () => [PlayerResponseDto] })
  data!: PlayerResponseDto[];

  @ApiProperty({ type: () => PageMetaDto })
  meta!: PageMetaDto;
}
