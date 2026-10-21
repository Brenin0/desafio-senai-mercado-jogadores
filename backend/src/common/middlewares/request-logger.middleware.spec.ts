import { EventEmitter } from 'node:events';
import { Request, Response } from 'express';
import { createRequestLogger } from './request-logger.middleware';

describe('createRequestLogger', () => {
  const request = {
    method: 'POST',
    originalUrl: '/api/v1/players?page=2',
  } as Request;

  function setup() {
    const lines: string[] = [];
    const response = Object.assign(new EventEmitter(), {
      statusCode: 201,
    }) as unknown as Response;
    let nextCalls = 0;
    const middleware = createRequestLogger({
      log: (message: string) => lines.push(message),
    });

    middleware(request, response, () => {
      nextCalls += 1;
    });

    return { lines, response, nextCalls: () => nextCalls };
  }

  it('segue para o próximo middleware sem esperar a resposta', () => {
    const { lines, nextCalls } = setup();

    expect(nextCalls()).toBe(1);
    expect(lines).toEqual([]);
  });

  it('registra uma única linha com método, caminho, status e duração', () => {
    const { lines, response } = setup();

    response.emit('finish');
    response.emit('finish');

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^POST \/api\/v1\/players\?page=2 201 \d+ms$/);
  });
});
