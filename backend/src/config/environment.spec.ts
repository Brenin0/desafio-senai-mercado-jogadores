import { validateEnvironment } from './environment';

const FRONTEND_ORIGIN = 'http://localhost:5173';

describe('validateEnvironment', () => {
  it('aceita a origem do frontend e usa a porta 3000 por padrão', () => {
    const environment = validateEnvironment({ FRONTEND_ORIGIN });

    expect(environment.PORT).toBe(3000);
    expect(environment.FRONTEND_ORIGIN).toBe(FRONTEND_ORIGIN);
  });

  it('converte PORT de texto para número', () => {
    expect(validateEnvironment({ FRONTEND_ORIGIN, PORT: '8080' }).PORT).toBe(
      8080,
    );
  });

  it('recusa FRONTEND_ORIGIN ausente', () => {
    expect(() => validateEnvironment({})).toThrow(/FRONTEND_ORIGIN/);
  });

  it.each([
    'http://localhost:5173/',
    'http://localhost:5173/app',
    'localhost:5173',
    '*',
  ])('recusa FRONTEND_ORIGIN que não é uma origem: %s', (origin) => {
    expect(() => validateEnvironment({ FRONTEND_ORIGIN: origin })).toThrow(
      /FRONTEND_ORIGIN/,
    );
  });

  it.each(['0', '65536', 'abc', '3000.5'])(
    'recusa PORT inválida: %s',
    (port) => {
      expect(() =>
        validateEnvironment({ FRONTEND_ORIGIN, PORT: port }),
      ).toThrow(/PORT/);
    },
  );
});
