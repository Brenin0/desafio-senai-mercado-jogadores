import { Position } from '../src/domain/player';

/** Atributos que entram nos duelos da partida (RN20). */
export type DuelValues = Partial<
  Record<'shooting' | 'passing' | 'dribbling' | 'defending', number>
>;

/** Titular a cadastrar: nome, posição e os valores que entram no duelo. */
export interface StarterSpec {
  name: string;
  position: Position;
  values?: DuelValues;
}

/** Titulares do Águias FC no exemplo da RN20, na ordem do elenco; o LAT joga MAL_CONDICIONADO. */
export const AGUIAS_STARTERS: StarterSpec[] = [
  { name: 'Rui Prado', position: 'GOL', values: { defending: 77 } },
  { name: 'Téo Brandão', position: 'ZAG', values: { defending: 84 } },
  {
    name: 'Davi Lins',
    position: 'LAT',
    values: { dribbling: 74, defending: 66 },
  },
  { name: 'Lauro Neves', position: 'MEI', values: { passing: 82 } },
  { name: 'Otto Rangel', position: 'ATA', values: { shooting: 75 } },
];

/** Titulares do Delta FC no exemplo da RN20, na ordem do elenco, todos APTO. */
export const DELTA_STARTERS: StarterSpec[] = [
  { name: 'Ivo Teles', position: 'GOL', values: { defending: 72 } },
  { name: 'Hugo Vaz', position: 'ZAG', values: { defending: 84 } },
  {
    name: 'Lino Matos',
    position: 'LAT',
    values: { dribbling: 79, defending: 63 },
  },
  { name: 'Nei Soares', position: 'MEI', values: { passing: 70 } },
  { name: 'Ugo Falcão', position: 'ATA', values: { shooting: 81 } },
];

/**
 * Corpo do cadastro de um titular barato: os atributos que não entram no duelo valem 1, o overall
 * fica baixo e o jogador custa perto do mínimo de 1,00 (RN06), cabendo no caixa de qualquer clube.
 */
export function starterBody(
  name: string,
  position: Position,
  duelValues: DuelValues = {},
): Record<string, unknown> {
  const attributes = {
    pace: 1,
    shooting: 1,
    passing: 1,
    dribbling: 1,
    defending: 1,
    physical: 1,
    ...duelValues,
  };
  return {
    name,
    position,
    agility: 50,
    age: 25,
    ...attributes,
    potential: Math.max(...Object.values(attributes)),
  };
}
