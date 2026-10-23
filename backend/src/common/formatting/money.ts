import Decimal from 'decimal.js';

/**
 * Valor em moedas com vírgula decimal, pelo menos 2 casas e sem separador de milhar, como no CSV
 * (RN18) e nas mensagens: 50,40; -38,85; 130,575.
 */
export function formatMoney(value: Decimal): string {
  return value.toFixed(Math.max(2, value.decimalPlaces())).replace('.', ',');
}
