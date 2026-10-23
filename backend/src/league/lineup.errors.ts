import { Formation, FORMATION_SECTORS } from '../domain/lineup';

export function playerOutsideSquadMessage(name: string): string {
  return `O jogador ${name} não é do elenco deste clube.`;
}

export function sickStarterMessage(name: string): string {
  return `O jogador ${name} está DOENTE e não pode ser escalado.`;
}

/** Ex.: "... a formação 2-1-1: ela pede 1 GOL, 2 entre ZAG e LAT, 1 MEI e 1 ATA." */
export function formationMismatchMessage(formation: Formation): string {
  const { defense, midfield, attack } = FORMATION_SECTORS[formation];
  const parts = [
    '1 GOL',
    `${defense} entre ZAG e LAT`,
    ...(midfield > 0 ? [`${midfield} MEI`] : []),
  ];
  return `As posições dos titulares não fecham a formação ${formation}: ela pede ${parts.join(', ')} e ${attack} ATA.`;
}
