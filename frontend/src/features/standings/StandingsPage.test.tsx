import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Standing } from '../../api/types.ts';
import { jsonResponse, stubApi } from '../../test/api-mock.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { StandingsPage } from './StandingsPage.tsx';

/** Resposta de 2.4.3 do enunciado. */
const STANDINGS: Standing[] = [
  {
    position: 1,
    club_id: 2,
    club_name: 'Delta FC',
    played: 1,
    wins: 1,
    draws: 0,
    losses: 0,
    goals_for: 2,
    goals_against: 1,
    goal_difference: 1,
    points: 3,
  },
  {
    position: 2,
    club_id: 3,
    club_name: 'Gama SC',
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    points: 0,
  },
  {
    position: 3,
    club_id: 1,
    club_name: 'Águias FC',
    played: 1,
    wins: 0,
    draws: 0,
    losses: 1,
    goals_for: 1,
    goals_against: 2,
    goal_difference: -1,
    points: 0,
  },
];

describe('StandingsPage', () => {
  it('mostra a classificação na ordem devolvida pela API, com todas as colunas', async () => {
    stubApi(() => jsonResponse(STANDINGS));
    renderWithProviders(<StandingsPage />);

    await screen.findByText('Delta FC');
    const rows = screen.getAllByRole('row').slice(1);
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent),
      ),
    ).toEqual([
      ['1º', 'Delta FC', '1', '1', '0', '0', '2', '1', '1', '3'],
      ['2º', 'Gama SC', '0', '0', '0', '0', '0', '0', '0', '0'],
      ['3º', 'Águias FC', '1', '0', '0', '1', '1', '2', '-1', '0'],
    ]);
  });

  it('mostra a lista vazia', async () => {
    stubApi(() => jsonResponse([]));
    renderWithProviders(<StandingsPage />);

    expect(
      await screen.findByText('Nenhum clube na classificação.'),
    ).toBeInTheDocument();
  });

  it('mostra o erro quando a API não responde', async () => {
    stubApi(() => jsonResponse({ message: 'Erro interno.' }, 500));
    renderWithProviders(<StandingsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno.');
  });
});
