import { Formation } from './lineup';
import {
  applyCondition,
  DuelAttribute,
  DuelSide,
  MatchCondition,
  matchOutcome,
  MatchOutcome,
  MatchResult,
  MatchTeam,
  playMatch,
} from './match-engine';
import { Position } from './player';

function side(
  playerId: number,
  playerName: string,
  position: Position,
  condition: MatchCondition,
  attribute: DuelAttribute,
  value: number,
): DuelSide {
  return { playerId, playerName, position, condition, attribute, value };
}

/** Titulares do exemplo da RN20, fora da ordem do elenco; atributos sem uso no duelo valem 50. */
// prettier-ignore
const aguias: MatchTeam = {
  clubId: 1,
  players: [
    { id: 34, name: 'Otto Rangel', position: 'ATA', condition: 'APTO', shooting: 75, passing: 50, dribbling: 50, defending: 50 },
    { id: 31, name: 'Davi Lins', position: 'LAT', condition: 'MAL_CONDICIONADO', shooting: 50, passing: 50, dribbling: 74, defending: 66 },
    { id: 33, name: 'Lauro Neves', position: 'MEI', condition: 'APTO', shooting: 50, passing: 82, dribbling: 50, defending: 50 },
    { id: 30, name: 'Rui Prado', position: 'GOL', condition: 'APTO', shooting: 50, passing: 50, dribbling: 50, defending: 77 },
    { id: 32, name: 'Téo Brandão', position: 'ZAG', condition: 'APTO', shooting: 50, passing: 50, dribbling: 50, defending: 84 },
  ],
};

// prettier-ignore
const delta: MatchTeam = {
  clubId: 2,
  players: [
    { id: 44, name: 'Ugo Falcão', position: 'ATA', condition: 'APTO', shooting: 81, passing: 50, dribbling: 50, defending: 50 },
    { id: 43, name: 'Nei Soares', position: 'MEI', condition: 'APTO', shooting: 50, passing: 70, dribbling: 50, defending: 50 },
    { id: 42, name: 'Lino Matos', position: 'LAT', condition: 'APTO', shooting: 50, passing: 50, dribbling: 79, defending: 63 },
    { id: 41, name: 'Hugo Vaz', position: 'ZAG', condition: 'APTO', shooting: 50, passing: 50, dribbling: 50, defending: 84 },
    { id: 40, name: 'Ivo Teles', position: 'GOL', condition: 'APTO', shooting: 50, passing: 50, dribbling: 50, defending: 72 },
  ],
};

describe('RN20 – partida de exemplo: Águias FC (mandante) × Delta FC (visitante), os dois no 2-1-1', () => {
  let match: MatchResult;

  beforeAll(() => {
    match = playMatch(aguias, delta);
  });

  // prettier-ignore
  it.each<[number, number, DuelSide, DuelSide, boolean]>([
    [1, 1, side(34, 'Otto Rangel', 'ATA', 'APTO', 'shooting', 75), side(40, 'Ivo Teles', 'GOL', 'APTO', 'defending', 72), true],
    [2, 1, side(33, 'Lauro Neves', 'MEI', 'APTO', 'passing', 82), side(41, 'Hugo Vaz', 'ZAG', 'APTO', 'defending', 84), false],
    [3, 1, side(31, 'Davi Lins', 'LAT', 'MAL_CONDICIONADO', 'dribbling', 63), side(42, 'Lino Matos', 'LAT', 'APTO', 'defending', 63), false],
    [4, 2, side(44, 'Ugo Falcão', 'ATA', 'APTO', 'shooting', 81), side(30, 'Rui Prado', 'GOL', 'APTO', 'defending', 77), true],
    [5, 2, side(43, 'Nei Soares', 'MEI', 'APTO', 'passing', 70), side(32, 'Téo Brandão', 'ZAG', 'APTO', 'defending', 84), false],
    [6, 2, side(42, 'Lino Matos', 'LAT', 'APTO', 'dribbling', 79), side(31, 'Davi Lins', 'LAT', 'MAL_CONDICIONADO', 'defending', 56), true],
  ])(
    'duelo %i, ataque do clube %i',
    (order, attackingClubId, attacker, defender, goal) => {
      expect(match.duels[order - 1]).toEqual({
        order,
        attackingClubId,
        attacker,
        defender,
        goal,
      });
    },
  );

  it('são sempre 6 duelos', () => {
    expect(match.duels).toHaveLength(6);
  });

  it('placar Águias FC 1 × 2 Delta FC; result VISITANTE', () => {
    expect(match.homeGoals).toBe(1);
    expect(match.awayGoals).toBe(2);
    expect(match.result).toBe('VISITANTE');
  });
});

describe('RN20 – titular MAL_CONDICIONADO: atributo × 0,85, inteiro com meio para cima', () => {
  it.each<[number, MatchCondition, number]>([
    [74, 'MAL_CONDICIONADO', 63],
    [50, 'MAL_CONDICIONADO', 43],
    [66, 'MAL_CONDICIONADO', 56],
    [74, 'APTO', 74],
  ])('%i com %s → %i', (value, condition, expected) => {
    expect(applyCondition(value, condition)).toBe(expected);
  });
});

