const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Moeda com 2 casas e vírgula decimal, como a API devolve o valor (sem recalcular). */
export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Data e hora no horário de Brasília, como "02/03/2027 10:15". */
export function formatDateTime(value: string): string {
  const parts = Object.fromEntries(
    dateTimeFormatter
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`;
}
