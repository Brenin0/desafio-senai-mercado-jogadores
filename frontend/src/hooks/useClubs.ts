import { useQuery } from '@tanstack/react-query';
import { listClubs, type ClubSort } from '../api/clubs.ts';
import { queryKeys } from './query-keys.ts';

export function useClubs(sort: ClubSort = 'name') {
  return useQuery({
    queryKey: [...queryKeys.clubs, { sort }],
    queryFn: () => listClubs(sort),
  });
}
