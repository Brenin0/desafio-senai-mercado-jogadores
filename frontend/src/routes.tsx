import type { RouteObject } from 'react-router';
import { AppLayout } from './components/AppLayout.tsx';
import { ClubsPage } from './features/clubs/ClubsPage.tsx';
import { MatchesPage } from './features/matches/MatchesPage.tsx';
import { NotFoundPage } from './features/not-found/NotFoundPage.tsx';
import { PlayersPage } from './features/players/PlayersPage.tsx';
import { StandingsPage } from './features/standings/StandingsPage.tsx';

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <PlayersPage /> },
      { path: 'clubes', element: <ClubsPage /> },
      { path: 'partidas', element: <MatchesPage /> },
      { path: 'classificacao', element: <StandingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
