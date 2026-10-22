import { Position } from './player';
import { compareByNameAndId } from './text';

export interface RosterEntry {
  id: number;
  name: string;
  position: Position;
}

/** RN11: de trás para frente, não alfabética. */
const POSITION_ORDER: Position[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'];

/** RN11: ordem do elenco, por posição, depois pelo nome e depois pelo id. */
export function compareRosterOrder(a: RosterEntry, b: RosterEntry): number {
  return (
    POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position) ||
    compareByNameAndId(a, b)
  );
}
