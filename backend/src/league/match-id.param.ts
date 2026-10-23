import { Param } from '@nestjs/common';
import { UrlIdPipe } from '../common/pipes/url-id.pipe';
import { MATCH_NOT_FOUND } from './match.errors';

/** Id da partida na URL (`/matches/{id}`); fora do formato, 404 (V8). */
export function MatchIdParam(): ParameterDecorator {
  return Param('id', new UrlIdPipe(MATCH_NOT_FOUND));
}
