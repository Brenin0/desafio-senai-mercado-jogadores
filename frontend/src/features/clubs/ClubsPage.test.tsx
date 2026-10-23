import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Club } from '../../api/types.ts';
import { jsonResponse, stubApi, type ApiRequest } from '../../test/api-mock.ts';
import { AGUIAS } from '../../test/fixtures.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { ClubsPage } from './ClubsPage.tsx';

const DELTA: Club = {
  id: 2,
  name: 'Delta FC',
  acronym: 'DEL',
  cash: 300,
  squad_value: 0,
  net_worth: 300,
};

function writes(requests: ApiRequest[]) {
  return requests.filter((request) => request.method !== 'GET');
}

describe('ClubsPage', () => {
  let clubs: Club[];
  let refusal: string | null;

  beforeEach(() => {
    clubs = [AGUIAS, DELTA];
    refusal = null;
  });

  function stubClubsApi() {
    return stubApi(({ method, url }) => {
      if (method === 'POST') {
        if (refusal) {
          return jsonResponse({ message: refusal }, 409);
        }
        const created: Club = {
          id: 3,
          name: 'Leões do Sul',
          acronym: 'LEO',
          cash: 300,
          squad_value: 0,
          net_worth: 300,
        };
        clubs = [...clubs, created];
        return jsonResponse(created, 201);
      }
      const sorted =
        url.searchParams.get('sort') === 'net_worth_desc'
          ? [DELTA, AGUIAS]
          : clubs;
      return jsonResponse(sorted);
    });
  }

  function clubNames() {
    return screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent);
  }

  it('mostra os clubes na ordem da API, com caixa, valor do elenco e patrimônio', async () => {
    const requests = stubClubsApi();
    renderWithProviders(<ClubsPage />);

    const row = (await screen.findByText('Águias FC')).closest('tr')!;
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['Águias FC', 'AGU', '261,15', '37,00', '298,15']);
    expect(requests[0].url.searchParams.get('sort')).toBe('name');
  });

  it('pede a ordem pelo patrimônio, do maior para o menor, e mostra como a API devolveu', async () => {
    const requests = stubClubsApi();
    renderWithProviders(<ClubsPage />);
    await screen.findByText('Águias FC');

    fireEvent.change(screen.getByLabelText('Ordenar por'), {
      target: { value: 'net_worth_desc' },
    });

    await waitFor(() => expect(clubNames()).toEqual(['Delta FC', 'Águias FC']));
    expect(requests.at(-1)!.url.searchParams.get('sort')).toBe(
      'net_worth_desc',
    );
  });

  it('valida nome e sigla antes de enviar, com a mensagem junto ao campo', async () => {
    const requests = stubClubsApi();
    renderWithProviders(<ClubsPage />);
    await screen.findByText('Águias FC');
    fireEvent.click(screen.getByRole('button', { name: 'Criar clube' }));
    const dialog = screen.getByRole('dialog', { name: 'Criar clube' });
    const submit = within(dialog).getByRole('button', { name: 'Criar clube' });

    fireEvent.click(submit);
    expect(
      await within(dialog).findAllByText('Campo obrigatório.'),
    ).toHaveLength(2);

    fireEvent.change(within(dialog).getByLabelText('Nome'), {
      target: { value: 'FC' },
    });
    fireEvent.change(within(dialog).getByLabelText('Sigla'), {
      target: { value: 'le' },
    });
    fireEvent.click(submit);

    expect(
      await within(dialog).findByText('Use de 3 a 60 caracteres.'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Use 3 letras maiúsculas, de A a Z.'),
    ).toBeInTheDocument();
    expect(writes(requests)).toEqual([]);
  });

  it('cria o clube, mostra o caixa devolvido pela API e atualiza a lista', async () => {
    const requests = stubClubsApi();
    renderWithProviders(<ClubsPage />);
    await screen.findByText('Águias FC');
    fireEvent.click(screen.getByRole('button', { name: 'Criar clube' }));
    const dialog = screen.getByRole('dialog', { name: 'Criar clube' });

    fireEvent.change(within(dialog).getByLabelText('Nome'), {
      target: { value: 'Leões do Sul' },
    });
    fireEvent.change(within(dialog).getByLabelText('Sigla'), {
      target: { value: 'LEO' },
    });
    const submit = within(dialog).getByRole('button', { name: 'Criar clube' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Leões do Sul foi criado com caixa de 300,00.',
    );
    expect(writes(requests).map((request) => request.body)).toEqual([
      { name: 'Leões do Sul', acronym: 'LEO' },
    ]);
    expect(await screen.findByText('Leões do Sul')).toBeInTheDocument();
  });

  it('mostra o message da API quando a sigla já existe', async () => {
    stubClubsApi();
    refusal = 'Sigla já cadastrada.';
    renderWithProviders(<ClubsPage />);
    await screen.findByText('Águias FC');
    fireEvent.click(screen.getByRole('button', { name: 'Criar clube' }));
    const dialog = screen.getByRole('dialog', { name: 'Criar clube' });

    fireEvent.change(within(dialog).getByLabelText('Nome'), {
      target: { value: 'Águias do Norte' },
    });
    fireEvent.change(within(dialog).getByLabelText('Sigla'), {
      target: { value: 'AGU' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Criar clube' }),
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Sigla já cadastrada.',
    );
  });

  it('mostra a lista vazia', async () => {
    clubs = [];
    stubClubsApi();
    renderWithProviders(<ClubsPage />);

    expect(await screen.findByText('Nenhum clube criado.')).toBeInTheDocument();
  });
});
