import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

const FRONTEND_ORIGIN = 'http://localhost:5173';

describe('CORS', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
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
