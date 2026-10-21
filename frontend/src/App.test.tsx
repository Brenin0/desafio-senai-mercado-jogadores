import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App.tsx';

describe('App', () => {
  it('mostra o nome da aplicação', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Passe' })).toBeInTheDocument();
  });
});
