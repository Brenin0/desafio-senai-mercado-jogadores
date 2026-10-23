/**
 * Data e hora digitadas na tela (campo `datetime-local`, "AAAA-MM-DDTHH:MM") são do horário de
 * Brasília e vão para a API no formato da RN01: "AAAA-MM-DDTHH:MM-03:00".
 */
export function toApiDateTime(localValue: string): string {
  return `${localValue.slice(0, 16)}-03:00`;
}
