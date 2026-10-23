import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction, TransactionHistory } from '../../api/types.ts';
import { jsonResponse, stubApi } from '../../test/api-mock.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { TransactionsSection } from './TransactionsSection.tsx';

/** Venda e compra do Meia Lua (2.3.3 do enunciado). */
const SALE: Transaction = {
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
};

const PURCHASE: Transaction = {
  ...SALE,
  id: 10,
  type: 'COMPRA',
  value: 37,
  fee: 1.85,
  penalty: 0,
  profit: null,
  cash_change: -38.85,
  created_at: '2026-11-02T10:15:00-03:00',
};

const FULL_HISTORY: TransactionHistory = {
  data: [SALE, PURCHASE],
  summary: {
    total_spent: 38.85,
    total_received: 35.7,
    total_fees: 2.15,
    total_penalties: 4,
    total_profit: 3,
  },
};

const SALES_ONLY: TransactionHistory = {
  data: [SALE],
  summary: {
    total_spent: 0,
    total_received: 35.7,
    total_fees: 0.3,
    total_penalties: 4,
    total_profit: 3,
  },
};

function cellsOf(text: string) {
  const row = screen.getByText(text).closest('tr')!;
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent);
}

function summaryValues() {
  const summary = screen.getByLabelText('Totais do histórico');
  return within(summary)
    .getAllByRole('definition')
    .map((value) => value.textContent);
}

describe('TransactionsSection', () => {
  let downloads: string[];

  beforeEach(() => {
    downloads = [];
    URL.createObjectURL = vi.fn(() => 'blob:historico');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.download);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function stubHistoryApi() {
    return stubApi(({ url }) => {
      if (url.pathname.endsWith('/export')) {
        return new Response('data_hora;tipo\n', {
          headers: { 'Content-Type': 'text/csv' },
        });
      }
      return jsonResponse(
        url.searchParams.get('type') === 'VENDA' ? SALES_ONLY : FULL_HISTORY,
      );
    });
  }

  it('mostra cada transação com data em Brasília, sinal na variação do caixa e os totais da API', async () => {
    stubHistoryApi();
    renderWithProviders(<TransactionsSection clubId={1} />);

    await screen.findAllByText('Meia Lua');
    expect(cellsOf('05/11/2026 16:40')).toEqual([
      '05/11/2026 16:40',
      'Venda',
      'Meia Lua',
      '40,00',
      '0,30',
      '4,00',
      '3,00',
      '+35,70',
    ]);
    expect(cellsOf('02/11/2026 10:15')).toEqual([
      '02/11/2026 10:15',
      'Compra',
      'Meia Lua',
      '37,00',
      '1,85',
      '0,00',
      '—',
      '-38,85',
    ]);
    expect(summaryValues()).toEqual(['38,85', '35,70', '2,15', '4,00', '3,00']);
  });

  it('filtra pelo tipo e pelo jogador, com os totais do summary filtrado', async () => {
    const requests = stubHistoryApi();
    renderWithProviders(<TransactionsSection clubId={1} />);
    await screen.findByRole('option', { name: 'Meia Lua' });

    fireEvent.click(screen.getByLabelText('Venda'));
    fireEvent.change(screen.getByLabelText('Jogador'), {
      target: { value: '2' },
    });

    await waitFor(() =>
      expect(summaryValues()).toEqual([
        '0,00',
        '35,70',
        '0,30',
        '4,00',
        '3,00',
      ]),
    );
    expect(screen.queryByText('02/11/2026 10:15')).not.toBeInTheDocument();
    expect(Object.fromEntries(requests.at(-1)!.url.searchParams)).toEqual({
      type: 'VENDA',
      player_id: '2',
    });
  });

  it('mostra o message da API quando ela recusa o filtro do jogador', async () => {
    stubApi(({ url }) =>
      url.searchParams.has('player_id')
        ? jsonResponse({ message: 'Jogador não encontrado.' }, 404)
        : jsonResponse(FULL_HISTORY),
    );
    renderWithProviders(<TransactionsSection clubId={1} />);
    await screen.findByRole('option', { name: 'Meia Lua' });

    fireEvent.change(screen.getByLabelText('Jogador'), {
      target: { value: '2' },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Jogador não encontrado.',
    );
    expect(
      screen.queryByLabelText('Totais do histórico'),
    ).not.toBeInTheDocument();
  });

  it('exporta o CSV da API com os filtros aplicados', async () => {
    const requests = stubHistoryApi();
    renderWithProviders(<TransactionsSection clubId={1} />);
    await screen.findByRole('option', { name: 'Meia Lua' });

    fireEvent.click(screen.getByLabelText('Compra'));
    fireEvent.click(screen.getByLabelText('Venda'));
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => expect(downloads).toEqual(['historico-clube-1.csv']));
    const exported = requests.find((request) =>
      request.url.pathname.endsWith('/export'),
    )!;
    expect(exported.url.pathname).toBe('/api/v1/clubs/1/transactions/export');
    expect(exported.url.searchParams.get('type')).toBe('COMPRA,VENDA');
  });

  it('mostra a lista vazia de um clube sem transações', async () => {
    stubApi(() =>
      jsonResponse({
        data: [],
        summary: {
          total_spent: 0,
          total_received: 0,
          total_fees: 0,
          total_penalties: 0,
          total_profit: 0,
        },
      }),
    );
    renderWithProviders(<TransactionsSection clubId={1} />);

    expect(
      await screen.findByText('Nenhuma transação encontrada.'),
    ).toBeInTheDocument();
  });
});
