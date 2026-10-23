import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right';
}

interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
}

function alignClassName(align: Column<unknown>['align']): string {
  return align === 'right' ? 'text-right' : 'text-left';
}

/** Única tabela das telas de lista, com os estados de carregamento, lista vazia e erro. */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  isLoading,
  error,
  emptyMessage,
}: DataTableProps<T>) {
  function renderState(content: ReactNode, role?: 'status' | 'alert') {
    return (
      <tr>
        <td
          colSpan={columns.length}
          role={role}
          className={`px-3 py-8 text-center ${role === 'alert' ? 'text-red-700' : 'text-slate-500'}`}
        >
          {content}
        </td>
      </tr>
    );
  }

  function renderBody() {
    if (isLoading) {
      return renderState('Carregando…', 'status');
    }
    if (error) {
      return renderState(error.message, 'alert');
    }
    if (!rows || rows.length === 0) {
      return renderState(emptyMessage);
    }
    return rows.map((row) => (
      <tr key={rowKey(row)} className="hover:bg-slate-50">
        {columns.map((column, index) => (
          <td
            key={index}
            className={`px-3 py-2 whitespace-nowrap ${alignClassName(column.align)}`}
          >
            {column.cell(row)}
          </td>
        ))}
      </tr>
    ));
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={`px-3 py-2 font-medium whitespace-nowrap ${alignClassName(column.align)}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{renderBody()}</tbody>
      </table>
    </div>
  );
}
