import { NotFoundException, PipeTransform } from '@nestjs/common';
import { parsePositiveInteger } from '../parsing/positive-integer';

/**
 * V8: id da URL fora do formato (como `abc`, `0`, `-1`, `1.5` e `01`) ou acima de 2.147.483.647
 * conta como recurso inexistente: 404, com a mensagem do recurso.
 */
export class UrlIdPipe implements PipeTransform<unknown, number> {
  constructor(private readonly notFoundMessage: string) {}

  transform(value: unknown): number {
    const id = typeof value === 'string' ? parsePositiveInteger(value) : null;
    if (id === null) {
      throw new NotFoundException(this.notFoundMessage);
    }
    return id;
  }
}
