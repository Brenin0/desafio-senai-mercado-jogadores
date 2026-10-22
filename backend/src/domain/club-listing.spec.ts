import Decimal from 'decimal.js';
import { sortClubs, ValuedClub } from './club-listing';

function valued(id: number, name: string, netWorth: string): ValuedClub {
  return {
    club: { id, name, acronym: 'AAB', cash: new Decimal(netWorth) },
    worth: { squadValue: new Decimal(0), netWorth: new Decimal(netWorth) },
  };
}

const ids = (clubs: ValuedClub[]) => clubs.map(({ club }) => club.id);

describe('RN11 – GET /clubs pelo nome ou pelo patrimônio, com empate pelo nome e depois pelo id', () => {
  const clubs = [
    valued(1, 'Gama SC', '300.00'),
    valued(2, 'Épsilon EC', '298.15'),
    valued(3, 'Delta FC', '300.00'),
    valued(4, 'Águias FC', '310.50'),
    valued(5, 'Aguias FC', '298.15'),
  ];

  it('name: ordem alfabética das Premissas; "Águias FC" e "Aguias FC" empatam e seguem o id', () => {
    expect(ids(sortClubs(clubs, 'name'))).toEqual([4, 5, 3, 2, 1]);
  });

  it('net_worth_asc: menor patrimônio primeiro; no empate, o nome', () => {
    expect(ids(sortClubs(clubs, 'net_worth_asc'))).toEqual([5, 2, 3, 1, 4]);
  });

  it('net_worth_desc: maior patrimônio primeiro; no empate, o nome, ainda em ordem alfabética', () => {
    expect(ids(sortClubs(clubs, 'net_worth_desc'))).toEqual([4, 3, 1, 5, 2]);
  });

  it('não altera a lista recebida', () => {
    sortClubs(clubs, 'net_worth_desc');

    expect(ids(clubs)).toEqual([1, 2, 3, 4, 5]);
  });
});
