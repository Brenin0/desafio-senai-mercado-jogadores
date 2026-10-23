import { ApiProperty } from '@nestjs/swagger';
import { IsBrasiliaDateTime } from '../../common/validators/datetime.validators';
import {
  IsIntegerBetween,
  IsRequired,
} from '../../common/validators/value.validators';

/** Corpo de POST /players/{id}/buy (2.3.1); outros campos são ignorados (V7). */
export class BuyPlayerDto {
  /** Clube comprador: inteiro positivo; 0, negativo, texto ou fração → 400. */
  @IsRequired()
  @IsIntegerBetween(1)
  club_id!: number;

  @ApiProperty({
    type: String,
    example: '2027-03-02T10:15-03:00',
    description:
      'Fim da fidelidade, no formato AAAA-MM-DDTHH:MM-03:00 (RN01): depois do momento da compra e até 1.095 dias depois dele',
  })
  @IsRequired()
  @IsBrasiliaDateTime()
  loyalty_until!: Date;
}
