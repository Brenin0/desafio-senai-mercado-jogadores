import { validateEnvironment } from './environment';

const FRONTEND_ORIGIN = 'http://localhost:5173';
const DATABASE_URL =
  'postgresql://passe:passe@localhost:5433/passe?schema=public';
const VALID = { FRONTEND_ORIGIN, DATABASE_URL };

describe('validateEnvironment', () => {
  it('aceita a origem do frontend e a conexão do banco, com a porta 3000 por padrão', () => {
    const environment = validateEnvironment(VALID);

    expect(environment.PORT).toBe(3000);
    expect(environment.FRONTEND_ORIGIN).toBe(FRONTEND_ORIGIN);
    expect(environment.DATABASE_URL).toBe(DATABASE_URL);
  });

  it('converte PORT de texto para número', () => {
    expect(validateEnvironment({ ...VALID, PORT: '8080' }).PORT).toBe(8080);
  });

  it('recusa FRONTEND_ORIGIN ausente', () => {
    expect(() => validateEnvironment({ DATABASE_URL })).toThrow(
      /FRONTEND_ORIGIN/,
    );
  });

  it.each([
    'http://localhost:5173/',
    'http://localhost:5173/app',
    'localhost:5173',
    '*',
  ])('recusa FRONTEND_ORIGIN que não é uma origem: %s', (origin) => {
    expect(() =>
      validateEnvironment({ ...VALID, FRONTEND_ORIGIN: origin }),
    ).toThrow(/FRONTEND_ORIGIN/);
  });

  it.each(['0', '65536', 'abc', '3000.5'])(
    'recusa PORT inválida: %s',
    (port) => {
      expect(() => validateEnvironment({ ...VALID, PORT: port })).toThrow(
        /PORT/,
      );
    },
  );

  it('recusa DATABASE_URL ausente', () => {
    expect(() => validateEnvironment({ FRONTEND_ORIGIN })).toThrow(
      /DATABASE_URL/,
    );
  });

  it.each(['mysql://passe:passe@localhost:3306/passe', 'localhost:5433', ''])(
    'recusa DATABASE_URL que não é do PostgreSQL: "%s"',
    (url) => {
      expect(() =>
        validateEnvironment({ ...VALID, DATABASE_URL: url }),
      ).toThrow(/DATABASE_URL/);
    },
  );

  it('aceita o prefixo postgres:// além de postgresql://', () => {
    const url = 'postgres://passe:passe@db:5432/passe';

    expect(
      validateEnvironment({ ...VALID, DATABASE_URL: url }).DATABASE_URL,
    ).toBe(url);
  });
});
