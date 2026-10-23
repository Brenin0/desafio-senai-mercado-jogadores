import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ClubDetail, Sale } from '../../api/types.ts';
import { jsonResponse, stubApi, type ApiRequest } from '../../test/api-mock.ts';
import { AGUIAS, MEIA_LUA } from '../../test/fixtures.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { ClubPage } from './ClubPage.tsx';

/** Resposta de 2.2.2 do enunciado. */
const AGUIAS_DETAIL: ClubDetail = {
  ...AGUIAS,
  players: [
    {
      ...MEIA_LUA,
      club_id: 1,
      contract: {
        purchase_value: 37,
        loyalty_until: '2027-03-02T10:15:00-03:00',
        remaining_days: 120,
        penalty_rate: 10,
      },
    },
  ],
};

/** Resposta de 2.3.2 do enunciado. */
const SALE: Sale = {
  id: 11,
  club_id: 1,
  player_id: 2,
  player_name: 'Meia Lua',
  type: 'VENDA',
  value: 40,
  fee: 0.3,
  penalty: 4,
  profit: 3,
  cash_change: 35.7,
  created_at: '2026-11-05T16:40:00-03:00',
  purchase_value: 37,
  remaining_days: 117,
  penalty_rate: 10,
  contract_status: 'RESCINDIDO',
  club_cash: 296.85,
};

function writes(requests: ApiRequest[]) {
  return requests.filter((request) => request.method !== 'GET');
}

function renderClubPage() {
  renderWithProviders(<ClubPage />, {
    route: '/clubes/1',
    path: '/clubes/:id',
  });
}

describe('ClubPage', () => {
  let club: ClubDetail;
  let response: () => Response;

  beforeEach(() => {
    club = AGUIAS_DETAIL;
    response = () => jsonResponse(club);
  });

  function stubClubApi(sale: () => Response = () => jsonResponse(SALE)) {
    return stubApi(({ method }) => {
      if (method === 'POST') {
        const result = sale();
        if (result.ok) {
          club = {
            ...club,
            cash: 296.85,
            squad_value: 0,
            net_worth: 296.85,
            players: [],
          };
        }
        return result;
      }
      return response();
    });
  }

  it('mostra caixa, valor do elenco, patrimônio e o elenco com as colunas do contrato', async () => {
    const requests = stubClubApi();
    renderClubPage();

    expect(
      await screen.findByRole('heading', { name: 'Águias FC (AGU)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('261,15')).toBeInTheDocument();
    expect(screen.getByText('298,15')).toBeInTheDocument();
    const row = screen.getByText('Meia Lua').closest('tr')!;
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual([
      'Meia Lua',
      'MEI',
      '75',
      'Mal condicionado',
      '37,00',
      '02/03/2027 10:15',
      '120',
      '10%',
      'Vender',
    ]);
    expect(requests[0].url.pathname).toBe('/api/v1/clubs/1');
  });

  it('vende depois da confirmação, com um só pedido, e mostra o resultado da API', async () => {
    const requests = stubClubApi();
    renderClubPage();
    const row = (await screen.findByText('Meia Lua')).closest('tr')!;

    fireEvent.click(within(row).getByRole('button', { name: 'Vender' }));
    const dialog = screen.getByRole('dialog', { name: 'Vender Meia Lua' });
    const confirm = within(dialog).getByRole('button', {
      name: 'Confirmar venda',
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    const result = await screen.findByRole('status', {
      name: 'Venda concluída: Meia Lua',
    });
    const values = Object.fromEntries(
      within(result)
        .getAllByRole('term')
        .map((term) => [term.textContent, term.nextSibling?.textContent]),
    );
    expect(values).toEqual({
      'Valor de compra': '37,00',
      'Valor de venda': '40,00',
      'Dias restantes': '117',
      Multa: '4,00',
      Lucro: '3,00',
      Comissão: '0,30',
      Crédito: '35,70',
      'Novo caixa': '296,85',
    });
    expect(writes(requests).map((request) => request.url.pathname)).toEqual([
      '/api/v1/players/2/sell',
    ]);
    expect(
      await screen.findByText('Nenhum jogador no elenco.'),
    ).toBeInTheDocument();
  });

  it('mostra o message da API quando a venda é recusada', async () => {
    stubClubApi(() =>
      jsonResponse({ message: 'O jogador não está em nenhum clube.' }, 409),
    );
    renderClubPage();
    const row = (await screen.findByText('Meia Lua')).closest('tr')!;

    fireEvent.click(within(row).getByRole('button', { name: 'Vender' }));
    const dialog = screen.getByRole('dialog', { name: 'Vender Meia Lua' });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirmar venda' }),
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'O jogador não está em nenhum clube.',
    );
  });

  it('mostra o elenco vazio de um clube recém-criado', async () => {
    club = { ...AGUIAS_DETAIL, players: [] };
    stubClubApi();
    renderClubPage();

    expect(
      await screen.findByText('Nenhum jogador no elenco.'),
    ).toBeInTheDocument();
  });

  it('mostra o message da API para clube inexistente', async () => {
    response = () => jsonResponse({ message: 'Clube não encontrado.' }, 404);
    stubClubApi();
    renderClubPage();

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Clube não encontrado.',
      ),
    );
  });
});
