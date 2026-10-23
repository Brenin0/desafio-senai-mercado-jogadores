import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Player } from '../../api/types.ts';
import { jsonResponse, stubApi } from '../../test/api-mock.ts';
import {
  AGUIAS,
  MEIA_LUA,
  OTTO_RANGEL,
  playersPage,
} from '../../test/fixtures.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { PlayersPage } from './PlayersPage.tsx';

describe('PlayersPage', () => {
  let players: Player[];

  beforeEach(() => {
    players = [MEIA_LUA, OTTO_RANGEL];
  });

  function stubPlayersApi() {
    return stubApi(({ method, url }) => {
      if (url.pathname.endsWith('/clubs')) {
        return jsonResponse([AGUIAS]);
      }
      if (method === 'DELETE') {
        players = players.filter((player) => player.id !== MEIA_LUA.id);
        return new Response(null, { status: 204 });
      }
      if (
        url.searchParams.get('free') === 'true' &&
        url.searchParams.has('club_id')
      ) {
        return jsonResponse(
          { message: 'free=true não combina com club_id.' },
          400,
        );
      }
      return jsonResponse(playersPage(players));
    });
  }

  it('mostra os jogadores com os valores da API, "Livre" e a sigla do clube', async () => {
    stubPlayersApi();
    renderWithProviders(<PlayersPage />);

    const row = (await screen.findByText('Meia Lua')).closest('tr')!;
    expect(within(row).getByText('40,00')).toBeInTheDocument();
    expect(within(row).getByText('37,00')).toBeInTheDocument();
    expect(within(row).getByText('Livre')).toBeInTheDocument();
    expect(within(row).getByText('Mal condicionado')).toBeInTheDocument();
    const ottoRow = screen.getByText('Otto Rangel').closest('tr')!;
    expect(await within(ottoRow).findByText('AGU')).toBeInTheDocument();
    expect(screen.getByText('2 jogadores encontrados')).toBeInTheDocument();
  });

  it('pede a lista com a busca, os filtros e a ordenação, na página 1 com 10 itens', async () => {
    const requests = stubPlayersApi();
    renderWithProviders(<PlayersPage />);
    await screen.findByText('Meia Lua');

    fireEvent.change(screen.getByLabelText('Buscar por nome'), {
      target: { value: ' lua ' },
    });
    fireEvent.change(screen.getByLabelText('Posição'), {
      target: { value: 'MEI' },
    });
    fireEvent.change(screen.getByLabelText('Valor de mercado mínimo'), {
      target: { value: '10.5' },
    });
    fireEvent.change(screen.getByLabelText('Ordenar por'), {
      target: { value: 'value_desc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => {
      const last = requests
        .filter((r) => r.url.pathname.endsWith('/players'))
        .at(-1)!;
      expect(Object.fromEntries(last.url.searchParams)).toEqual({
        search: 'lua',
        position: 'MEI',
        min_value: '10.5',
        sort: 'value_desc',
        page: '1',
        limit: '10',
      });
    });
  });

  it('mostra o message da API quando "só livres" vem junto com o clube', async () => {
    stubPlayersApi();
    renderWithProviders(<PlayersPage />);
    await screen.findByRole('option', { name: 'AGU – Águias FC' });

    fireEvent.click(screen.getByLabelText('Só livres'));
    fireEvent.change(screen.getByLabelText('Clube'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'free=true não combina com club_id.',
    );
  });

  it('exclui o jogador livre depois da confirmação e atualiza a lista', async () => {
    const requests = stubPlayersApi();
    renderWithProviders(<PlayersPage />);

    const buttons = await screen.findAllByRole('button', { name: 'Excluir' });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    const dialog = screen.getByRole('dialog', { name: 'Excluir jogador' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Meia Lua foi excluído.',
    );
    expect(screen.queryByText('Meia Lua')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      requests.filter((r) => r.method === 'DELETE').map((r) => r.url.pathname),
    ).toEqual(['/api/v1/players/2']);
  });
});
