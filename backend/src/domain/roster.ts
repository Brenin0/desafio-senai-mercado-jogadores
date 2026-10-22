import { Position } from './player';
import { compareByNameAndId } from './text';

export interface RosterEntry {
  id: number;
  name: string;
  position: Position;
}

/** RN11: de trás para frente, não alfabética. */
const POSITION_ORDER: Position[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];

/** RN11 e RN07 (`sort=position`): GOL, ZAG, LAT, MEI, ATA. */
export function comparePositions(a: Position, b: Position): number {
  return POSITION_ORDER.indexOf(a) - POSITION_ORDER.indexOf(b);
}

/** RN11: ordem do elenco, por posição, depois pelo nome e depois pelo id. */
export function compareRosterOrder(a: RosterEntry, b: RosterEntry): number {
  return comparePositions(a.position, b.position) || compareByNameAndId(a, b);
}
