import { ApiProperty } from '@nestjs/swagger';
import { PlayerResponseDto } from '../../players/dto/player-response.dto';
import { ClubResponseDto } from './club-response.dto';

/** RN11 e RN15: contrato do jogador, com os dias restantes e o percentual de multa se fosse vendido agora. */
export class ContractResponseDto {
  purchase_value!: number;
  @ApiProperty({ example: '2027-03-02T10:15:00-03:00' })
  loyalty_until!: string;
  remaining_days!: number;
  penalty_rate!: number;
}

/** Jogador do elenco: os campos de GET /players/{id} e o contrato. */
export class ClubPlayerResponseDto extends PlayerResponseDto {
  @ApiProperty({ type: () => ContractResponseDto })
  contract!: ContractResponseDto;
}

/** Resposta de GET /clubs/{id} (2.2.2): o clube com o elenco na ordem da RN11. */
export class ClubDetailResponseDto extends ClubResponseDto {
  @ApiProperty({ type: () => [ClubPlayerResponseDto] })
  players!: ClubPlayerResponseDto[];
}
