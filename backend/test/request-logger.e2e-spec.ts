import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from './create-test-app';

describe('Log de requisições (diferencial B5)', () => {
  let app: NestExpressApplication;
  let loggedLines: string[];

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => {
    loggedLines = [];
    jest.spyOn(Logger.prototype, 'log').mockImplementation((message) => {
      loggedLines.push(String(message));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra uma única linha para a requisição, com método, caminho e status', async () => {
    await request(app.getHttpServer()).get('/api/v1/inexistente?page=1');

    expect(loggedLines).toHaveLength(1);
    expect(loggedLines[0]).toMatch(
      /^GET \/api\/v1\/inexistente\?page=1 404 \d+ms$/,
    );
  });

  it('registra também a requisição recusada pelo parser JSON', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/players')
      .set('Content-Type', 'application/json')
      .send('{"name": }');

    expect(loggedLines).toHaveLength(1);
    expect(loggedLines[0]).toMatch(/^POST \/api\/v1\/players 400 \d+ms$/);
  });
});
