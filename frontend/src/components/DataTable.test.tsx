import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable, type Column } from './DataTable.tsx';

interface Row {
  id: number;
  name: string;
}

const COLUMNS: Column<Row>[] = [{ header: 'Nome', cell: (row) => row.name }];

function renderTable(props: {
  rows?: Row[];
  isLoading?: boolean;
  error?: Error | null;
}) {
  render(
    <DataTable
      caption="Tabela de teste"
      columns={COLUMNS}
      rows={props.rows}
      rowKey={(row) => row.id}
      isLoading={props.isLoading ?? false}
      error={props.error ?? null}
      emptyMessage="Nada por aqui."
    />,
  );
}

describe('DataTable', () => {
  it('mostra o carregamento', () => {
    renderTable({ isLoading: true });

    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });

  it('mostra a mensagem do erro', () => {
    renderTable({ error: new Error('A API está fora do ar.') });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'A API está fora do ar.',
    );
  });

  it('mostra a lista vazia', () => {
    renderTable({ rows: [] });

    expect(screen.getByText('Nada por aqui.')).toBeInTheDocument();
  });

  it('mostra as linhas na ordem recebida', () => {
    renderTable({
      rows: [
        { id: 2, name: 'Zeca' },
        { id: 1, name: 'Ana' },
      ],
    });

    const cells = screen.getAllByRole('cell').map((cell) => cell.textContent);
    expect(cells).toEqual(['Zeca', 'Ana']);
  });
});
