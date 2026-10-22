/** Maior id do banco (inteiro de 32 bits): acima dele, o id não existe (V8). */
export const MAX_INTEGER = 2_147_483_647;

const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

/**
 * Inteiro positivo escrito só com dígitos, sem sinal, sem zeros à esquerda, sem ponto e sem expoente,
 * até 2.147.483.647 (V8 e query params). Devolve null para qualquer outra forma.
 */
export function parsePositiveInteger(text: string): number | null {
  if (!POSITIVE_INTEGER_PATTERN.test(text)) {
    return null;
  }
  const value = Number(text);
  return value <= MAX_INTEGER ? value : null;
}
