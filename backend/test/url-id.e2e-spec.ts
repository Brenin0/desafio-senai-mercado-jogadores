import { Controller, Get, Param } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { UrlIdPipe } from '../src/common/pipes/url-id.pipe';
import { createTestApp } from './create-test-app';

const NOT_FOUND_MESSAGE = 'Amostra não encontrada.';

@Controller('samples')
class SampleController {
  @Get(':id')
  find(@Param('id', new UrlIdPipe(NOT_FOUND_MESSAGE)) id: number): {
    id: number;
  } {
    return { id };
  }
}

describe('Id da URL (V8)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp([SampleController]);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['1', 1],
    ['2147483647', 2147483647],
  ])('aceita o id %s como número', async (id, expected) => {
    const response = await request(app.getHttpServer()).get(
      `/api/v1/samples/${id}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: expected });
  });

  it.each(['abc', '0', '-1', '1.5', '01', '+1', '1e3', '2147483648'])(
    'responde 404 com message para o id %s',
    async (id) => {
      const response = await request(app.getHttpServer()).get(
        `/api/v1/samples/${id}`,
      );

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(/^application\/json/);
      expect(response.body).toEqual({ message: NOT_FOUND_MESSAGE });
    },
  );
});
