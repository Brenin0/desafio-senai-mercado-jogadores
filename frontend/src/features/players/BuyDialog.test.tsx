import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Player, Purchase } from '../../api/types.ts';
import { jsonResponse, stubApi, type ApiRequest } from '../../test/api-mock.ts';
import { AGUIAS, MEIA_LUA, playersPage } from '../../test/fixtures.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { PlayersPage } from './PlayersPage.tsx';

/** Resposta de 2.3.1 do enunciado. */
const PURCHASE: Purchase = {
  id: 10,
  club_id: 1,
  player_id: 2,
  player_name: 'Meia Lua',
  type: 'COMPRA',
  value: 37,
  fee: 1.85,
  penalty: 0,
  profit: null,
  cash_change: -38.85,
  created_at: '2026-11-02T10:15:00-03:00',
  contract: {
    purchase_value: 37,
    loyalty_until: '2027-03-02T10:15:00-03:00',
    status: 'ATIVO',
  },
  club_cash: 261.15,
};

function writes(requests: ApiRequest[]) {
  return requests.filter((request) => request.method !== 'GET');
}

describe('Compra de jogador livre', () => {
  let players: Player[];
  let refusal: string | null;

  beforeEach(() => {
    players = [MEIA_LUA];
    refusal = null;
  });

  function stubBuyApi() {
    return stubApi(({ method, url }) => {
      if (url.pathname.endsWith('/clubs')) {
        return jsonResponse([{ ...AGUIAS, cash: 300 }]);
      }
      if (method === 'POST') {
        if (refusal) {
          return jsonResponse({ message: refusal }, 409);
        }
        players = [{ ...MEIA_LUA, club_id: 1 }];
        return jsonResponse(PURCHASE);
      }
      return jsonResponse(playersPage(players));
    });
  }

  async function openBuy() {
    renderWithProviders(<PlayersPage />);
    const row = (await screen.findByText('Meia Lua')).closest('tr')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Comprar' }));
    const dialog = screen.getByRole('dialog', { name: 'Comprar Meia Lua' });
    await within(dialog).findByRole('option', {
      name: 'AGU – Águias FC (caixa 300,00)',
    });
    return dialog;
  }

  function fillPurchase(dialog: HTMLElement) {
    fireEvent.change(within(dialog).getByLabelText('Clube'), {
      target: { value: '1' },
    });
    fireEvent.change(
      within(dialog).getByLabelText('Fim da fidelidade (horário de Brasília)'),
      { target: { value: '2027-03-02T10:15' } },
    );
  }

  it('exige o clube e o fim da fidelidade antes de enviar', async () => {
    const requests = stubBuyApi();
    const dialog = await openBuy();

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirmar compra' }),
    );

    expect(
      await within(dialog).findAllByText('Campo obrigatório.'),
    ).toHaveLength(2);
    expect(writes(requests)).toEqual([]);
  });

  it('envia a data com -03:00, mostra o resultado da API e atualiza a lista com o clube', async () => {
    const requests = stubBuyApi();
    const dialog = await openBuy();

    fillPurchase(dialog);
    const submit = within(dialog).getByRole('button', {
      name: 'Confirmar compra',
    });
    fireEvent.click(submit);
    fireEvent.click(submit);

    const result = await within(dialog).findByRole('status', {
      name: 'Compra concluída: Meia Lua',
    });
    const values = Object.fromEntries(
      within(result)
        .getAllByRole('term')
        .map((term) => [term.textContent, term.nextSibling?.textContent]),
    );
    expect(values).toEqual({
      Valor: '37,00',
      Taxa: '1,85',
      'Custo total (valor + taxa)': '38,85',
      'Fim da fidelidade': '02/03/2027 10:15',
      'Novo caixa': '261,15',
    });
    expect(
      writes(requests).map(({ url, body }) => [url.pathname, body]),
    ).toEqual([
      [
        '/api/v1/players/2/buy',
        { club_id: 1, loyalty_until: '2027-03-02T10:15-03:00' },
      ],
    ]);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));
    await waitFor(() => {
      const row = screen.getByText('Meia Lua').closest('tr')!;
      expect(within(row).getByText('AGU')).toBeInTheDocument();
    });
  });

  it('mostra o message da API quando a compra é recusada', async () => {
    stubBuyApi();
    refusal = 'O custo da compra passa de 50% do caixa do clube.';
    const dialog = await openBuy();

    fillPurchase(dialog);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirmar compra' }),
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'O custo da compra passa de 50% do caixa do clube.',
    );
  });
});
