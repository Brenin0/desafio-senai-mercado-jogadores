import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Prefixos das consultas: invalidar um prefixo atualiza todas as consultas daquele recurso. */
export const queryKeys = {
  players: ['players'],
  clubs: ['clubs'],
  transactions: ['transactions'],
  lineups: ['lineups'],
} as const;

/** Depois de uma ação, pede de novo à API os recursos que ela mudou. */
export function invalidate(
  queryClient: QueryClient,
  keys: readonly QueryKey[],
): Promise<void[]> {
  return Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}
