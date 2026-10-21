import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from './create-test-app';

describe('Documentação interativa (diferencial B5)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('abre a interface do Swagger em /api/docs', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/^text\/html/);
  });

  it('publica o documento OpenAPI da API', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs-json');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      openapi: expect.stringMatching(/^3\./) as unknown,
      info: { title: 'Passe API' },
    });
  });
});
