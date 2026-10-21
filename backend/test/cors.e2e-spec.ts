import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from './create-test-app';

const FRONTEND_ORIGIN = 'http://localhost:5173';

describe('CORS', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('libera só a origem do frontend, lida de FRONTEND_ORIGIN', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/v1/players')
      .set('Origin', FRONTEND_ORIGIN)
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBe(
      FRONTEND_ORIGIN,
    );
  });

  it('não reflete nem libera outra origem', async () => {
    const response = await request(app.getHttpServer())
      .options('/api/v1/players')
      .set('Origin', 'http://outro-site.com')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.headers['access-control-allow-origin']).toBe(
      FRONTEND_ORIGIN,
    );
  });
});
