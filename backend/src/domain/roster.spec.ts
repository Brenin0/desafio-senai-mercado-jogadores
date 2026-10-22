import { compareRosterOrder, RosterEntry } from './roster';

function rosterIds(players: RosterEntry[]): number[] {
  return [...players].sort(compareRosterOrder).map((player) => player.id);
}

describe('RN11 – ordem do elenco: GOL, ZAG, LAT, MEI, ATA, depois nome e id', () => {
  it('titulares do Águias FC (RN20): Rui Prado, Téo Brandão, Davi Lins, Lauro Neves e Otto Rangel', () => {
    const players: RosterEntry[] = [
      { id: 34, name: 'Otto Rangel', position: 'ATA' },
      { id: 33, name: 'Lauro Neves', position: 'MEI' },
      { id: 31, name: 'Davi Lins', position: 'LAT' },
      { id: 30, name: 'Rui Prado', position: 'GOL' },
      { id: 32, name: 'Téo Brandão', position: 'ZAG' },
    ];
    expect(rosterIds(players)).toEqual([30, 32, 31, 33, 34]);
  });

  it('a ordem das posições não é alfabética: ATA fica por último e ZAG antes de LAT', () => {
    const players: RosterEntry[] = [
      { id: 1, name: 'Ana Lima', position: 'ATA' },
      { id: 2, name: 'Bia Lima', position: 'LAT' },
      { id: 3, name: 'Caio Lima', position: 'ZAG' },
      { id: 4, name: 'Davi Lima', position: 'MEI' },
      { id: 5, name: 'Eva Lima', position: 'GOL' },
    ];
    expect(rosterIds(players)).toEqual([5, 3, 2, 4, 1]);
  });

  it('na mesma posição, segue o nome (os dois MEI do 1-2-1)', () => {
    const players: RosterEntry[] = [
      { id: 7, name: 'Nei Soares', position: 'MEI' },
      { id: 8, name: 'Lauro Neves', position: 'MEI' },
    ];
    expect(rosterIds(players)).toEqual([8, 7]);
  });

  it('com a mesma posição e o mesmo nome, segue o id crescente', () => {
    const players: RosterEntry[] = [
      { id: 12, name: 'Meia Lua', position: 'MEI' },
      { id: 9, name: 'Meia Lua', position: 'MEI' },
    ];
    expect(rosterIds(players)).toEqual([9, 12]);
  });
});
