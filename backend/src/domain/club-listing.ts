import { Club } from './club';
import { ClubWorth } from './club-worth';
import { compareByNameAndId } from './text';

export const CLUB_SORTS = ['name', 'net_worth_asc', 'net_worth_desc'] as const;
export type ClubSort = (typeof CLUB_SORTS)[number];

export interface ValuedClub {
  club: Club;
  worth: ClubWorth;
}

type Comparator = (a: ValuedClub, b: ValuedClub) => number;

const COMPARATORS: Record<ClubSort, Comparator> = {
  name: () => 0,
  net_worth_asc: (a, b) => a.worth.netWorth.comparedTo(b.worth.netWorth),
  net_worth_desc: (a, b) => b.worth.netWorth.comparedTo(a.worth.netWorth),
};

/** RN11: pelo nome ou pelo patrimônio; em qualquer ordenação, o empate é desfeito pelo nome e pelo id. */
export function sortClubs(clubs: ValuedClub[], sort: ClubSort): ValuedClub[] {
  return [...clubs].sort(
    (a, b) => COMPARATORS[sort](a, b) || compareByNameAndId(a.club, b.club),
  );
}
