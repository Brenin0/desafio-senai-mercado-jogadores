import { fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { routes } from './routes.tsx';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

describe('Rotas e menu principal', () => {
  it('abre a lista de jogadores no endereço inicial', () => {
    renderAt('/');

    expect(
      screen.getByRole('heading', { name: 'Jogadores' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jogadores' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it.each(['Clubes', 'Partidas', 'Classificação'])(
    'navega pelo menu até a tela %s',
    async (label) => {
      renderAt('/');

      fireEvent.click(screen.getByRole('link', { name: label }));

      expect(
        await screen.findByRole('heading', { name: label }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(
        screen.getByRole('link', { name: 'Jogadores' }),
      ).not.toHaveAttribute('aria-current');
    },
  );

  it('mostra página não encontrada para endereço desconhecido', () => {
    renderAt('/endereco-inexistente');

    expect(
      screen.getByRole('heading', { name: 'Página não encontrada' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Voltar para a lista de jogadores' }),
    ).toHaveAttribute('href', '/');
  });
});
