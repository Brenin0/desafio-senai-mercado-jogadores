import { MAX_CLUBS } from '../domain/club';

export const CLUB_NOT_FOUND = 'Clube não encontrado.';

export const LEAGUE_FULL = `A liga já tem ${MAX_CLUBS} clubes, o máximo permitido.`;

export function clubNameTakenMessage(name: string): string {
  return `Já existe um clube com o nome "${name}".`;
}

export function acronymTakenMessage(acronym: string): string {
  return `A sigla ${acronym} já é de outro clube.`;
}
