import { Position } from '../src/domain/player';

/** Atributos que entram nos duelos da partida (RN20). */
export type DuelValues = Partial<
  Record<'shooting' | 'passing' | 'dribbling' | 'defending', number>
>;

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
