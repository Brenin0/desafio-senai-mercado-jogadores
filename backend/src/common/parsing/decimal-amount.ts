import Decimal from 'decimal.js';

const DECIMAL_AMOUNT_PATTERN = /^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$/;

/**
 * Valor em moedas da query, na forma `10`, `10.5` ou `10.55`: sem sinal, sem expoente, sem vírgula e
 * sem zeros à esquerda (`0.5` é aceito). Devolve null para qualquer outra forma.
 */
export function parseDecimalAmount(text: string): Decimal | null {
  return DECIMAL_AMOUNT_PATTERN.test(text) ? new Decimal(text) : null;
}
