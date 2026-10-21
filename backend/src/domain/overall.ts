import Decimal from 'decimal.js';
import { PlayerAttributes, Position } from './player';
import { roundToInteger } from './rounding';

/** Peso (%) de cada atributo no overall, por posição (RN06). Os pesos de cada posição somam 100. */
// prettier-ignore
const WEIGHTS: Record<Position, PlayerAttributes> = {
  GOL: { pace: 10, shooting:  0, passing: 20, dribbling:  0, defending: 40, physical: 30 },
  ZAG: { pace: 10, shooting:  0, passing: 15, dribbling:  0, defending: 45, physical: 30 },
  LAT: { pace: 25, shooting:  0, passing: 20, dribbling: 15, defending: 25, physical: 15 },
  MEI: { pace: 10, shooting: 15, passing: 35, dribbling: 25, defending:  5, physical: 10 },
  ATA: { pace: 20, shooting: 40, passing: 10, dribbling: 20, defending:  0, physical: 10 },
};

/** RN06: soma de atributo × peso da posição, dividida por 100 e arredondada para inteiro. */
export function calculateOverall(
  position: Position,
  attributes: PlayerAttributes,
): number {
  const weights = WEIGHTS[position];
  const attributeNames = Object.keys(weights) as (keyof PlayerAttributes)[];
  const weightedSum = attributeNames.reduce(
    (sum, name) => sum + attributes[name] * weights[name],
    0,
  );
  return roundToInteger(new Decimal(weightedSum).dividedBy(100));
}
