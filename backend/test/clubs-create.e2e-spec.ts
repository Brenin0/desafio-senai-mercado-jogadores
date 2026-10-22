import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './create-test-app';
import { clearDatabase } from './database';
import { expectRefusal } from './expectations';

/** 21 nomes com siglas válidas e distintas: "Clube Alfa" → CUA, "Clube Bravo" → CUB… */
const LEAGUE = [
  'Alfa',
  'Bravo',
  'Charlie',
  'Delta',
  'Echo',
  'Foxtrot',
  'Golf',
  'Hotel',
  'India',
  'Juliett',
  'Kilo',
  'Lima',
  'Mike',
  'November',
  'Oscar',
  'Papa',
  'Quebec',
  'Romeo',
  'Sierra',
  'Tango',
  'Uniform',
].map((word) => ({ name: `Clube ${word}`, acronym: `CU${word[0]}` }));

describe('Criação de clubes (2.2.1, RN10)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await clearDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const createClub = (body: object) =>
    request(app.getHttpServer()).post('/api/v1/clubs').send(body);

  it('201: cria o Águias FC com 300,00 em caixa, sem jogadores, e Location', async () => {
    const response = await createClub({ name: 'Águias FC', acronym: 'AGU' });

    expect(response.status).toBe(201);
    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toEqual({
      id: expect.any(Number) as number,
      name: 'Águias FC',
      acronym: 'AGU',
      cash: 300,
      squad_value: 0,
      net_worth: 300,
    });
    const { id } = response.body as { id: number };
    expect(response.headers.location).toBe(`/api/v1/clubs/${id}`);
  });

  it('V7: ignora caixa, id e campos calculados enviados no corpo', async () => {
    const response = await createClub({
      name: 'Águias FC',
      acronym: 'AGU',
      id: 999,
      cash: 5000,
      squad_value: 10,
      net_worth: 10,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ cash: 300, net_worth: 300 });
    expect((response.body as { id: number }).id).not.toBe(999);
  });

  it('V4: grava o nome com os espaços normalizados', async () => {
    const response = await createClub({
      name: '  Águias    FC ',
      acronym: 'AGU',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ name: 'Águias FC' });
  });

  it.each([
    ['AGU', 'Águias FC'],
    ['AFC', 'Águias FC'],
    ['ASC', 'Águias FC'],
    ['FCR', 'F.C. Recife'],
    ['SCR', 'Santa-Cruz Recife'],
    ['ACC', 'Ação Clube'],
    ['ABC', 'Ana Bela Clube Do Recife'],
    ['AAB', `${'A'.repeat(29)} ${'B'.repeat(30)}`],
  ])('201: aceita a sigla %s para "%s"', async (acronym, name) => {
    const response = await createClub({ name, acronym });

    expect(response.status).toBe(201);
  });

  describe('RN10 · nome único, sem diferenciar maiúsculas e minúsculas, mas considerando acentos', () => {
    beforeEach(async () => {
      await createClub({ name: 'Águias FC', acronym: 'AGU' });
    });

    it('409: "  águias   fc " colide com "Águias FC", sem gravar nada', async () => {
      expectRefusal(
        await createClub({ name: '  águias   fc ', acronym: 'AFC' }),
        409,
      );
      await expect(prisma.club.count()).resolves.toBe(1);
    });

    it('201: "Aguias FC", sem acento, é outro nome', async () => {
      const response = await createClub({ name: 'Aguias FC', acronym: 'AFC' });

      expect(response.status).toBe(201);
    });

    it('409: sigla já cadastrada, sem gravar nada', async () => {
      expectRefusal(
        await createClub({ name: 'Arara Grande Unida', acronym: 'AGU' }),
        409,
      );
      await expect(prisma.club.count()).resolves.toBe(1);
    });
  });

  it('409: a liga aceita no máximo 20 clubes; o 21º é recusado sem gravar nada', async () => {
    for (const club of LEAGUE.slice(0, 20)) {
      const response = await createClub(club);
      expect(response.status).toBe(201);
    }

    expectRefusal(await createClub(LEAGUE[20]), 409);
    await expect(prisma.club.count()).resolves.toBe(20);
  });

  describe('400, sem gravar nada', () => {
    afterEach(async () => {
      await expect(prisma.club.count()).resolves.toBe(0);
    });

    it.each([
      ['nome com 2 caracteres', { name: 'FC', acronym: 'FCX' }],
      ['nome com 1 palavra', { name: 'Flamengo', acronym: 'FLA' }],
      [
        'nome com 6 palavras',
        { name: 'Ana Bela Clube Do Recife Sul', acronym: 'ABC' },
      ],
      [
        'nome com 61 caracteres',
        { name: `${'A'.repeat(30)} ${'B'.repeat(30)}`, acronym: 'AAB' },
      ],
      ['nome com dígito', { name: 'Clube 1 FC', acronym: 'CFC' }],
      ['nome com &', { name: 'Águias & FC', acronym: 'AFC' }],
      ['nome com apóstrofo', { name: "D'Ávila FC", acronym: 'DFC' }],
      ['nome com tabulação', { name: 'Águias\tFC', acronym: 'AFC' }],
      ['nome que fica vazio depois da V4', { name: '   ', acronym: 'AFC' }],
      ['nome numérico', { name: 123, acronym: 'AFC' }],
      [
        'sigla que não começa pela primeira letra do nome',
        { name: 'Águias FC', acronym: 'GFC' },
      ],
      ['sigla fora de ordem', { name: 'Águias FC', acronym: 'ACF' }],
      ['sigla em minúsculas', { name: 'Águias FC', acronym: 'agu' }],
      ['sigla com acento', { name: 'Águias FC', acronym: 'ÁGU' }],
      ['sigla com 2 letras', { name: 'Águias FC', acronym: 'AG' }],
      ['sigla com 4 letras', { name: 'Águias FC', acronym: 'AGUA' }],
      [
        'sigla com espaço (a V4 não vale para a sigla)',
        { name: 'Águias FC', acronym: ' AGU' },
      ],
      [
        'sigla com três letras iguais',
        { name: 'Arara Azul Atlético', acronym: 'AAA' },
      ],
      ['sigla numérica', { name: 'Águias FC', acronym: 123 }],
      ['nome ausente', { acronym: 'AGU' }],
      ['sigla ausente', { name: 'Águias FC' }],
      ['nome nulo', { name: null, acronym: 'AGU' }],
      ['sigla nula', { name: 'Águias FC', acronym: null }],
    ])('recusa %s', async (_, body) => {
      expectRefusal(await createClub(body), 400);
    });

    it('V1: recusa corpo que não é objeto', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/clubs')
        .set('Content-Type', 'application/json')
        .send('[{"name": "Águias FC", "acronym": "AGU"}]');

      expectRefusal(response, 400);
    });
  });
});
