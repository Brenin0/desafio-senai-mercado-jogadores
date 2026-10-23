import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { createTestQueryClient } from './api-mock.ts';

interface RenderOptions {
  route?: string;
  path?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path = '*' }: RenderOptions = {},
) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
