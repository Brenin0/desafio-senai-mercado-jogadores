import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Lineup, Player, Position, SquadPlayer } from '../../api/types.ts';
import { jsonResponse, stubApi, type ApiRequest } from '../../test/api-mock.ts';
import { MEIA_LUA } from '../../test/fixtures.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { LineupSection } from './LineupSection.tsx';

function squadPlayer(
  id: number,
  name: string,
  position: Position,
  condition: Player['condition'] = 'APTO',
): SquadPlayer {
  return {
    ...MEIA_LUA,
    id,
    name,
    position,
    condition,
    club_id: 1,
    contract: {
      purchase_value: 37,
      loyalty_until: '2027-03-02T10:15:00-03:00',
      remaining_days: 120,
      penalty_rate: 10,
    },
  };
}

/** Elenco do Águias FC no cenário da RN20, mais um ZAG doente. */
const SQUAD: SquadPlayer[] = [
  squadPlayer(30, 'Rui Prado', 'GOL'),
  squadPlayer(32, 'Téo Brandão', 'ZAG'),
  squadPlayer(31, 'Davi Lins', 'LAT', 'MAL_CONDICIONADO'),
  squadPlayer(35, 'Caio Ramos', 'ZAG', 'DOENTE'),
  squadPlayer(33, 'Lauro Neves', 'MEI'),
  squadPlayer(34, 'Otto Rangel', 'ATA'),
];

const NO_LINEUP: Lineup = {
  club_id: 1,
  formation: null,
  complete: false,
  players: [],
};

function optionsOf(label: string) {
  return within(screen.getByLabelText(label))
    .getAllByRole('option')
    .map((option) => option.textContent);
}

function writes(requests: ApiRequest[]) {
  return requests.filter((request) => request.method !== 'GET');
}

describe('LineupSection', () => {
  let lineup: Lineup;
  let refusal: string | null;

  beforeEach(() => {
    lineup = NO_LINEUP;
    refusal = null;
  });

  function stubLineupApi() {
    return stubApi(({ method, body }) => {
      if (method === 'PUT') {
        if (refusal) {
          return jsonResponse({ message: refusal }, 409);
        }
        const { formation, player_ids: ids } = body as {
          formation: Lineup['formation'];
          player_ids: number[];
        };
        lineup = {
          club_id: 1,
          formation,
          complete: true,
          players: SQUAD.filter((player) => ids.includes(player.id)),
        };
        return jsonResponse(lineup);
      }
      return jsonResponse(lineup);
    });
  }

  function chooseLineup() {
    fireEvent.change(screen.getByLabelText('Formação'), {
      target: { value: '2-1-1' },
    });
    const choices: [string, string][] = [
      ['Goleiro (GOL)', '30'],
      ['Defesa 1 (ZAG ou LAT)', '32'],
      ['Defesa 2 (ZAG ou LAT)', '31'],
      ['Meio 1 (MEI)', '33'],
      ['Ataque 1 (ATA)', '34'],
    ];
    for (const [label, value] of choices) {
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
  }

  it('avisa que o clube sem escalação completa não pode jogar', async () => {
    stubLineupApi();
    renderWithProviders(<LineupSection clubId={1} squad={SQUAD} />);

    expect(
      await screen.findByText(
        'Escalação incompleta: o clube não pode jogar até escalar os 5 titulares.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Nenhum titular escalado.')).toBeInTheDocument();
  });

  it('mostra as vagas da formação com os jogadores do elenco da posição, sem DOENTE', async () => {
    stubLineupApi();
    renderWithProviders(<LineupSection clubId={1} squad={SQUAD} />);
    await screen.findByText('Nenhum titular escalado.');

    fireEvent.change(screen.getByLabelText('Formação'), {
      target: { value: '2-1-1' },
    });

    expect(optionsOf('Goleiro (GOL)')).toEqual([
      'Escolha o titular',
      'Rui Prado (GOL)',
    ]);
    expect(optionsOf('Defesa 1 (ZAG ou LAT)')).toEqual([
      'Escolha o titular',
      'Téo Brandão (ZAG)',
      'Davi Lins (LAT)',
    ]);
    expect(screen.getByLabelText('Meio 1 (MEI)')).toBeInTheDocument();
    expect(screen.getByLabelText('Ataque 1 (ATA)')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Defesa 1 (ZAG ou LAT)'), {
      target: { value: '32' },
    });
    expect(optionsOf('Defesa 2 (ZAG ou LAT)')).toEqual([
      'Escolha o titular',
      'Davi Lins (LAT)',
    ]);
  });

  it('exige a formação e um titular em cada vaga antes de enviar', async () => {
    const requests = stubLineupApi();
    renderWithProviders(<LineupSection clubId={1} squad={SQUAD} />);
    await screen.findByText('Nenhum titular escalado.');
    const submit = screen.getByRole('button', { name: 'Salvar escalação' });

    fireEvent.click(submit);
    expect(await screen.findByText('Campo obrigatório.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Formação'), {
      target: { value: '3-1' },
    });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(screen.getAllByText('Campo obrigatório.')).toHaveLength(5),
    );
    expect(writes(requests)).toEqual([]);
  });

  it('salva a formação e os 5 titulares e mostra a escalação devolvida pela API', async () => {
    const requests = stubLineupApi();
    renderWithProviders(<LineupSection clubId={1} squad={SQUAD} />);
    await screen.findByText('Nenhum titular escalado.');

    chooseLineup();
    const submit = screen.getByRole('button', { name: 'Salvar escalação' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(
      await screen.findByText('Escalação salva no 2-1-1.'),
    ).toBeInTheDocument();
    expect(
      writes(requests).map(({ url, body }) => [url.pathname, body]),
    ).toEqual([
      [
        '/api/v1/clubs/1/lineup',
        { formation: '2-1-1', player_ids: [30, 32, 31, 33, 34] },
      ],
    ]);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Escalação atual · 2-1-1' }),
      ).toBeInTheDocument(),
    );
    const table = screen.getByRole('table', { name: 'Titulares do clube' });
    expect(within(table).getByText('Otto Rangel')).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Escalação incompleta: o clube não pode jogar até escalar os 5 titulares.',
      ),
    ).not.toBeInTheDocument();
  });

  it('mostra o message da API quando a escalação é recusada', async () => {
    stubLineupApi();
    refusal = 'O jogador 34 não está no elenco do clube.';
    renderWithProviders(<LineupSection clubId={1} squad={SQUAD} />);
    await screen.findByText('Nenhum titular escalado.');

    chooseLineup();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar escalação' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O jogador 34 não está no elenco do clube.',
    );
  });
});
