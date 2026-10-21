import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/http.ts';

const MAX_QUERY_RETRIES = 1;

export function shouldRetryQuery(failureCount: number, error: Error): boolean {
  const refusedByApi =
    error instanceof ApiError && error.status >= 400 && error.status < 500;
  return !refusedByApi && failureCount < MAX_QUERY_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
