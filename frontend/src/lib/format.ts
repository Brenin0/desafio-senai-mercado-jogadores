const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Moeda com 2 casas e vírgula decimal, como a API devolve o valor (sem recalcular). */
export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}
