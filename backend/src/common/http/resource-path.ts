export const API_PREFIX = 'api/v1';

/** Convenções da API: caminho do recurso criado, a partir da raiz do servidor, para o cabeçalho Location. */
export function resourcePath(resource: string, id: number): string {
  return `/${API_PREFIX}/${resource}/${id}`;
}
