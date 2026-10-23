import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Player } from '../../api/types.ts';
import { jsonResponse, stubApi, type ApiRequest } from '../../test/api-mock.ts';
import {
  AGUIAS,
  MEIA_LUA,
  OTTO_RANGEL,
  playersPage,
} from '../../test/fixtures.ts';
import { renderWithProviders } from '../../test/render.tsx';
import { PlayersPage } from './PlayersPage.tsx';

const NEW_PLAYER_FIELDS: [string, string][] = [
  ['Nome', 'Meia Lua'],
  ['Posição', 'MEI'],
  ['Agilidade', '85'],
  ['Idade', '25'],
  ['Velocidade', '70'],
  ['Finalização', '68'],
  ['Passe', '82'],
  ['Drible', '79'],
  ['Defesa', '55'],
  ['Físico', '64'],
  ['Potencial', '86'],
];

function fill(dialog: HTMLElement, fields: [string, string][]) {
  for (const [label, value] of fields) {
    fireEvent.change(within(dialog).getByLabelText(label), {
      target: { value },
    });
  }
}

function writes(requests: ApiRequest[]) {
  return requests.filter((request) => request.method !== 'GET');
}

describe('Formulários de jogador', () => {
  let players: Player[];
  let refusal: { status: number; message: string } | null;

  beforeEach(() => {
    players = [OTTO_RANGEL];
    refusal = null;
  });

  function stubPlayersApi() {
    return stubApi(({ method, url, body }) => {
      if (url.pathname.endsWith('/clubs')) {
        return jsonResponse([AGUIAS]);
      }
      if (method !== 'GET' && refusal) {
        return jsonResponse({ message: refusal.message }, refusal.status);
      }
      if (method === 'POST') {
        const created = {
          ...MEIA_LUA,
          condition: 'APTO' as const,
          market_value: 40,
        };
        players = [created, ...players];
        return jsonResponse(created, 201);
      }
      if (method === 'PUT') {
        const updated = { ...OTTO_RANGEL, ...(body as Partial<Player>) };
        players = [updated];
        return jsonResponse(updated);
      }
      if (method === 'PATCH') {
        const updated = {
          ...OTTO_RANGEL,
          condition: 'DOENTE' as const,
          market_value: 25.9,
        };
        players = [updated];
        return jsonResponse(updated);
      }
      return jsonResponse(playersPage(players));
    });
  }

  async function openCreate() {
    renderWithProviders(<PlayersPage />);
    await screen.findByText('Otto Rangel');
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar jogador' }));
    return screen.getByRole('dialog', { name: 'Cadastrar jogador' });
  }

  it('valida os obrigatórios e os limites junto ao campo, sem enviar o pedido', async () => {
    const requests = stubPlayersApi();
    const dialog = await openCreate();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }));
    expect(
      await within(dialog).findAllByText('Campo obrigatório.'),
    ).toHaveLength(11);

    fill(dialog, [
      ...NEW_PLAYER_FIELDS,
      ['Nome', '  Al  '],
      ['Agilidade', '101'],
      ['Idade', '15'],
      ['Potencial', '100'],
    ]);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cadastrar' }));

    expect(
      await within(dialog).findByText('Use de 3 a 100 caracteres.'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Use um número inteiro de 1 a 100.'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Use um número inteiro de 16 a 45.'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Use um número inteiro de 1 a 99.'),
    ).toBeInTheDocument();
    expect(writes(requests)).toEqual([]);
  });

  it('cadastra com os sete indicadores, um só pedido no clique duplo, e mostra o overall e o valor base da API', async () => {
    const requests = stubPlayersApi();
    const dialog = await openCreate();

    fill(dialog, NEW_PLAYER_FIELDS);
    const submit = within(dialog).getByRole('button', { name: 'Cadastrar' });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Meia Lua foi cadastrado com overall 75 e valor base 40,00.',
    );
    expect(writes(requests)).toHaveLength(1);
    expect(writes(requests)[0].body).toEqual({
      name: 'Meia Lua',
      position: 'MEI',
      agility: 85,
      age: 25,
      pace: 70,
      shooting: 68,
      passing: 82,
      dribbling: 79,
      defending: 55,
      physical: 64,
      potential: 86,
    });
    expect(await screen.findByText('Meia Lua')).toBeInTheDocument();
  });

  it('edita só nome, posição, agilidade e idade e atualiza a lista', async () => {
    const requests = stubPlayersApi();
    renderWithProviders(<PlayersPage />);
    const row = (await screen.findByText('Otto Rangel')).closest('tr')!;

    fireEvent.click(within(row).getByRole('button', { name: 'Editar' }));
    const dialog = screen.getByRole('dialog', { name: 'Editar Otto Rangel' });
    expect(
      within(dialog).queryByLabelText('Velocidade'),
    ).not.toBeInTheDocument();
    fill(dialog, [['Nome', 'Otto Rangel Filho']]);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Otto Rangel Filho foi atualizado.',
    );
    expect(
      writes(requests).map(({ method, url, body }) => [
        method,
        url.pathname,
        body,
      ]),
    ).toEqual([
      [
        'PUT',
        '/api/v1/players/3',
        { name: 'Otto Rangel Filho', position: 'MEI', agility: 85, age: 25 },
      ],
    ]);
    expect(await screen.findByText('Otto Rangel Filho')).toBeInTheDocument();
  });

  it('altera a condição e mostra o novo valor de mercado devolvido pela API', async () => {
    const requests = stubPlayersApi();
    renderWithProviders(<PlayersPage />);
    const row = (await screen.findByText('Otto Rangel')).closest('tr')!;

    fireEvent.click(within(row).getByRole('button', { name: 'Condição' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Condição de Otto Rangel',
    });
    fill(dialog, [['Nova condição', 'DOENTE']]);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Alterar condição' }),
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Otto Rangel agora está doente, com valor de mercado 25,90.',
    );
    expect(
      writes(requests).map(({ method, url, body }) => [
        method,
        url.pathname,
        body,
      ]),
    ).toEqual([
      ['PATCH', '/api/v1/players/3/condition', { condition: 'DOENTE' }],
    ]);
    await waitFor(() => {
      const updatedRow = screen.getByText('Otto Rangel').closest('tr')!;
      expect(within(updatedRow).getByText('Doente')).toBeInTheDocument();
    });
  });

  it('mostra o message da API quando a ação é recusada, sem fechar o formulário', async () => {
    stubPlayersApi();
    refusal = { status: 409, message: 'De DOENTE não volta direto para APTO.' };
    renderWithProviders(<PlayersPage />);
    const row = (await screen.findByText('Otto Rangel')).closest('tr')!;

    fireEvent.click(within(row).getByRole('button', { name: 'Condição' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Condição de Otto Rangel',
    });
    fill(dialog, [['Nova condição', 'APTO']]);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Alterar condição' }),
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'De DOENTE não volta direto para APTO.',
    );
  });
});
