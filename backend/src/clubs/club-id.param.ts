import { Param } from '@nestjs/common';
import { UrlIdPipe } from '../common/pipes/url-id.pipe';
import { CLUB_NOT_FOUND } from './club.errors';

/** Id do clube na URL (`/clubs/{id}`); fora do formato, 404 (V8). */
export function ClubIdParam(): ParameterDecorator {
  return Param('id', new UrlIdPipe(CLUB_NOT_FOUND));
}
