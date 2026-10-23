export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** O horário de Brasília é sempre −03:00, sem horário de verão (RN01). */
const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;

const INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})-03:00$/;

/**
 * RN01: lê AAAA-MM-DDTHH:MM-03:00. Devolve null para outro formato e para data ou hora
 * inexistente, que nunca é ajustada. Não depende do fuso da máquina.
 */
export function parseBrasiliaDateTime(text: string): Date | null {
  const match = INPUT_PATTERN.exec(text);
  if (!match) {
    return null;
  }
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (hour > 23 || minute > 59) {
    return null;
  }
  const wallClock = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const sameDate =
    wallClock.getUTCFullYear() === year &&
    wallClock.getUTCMonth() === month - 1 &&
    wallClock.getUTCDate() === day;
  return sameDate ? new Date(wallClock.getTime() + BRASILIA_OFFSET_MS) : null;
}

/** RN01: escreve AAAA-MM-DDTHH:MM:SS-03:00, sem os milissegundos. Não depende do fuso da máquina. */
export function formatBrasiliaDateTime(date: Date): string {
  const wallClock = new Date(date.getTime() - BRASILIA_OFFSET_MS);
  return `${wallClock.toISOString().slice(0, 19)}-03:00`;
}
