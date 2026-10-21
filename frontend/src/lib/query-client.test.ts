import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/http.ts';
import { createQueryClient, shouldRetryQuery } from './query-client.ts';

describe('shouldRetryQuery', () => {
  it.each([400, 404, 409])(
    'não repete a consulta recusada pela API com %i',
    (status) => {
      expect(shouldRetryQuery(0, new ApiError(status, 'recusado'))).toBe(false);
    },
  );

  it('repete uma vez a consulta que falhou por rede ou erro do servidor', () => {
    expect(shouldRetryQuery(0, new ApiError(0, 'sem rede'))).toBe(true);
    expect(shouldRetryQuery(0, new ApiError(500, 'erro'))).toBe(true);
    expect(shouldRetryQuery(1, new ApiError(0, 'sem rede'))).toBe(false);
  });
});

describe('createQueryClient', () => {
  it('não repete as ações (mutações)', () => {
    const options = createQueryClient().getDefaultOptions();

    expect(options.mutations?.retry).toBe(false);
    expect(options.queries?.refetchOnWindowFocus).toBe(false);
  });
});
