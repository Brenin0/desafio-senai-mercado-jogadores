import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IsInt, Min } from 'class-validator';
import request from 'supertest';
import { INTERNAL_ERROR_MESSAGE } from '../src/common/filters/all-exceptions.filter';
import { INVALID_JSON_MESSAGE } from '../src/common/middlewares/reject-invalid-json.middleware';
import { BODY_MUST_BE_OBJECT_MESSAGE } from '../src/common/pipes/body-must-be-object.pipe';
import { createTestApp } from './create-test-app';

class SampleDto {
  @IsInt({ message: 'quantity deve ser um inteiro' })
  @Min(1, { message: 'quantity deve ser pelo menos 1' })
  quantity!: number;
}

@Controller('samples')
class SampleController {
  @Post()
  create(@Body() body: SampleDto): SampleDto {
    return body;
  }

  @Post('without-body')
  withoutBody(): { ok: boolean } {
    return { ok: true };
  }

  @Get('missing')
  missing(): never {
    throw new NotFoundException('Jogador não encontrado.');
  }

  @Get('conflict')
  conflict(): never {
    throw new ConflictException('Regra de negócio violada.');
  }

  @Get('crash')
  crash(): never {
    throw new Error('detalhe interno que não pode vazar');
  }
}

describe('Erros e validação da entrada (V1, V2, V7, V9)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp([SampleController]);
  });

  afterAll(async () => {
    await app.close();
  });

  const postJson = (path: string, body: string) =>
    request(app.getHttpServer())
      .post(path)
      .set('Content-Type', 'application/json')
      .send(body);

  function expectJsonError(response: request.Response, status: number): string {
    expect(response.status).toBe(status);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(Object.keys(response.body as object)).toEqual(['message']);
    const { message } = response.body as { message: unknown };
    expect(typeof message).toBe('string');
    expect(message).not.toBe('');
    return message as string;
  }

  describe('V1 · corpo da requisição', () => {
    it('recusa JSON malformado com 400', async () => {
      const response = await postJson('/api/v1/samples', '{"quantity": }');

      expect(expectJsonError(response, 400)).toBe(INVALID_JSON_MESSAGE);
    });

    it.each(['[]', '[{"quantity": 1}]', '"x"', '10', 'null', 'true'])(
      'recusa corpo que não é objeto com 400: %s',
      async (body) => {
        const response = await postJson('/api/v1/samples', body);

        expect(expectJsonError(response, 400)).toBe(
          BODY_MUST_BE_OBJECT_MESSAGE,
        );
      },
    );

    it('ignora o corpo enviado a um endpoint sem corpo', async () => {
      const response = await postJson('/api/v1/samples/without-body', '[]');

      expect(response.status).toBe(201);
    });
  });

  describe('V2 · tipos, sem conversão implícita', () => {
    it('recusa número enviado como texto', async () => {
      const response = await postJson('/api/v1/samples', '{"quantity": "15"}');

      expectJsonError(response, 400);
    });

    it('recusa parte fracionária em campo inteiro', async () => {
      const response = await postJson('/api/v1/samples', '{"quantity": 50.5}');

      expectJsonError(response, 400);
    });

    it('aceita 50.0 como o inteiro 50', async () => {
      const response = await postJson('/api/v1/samples', '{"quantity": 50.0}');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ quantity: 50 });
    });
  });

  describe('V6 e V7 · campos ausentes e desconhecidos', () => {
    it('recusa campo obrigatório ausente', async () => {
      const response = await postJson('/api/v1/samples', '{}');

      expectJsonError(response, 400);
    });

    it('ignora campo desconhecido, sem erro', async () => {
      const response = await postJson(
        '/api/v1/samples',
        '{"quantity": 2, "market_value": 99, "Quantity": 5}',
      );

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ quantity: 2 });
    });
  });

  describe('V9 · códigos de erro sempre com message', () => {
    it('responde 404 para caminho fora da API', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/inexistente',
      );

      expect(expectJsonError(response, 404)).toContain('/api/v1/inexistente');
    });

    it('responde 404 para método não previsto num caminho que existe', async () => {
      const response = await request(app.getHttpServer()).delete(
        '/api/v1/samples',
      );

      expectJsonError(response, 404);
    });

    it('mantém a mensagem do 404 de recurso inexistente', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/samples/missing',
      );

      expect(expectJsonError(response, 404)).toBe('Jogador não encontrado.');
    });

    it('responde 409 com a mensagem da regra de negócio', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/samples/conflict',
      );

      expect(expectJsonError(response, 409)).toBe('Regra de negócio violada.');
    });

    it('responde 500 sem stack trace nem detalhe interno', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/samples/crash',
      );

      expect(expectJsonError(response, 500)).toBe(INTERNAL_ERROR_MESSAGE);
      expect(response.text).not.toContain('detalhe interno');
      expect(response.text).not.toContain('at ');
    });
  });
});
