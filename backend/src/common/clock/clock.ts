import { Injectable } from '@nestjs/common';

/** Instante exato do servidor no momento da operação (RN01). Nos testes, é trocado por um relógio fixo. */
@Injectable()
export class Clock {
  now(): Date {
    return new Date();
  }
}
