import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '../test/api-mock.ts';
import { API_BASE_URL, ApiError, buildUrl, request } from './http.ts';

describe('buildUrl', () => {
  it('acrescenta /api/v1 à origem da API, sem barra no final', () => {
    expect(API_BASE_URL).toMatch(/^https?:\/\/[^/]+\/api\/v1$/);
  });

  it('monta a query sem os parâmetros vazios ou ausentes', () => {
    expect(
      buildUrl('/players', {
        page: 2,
        search: 'lua',
        position: undefined,
        condition: '',
      }),
    ).toBe(`${API_BASE_URL}/players?page=2&search=lua`);
  });

  it('não acrescenta "?" quando não há parâmetros', () => {
    expect(buildUrl('/clubs')).toBe(`${API_BASE_URL}/clubs`);
  });
});

describe('request', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('faz o GET sem corpo e devolve o JSON da resposta', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 2, name: 'Meia Lua' }));

    await expect(request('/players/2')).resolves.toEqual({
      id: 2,
      name: 'Meia Lua',
    });
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/players/2`, {
      method: 'GET',
      headers: undefined,
      body: undefined,
    });
  });

  it('envia o corpo em JSON com Content-Type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }, 201));

    await request('/clubs', {
      method: 'POST',
      body: { name: 'Águias FC', acronym: 'AGU' },
    });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/clubs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Águias FC","acronym":"AGU"}',
    });
  });

  it('devolve undefined numa resposta 204, sem corpo', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      request('/players/9', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  it('recusa com o status e o message devolvidos pela API', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Sigla já cadastrada.' }, 409),
    );

    const error = await request('/clubs', { method: 'POST', body: {} }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      message: 'Sigla já cadastrada.',
    });
  });

  it('usa uma mensagem própria quando a recusa não traz message', async () => {
    fetchMock.mockResolvedValue(new Response('<html></html>', { status: 502 }));

    await expect(request('/players')).rejects.toMatchObject({
      status: 502,
      message: 'A API recusou o pedido (código 502).',
    });
  });

  it('transforma a falha de rede num erro com status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(request('/players')).rejects.toMatchObject({
      status: 0,
      message:
        'Não foi possível conectar à API. Confira se o backend está no ar.',
    });
  });
});
