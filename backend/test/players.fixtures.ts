/** Corpo do cadastro do Meia Lua (2.1.3). */
export const MEIA_LUA = {
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};

/** Resposta do cadastro do Meia Lua (2.1.3), sem o id. */
export const MEIA_LUA_RESPONSE = {
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  condition: 'APTO',
  base_value: 40,
  market_value: 40,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
  overall: 75,
  club_id: null,
};

/**
 * Atacante com o overall pedido: no ATA a defesa tem peso 0 (RN06), então os outros cinco atributos
 * iguais ao overall dão exatamente esse overall. A defesa serve para ajustar o maior atributo.
 */
export function strikerWithOverall(
  overall: number,
  potential: number,
  age: number,
  defending = 1,
): Record<string, unknown> {
  return {
    name: 'Ugo Falcão',
    position: 'ATA',
    agility: 50,
    age,
    pace: overall,
    shooting: overall,
    passing: overall,
    dribbling: overall,
    defending,
    physical: overall,
    potential,
  };
}
