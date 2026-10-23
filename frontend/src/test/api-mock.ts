import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export interface ApiRequest {
  method: string;
  url: URL;
  body: unknown;
}

/** Troca o `fetch` por um que responde pelo `handler` e guarda cada pedido feito. */
export function stubApi(handler: (request: ApiRequest) => Response) {
  const requests: ApiRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const request: ApiRequest = {
        method: init?.method ?? 'GET',
        url: new URL(input instanceof Request ? input.url : String(input)),
        body:
          typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      };
      requests.push(request);
      return Promise.resolve(handler(request));
    }),
  );
  return requests;
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}
