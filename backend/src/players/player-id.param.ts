import { Param } from '@nestjs/common';
import { UrlIdPipe } from '../common/pipes/url-id.pipe';
import { PLAYER_NOT_FOUND } from './player.errors';

/** Id do jogador na URL (`/players/{id}`); fora do formato, 404 (V8). */
export function PlayerIdParam(): ParameterDecorator {
  return Param('id', new UrlIdPipe(PLAYER_NOT_FOUND));
}
