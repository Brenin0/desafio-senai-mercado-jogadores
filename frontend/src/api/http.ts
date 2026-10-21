const DEFAULT_API_ORIGIN = 'http://localhost:3000';
const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar à API. Confira se o backend está no ar.';

export const API_BASE_URL = `${(import.meta.env.VITE_API_URL || DEFAULT_API_ORIGIN).replace(/\/+$/, '')}/api/v1`;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type QueryValue = string | number | boolean | undefined;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
}

export async function request<T>(
  path: string,
  { method = 'GET', body, query }: RequestOptions = {},
): Promise<T> {
  const response = await send(buildUrl(path, query), method, body);
  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function buildUrl(
  path: string,
  query: Record<string, QueryValue> = {},
): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.append(name, String(value));
    }
  }
  const search = params.toString();
  return `${API_BASE_URL}${path}${search ? `?${search}` : ''}`;
}

async function send(
  url: string,
  method: string,
  body: unknown,
): Promise<Response> {
  try {
    return await fetch(url, {
      method,
      headers:
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `A API recusou o pedido (código ${response.status}).`;
  try {
    const data: unknown = await response.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string' &&
      data.message !== ''
    ) {
      return data.message;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
