import { IsAcronym, IsClubName } from '../validators/club.validators';

/** Corpo de POST /clubs; `cash` e outros campos enviados são ignorados (V7). */
export class CreateClubDto {
  @IsClubName()
  name!: string;

  @IsAcronym()
  acronym!: string;
}