/** Time com as posições na ordem do elenco, todos APTO e com 50 em cada atributo. */
function teamWith(clubId: number, positions: Position[]): MatchTeam {
  return {
    clubId,
    players: positions.map((position, index) => ({
      id: clubId * 100 + index,
      name: `Jogador ${String.fromCharCode(65 + index)}`,
      position,
      condition: 'APTO',
      shooting: 50,
      passing: 50,
      dribbling: 50,
      defending: 50,
    })),
  };
}

describe('RN20 – quem ataca e quem defende em cada formação (tabela de exemplos)', () => {
  // prettier-ignore
  it.each<[Formation, Position[], [Position, DuelAttribute][], Position[]]>([
    ['3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA'], [['ATA', 'shooting'], ['LAT', 'dribbling'], ['LAT', 'dribbling']], ['GOL', 'ZAG', 'LAT']],
    ['2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA'], [['ATA', 'shooting'], ['ATA', 'shooting'], ['LAT', 'dribbling']], ['GOL', 'ZAG', 'LAT']],
    ['2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'], [['ATA', 'shooting'], ['MEI', 'passing'], ['LAT', 'dribbling']], ['GOL', 'ZAG', 'LAT']],
    ['1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA'], [['ATA', 'shooting'], ['MEI', 'passing'], ['MEI', 'passing']], ['GOL', 'ZAG', 'MEI']],
  ])(
    '%s: atacam o 4º, o 3º e o 2º; defendem o goleiro, o 1º e o 2º',
    (_, positions, attackers, defenders) => {
      const { duels } = playMatch(teamWith(1, positions), delta);
      expect(
        duels
          .slice(0, 3)
          .map((duel) => [duel.attacker.position, duel.attacker.attribute]),
      ).toEqual(attackers);
      expect(duels.slice(3).map((duel) => duel.defender.position)).toEqual(
        defenders,
      );
      expect(duels.slice(3).map((duel) => duel.defender.attribute)).toEqual([
        'defending',
        'defending',
        'defending',
      ]);
    },
  );

  it('1-2-1: o MEI que vem antes pelo nome é o 2º (ataca no duelo 3 e defende no 6); o outro é o 3º (ataca no 2)', () => {
    // prettier-ignore
    const home: MatchTeam = {
      clubId: 1,
      players: [
        { id: 1, name: 'Gil Gomes', position: 'GOL', condition: 'APTO', shooting: 50, passing: 50, dribbling: 50, defending: 50 },
        { id: 2, name: 'Zeca Dias', position: 'ZAG', condition: 'APTO', shooting: 50, passing: 50, dribbling: 50, defending: 50 },
        { id: 3, name: 'Bruno Alves', position: 'MEI', condition: 'APTO', shooting: 50, passing: 50, dribbling: 50, defending: 50 },
        { id: 4, name: 'Ana Souza', position: 'MEI', condition: 'APTO', shooting: 50, passing: 50, dribbling: 50, defending: 50 },
        { id: 5, name: 'Caio Reis', position: 'ATA', condition: 'APTO', shooting: 50, passing: 50, dribbling: 50, defending: 50 },
      ],
    };
    const { duels } = playMatch(home, delta);
    expect(duels[1].attacker.playerName).toBe('Bruno Alves');
    expect(duels[2].attacker.playerName).toBe('Ana Souza');
    expect(duels[4].defender.playerName).toBe('Zeca Dias');
    expect(duels[5].defender.playerName).toBe('Ana Souza');
  });
});

describe('RN20 – resultado', () => {
  it('trocar o mandante não muda os gols de cada clube: Delta FC 2 × 1 Águias FC, MANDANTE', () => {
    const match = playMatch(delta, aguias);
    expect(match.homeGoals).toBe(2);
    expect(match.awayGoals).toBe(1);
    expect(match.result).toBe('MANDANTE');
    expect(match.duels.slice(0, 3).map((duel) => duel.attackingClubId)).toEqual(
      [2, 2, 2],
    );
  });

  it('gols iguais dão EMPATE', () => {
    const match = playMatch(aguias, { clubId: 2, players: aguias.players });
    expect(match.homeGoals).toBe(match.awayGoals);
    expect(match.result).toBe('EMPATE');
  });
});

describe('RN20 e RN21 – result pelos gols de cada clube, também nas partidas já gravadas', () => {
  it.each<[number, number, MatchOutcome]>([
    [2, 1, 'MANDANTE'],
    [1, 2, 'VISITANTE'],
    [0, 3, 'VISITANTE'],
    [0, 0, 'EMPATE'],
    [3, 3, 'EMPATE'],
  ])('%i × %i → %s', (homeGoals, awayGoals, expected) => {
    expect(matchOutcome(homeGoals, awayGoals)).toBe(expected);
  });
});
