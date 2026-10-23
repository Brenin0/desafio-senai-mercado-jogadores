import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Club, Duel, Match, MatchDetail } from '../../api/types.ts';
import { jsonResponse, stubApi, type ApiRequest } from '../../test/api-mock.ts';
import { AGUIAS } from '../../test/fixtures.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { MatchesPage } from './MatchesPage.tsx';

const DELTA: Club = { ...AGUIAS, id: 2, name: 'Delta FC', acronym: 'DEL' };

function duel(
  order: number,
  attacker: string,
  defender: string,
  goal: boolean,
): Duel {
  return {
    order,
    attacking_club_id: order <= 3 ? 1 : 2,
    attacker: {
      player_id: order,
      player_name: attacker,
      position: 'ATA',
      condition: 'APTO',
      attribute: 'shooting',
      value: 75,
    },
    defender: {
      player_id: order + 10,
      player_name: defender,
      position: 'GOL',
      condition: 'APTO',
      attribute: 'defending',
      value: 72,
    },
    goal,
  };
}

/** Águias FC 1 × 2 Delta FC, a partida de 2.4.2 do enunciado. */
const MATCH: MatchDetail = {
  id: 1,
  played_at: '2026-11-12T15:00:00-03:00',
  home: { club_id: 1, club_name: 'Águias FC', formation: '2-1-1', goals: 1 },
  away: { club_id: 2, club_name: 'Delta FC', formation: '2-1-1', goals: 2 },
  result: 'VISITANTE',
  duels: [
    duel(1, 'Otto Rangel', 'Ivo Teles', true),
    duel(2, 'Lauro Neves', 'Hugo Vaz', false),
    duel(3, 'Davi Lins', 'Caio Mota', false),
    duel(4, 'Beto Lima', 'Rui Prado', true),
    duel(5, 'Gil Souza', 'Téo Brandão', true),
    duel(6, 'Juca Reis', 'Davi Lins', false),
  ],
};

const OLDER_MATCH: Match = {
  id: 2,
  played_at: '2026-11-10T09:30:00-03:00',
  home: { club_id: 2, club_name: 'Delta FC', formation: '3-1', goals: 0 },
  away: { club_id: 3, club_name: 'Gama SC', formation: '2-2', goals: 0 },
  result: 'EMPATE',
};

function writes(requests: ApiRequest[]) {
  return requests.filter((request) => request.method !== 'GET');
}

describe('MatchesPage', () => {
  let matches: Match[];
  let refusal: string | null;

  beforeEach(() => {
    matches = [OLDER_MATCH];
    refusal = null;
  });

  function stubMatchesApi() {
    return stubApi(({ method, url }) => {
      if (url.pathname.endsWith('/clubs')) {
        return jsonResponse([AGUIAS, DELTA]);
      }
      if (method === 'POST') {
        if (refusal) {
          return jsonResponse({ message: refusal }, 409);
        }
        const summary: Match = {
          id: MATCH.id,
          played_at: MATCH.played_at,
          home: MATCH.home,
          away: MATCH.away,
          result: MATCH.result,
        };
        matches = [summary, ...matches];
        return jsonResponse(MATCH, 201);
      }
      if (url.pathname.endsWith('/matches/1')) {
        return jsonResponse(MATCH);
      }
      return jsonResponse(
        url.searchParams.get('club_id') === '3' ? [OLDER_MATCH] : matches,
      );
    });
  }

  async function renderPage() {
    renderWithProviders(<MatchesPage />);
    await screen.findAllByRole('option', { name: 'DEL – Delta FC' });
  }

  function choose(label: string, value: string) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }

  it('exige o mandante e o visitante antes de enviar', async () => {
    const requests = stubMatchesApi();
    await renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Jogar partida' }));

    expect(await screen.findAllByText('Campo obrigatório.')).toHaveLength(2);
    expect(writes(requests)).toEqual([]);
  });

  it('joga a partida com um só pedido e mostra o placar e os 6 duelos da API', async () => {
    const requests = stubMatchesApi();
    await renderPage();

    choose('Mandante', '1');
    choose('Visitante', '2');
    const submit = screen.getByRole('button', { name: 'Jogar partida' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(
      await screen.findByText('Partida jogada: Águias FC 1 × 2 Delta FC.'),
    ).toBeInTheDocument();
    expect(
      writes(requests).map(({ url, body }) => [url.pathname, body]),
    ).toEqual([['/api/v1/matches', { home_club_id: 1, away_club_id: 2 }]]);
    const duels = screen.getByRole('table', { name: 'Duelos da partida' });
    const rows = within(duels).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(6);
    expect(
      within(rows[0])
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual([
      '1',
      'Águias FC',
      'Otto Rangel (ATA)',
      'Finalização',
      '75',
      'Ivo Teles (GOL)',
      'Defesa',
      '72',
      'Gol',
    ]);
    expect(within(rows[1]).getAllByRole('cell').at(-1)).toHaveTextContent(
      'Não',
    );
    expect(within(rows[3]).getAllByRole('cell')[1]).toHaveTextContent(
      'Delta FC',
    );

    const history = screen.getByRole('table', {
      name: 'Histórico de partidas',
    });
    await waitFor(() =>
      expect(within(history).getAllByRole('row')).toHaveLength(3),
    );
  });

  it('mostra o message da API quando um clube não tem escalação completa', async () => {
    stubMatchesApi();
    refusal = 'O Águias FC não tem escalação completa.';
    await renderPage();

    choose('Mandante', '1');
    choose('Visitante', '2');
    fireEvent.click(screen.getByRole('button', { name: 'Jogar partida' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O Águias FC não tem escalação completa.',
    );
  });

  it('mostra o histórico na ordem da API, filtra pelo clube e abre os duelos', async () => {
    matches = [MATCH, OLDER_MATCH];
    const requests = stubMatchesApi();
    await renderPage();
    const history = screen.getByRole('table', {
      name: 'Histórico de partidas',
    });

    await waitFor(() =>
      expect(within(history).getAllByRole('row')).toHaveLength(3),
    );
    expect(
      within(within(history).getAllByRole('row')[1])
        .getAllByRole('cell')
        .slice(0, 4)
        .map((cell) => cell.textContent),
    ).toEqual(['12/11/2026 15:00', 'Águias FC', '1 × 2', 'Delta FC']);

    fireEvent.click(
      within(history).getAllByRole('button', { name: 'Ver duelos' })[0],
    );
    const dialog = await screen.findByRole('dialog', { name: 'Partida 1' });
    const duels = await within(dialog).findByRole('table', {
      name: 'Duelos da partida',
    });
    expect(within(duels).getAllByRole('row')).toHaveLength(7);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));

    fireEvent.change(screen.getByLabelText('Clube'), {
      target: { value: '2' },
    });
    await waitFor(() =>
      expect(requests.at(-1)!.url.searchParams.get('club_id')).toBe('2'),
    );
  });

  it('mostra o histórico vazio', async () => {
    matches = [];
    stubMatchesApi();
    await renderPage();

    expect(
      await screen.findByText('Nenhuma partida jogada.'),
    ).toBeInTheDocument();
  });
});
