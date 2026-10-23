export const MATCH_NOT_FOUND = 'Partida não encontrada.';

export function incompleteLineupMessage(clubName: string): string {
  return `O clube ${clubName} não tem a escalação completa, com os 5 titulares, e não pode jogar.`;
}
