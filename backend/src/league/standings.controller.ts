import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StandingResponseDto } from './dto/standing-response.dto';
import { StandingsService } from './standings.service';

@ApiTags('Liga')
@Controller('standings')
export class StandingsController {
  constructor(private readonly standings: StandingsService) {}

  @Get()
  @ApiOkResponse({
    type: [StandingResponseDto],
    description:
      'Todos os clubes: mais pontos, depois saldo de gols, gols marcados e nome',
  })
  list(): Promise<StandingResponseDto[]> {
    return this.standings.list();
  }
}
