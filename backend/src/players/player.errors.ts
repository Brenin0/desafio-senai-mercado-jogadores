export const PLAYER_NOT_FOUND = 'Jogador não encontrado.';

export const POSITION_LOCKED_BY_CLUB = 'Jogador com clube não muda de posição.';

export function ageDecreaseMessage(currentAge: number): string {
  return `A idade não pode diminuir: o jogador tem ${currentAge} anos.`;
}

export const SICK_TO_FIT =
  'Jogador DOENTE não volta direto para APTO: passe antes por MAL_CONDICIONADO.';
