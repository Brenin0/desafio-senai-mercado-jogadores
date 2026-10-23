import { useState } from 'react';
import type { TransactionFilters } from '../../api/market.ts';
import type {
  Transaction,
  TransactionSummary,
  TransactionType,
} from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { DataTable, type Column } from '../../components/DataTable.tsx';
import { Feedback } from '../../components/Feedback.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Select } from '../../components/Input.tsx';
import {
  useExportTransactions,
  useTransactions,
} from '../../hooks/useMarket.ts';
import {
  formatDateTime,
  formatMoney,
  formatSignedMoney,
} from '../../lib/format.ts';

const TYPE_LABELS: Record<TransactionType, string> = {
  COMPRA: 'Compra',
  VENDA: 'Venda',
};

const TYPES = Object.keys(TYPE_LABELS) as TransactionType[];

const COLUMNS: Column<Transaction>[] = [
  {
    header: 'Data e hora',
    cell: (transaction) => formatDateTime(transaction.created_at),
  },
  { header: 'Tipo', cell: (transaction) => TYPE_LABELS[transaction.type] },
  { header: 'Jogador', cell: (transaction) => transaction.player_name },
  {
    header: 'Valor',
    cell: (transaction) => formatMoney(transaction.value),
    align: 'right',
  },
  {
    header: 'Taxa ou comissão',
    cell: (transaction) => formatMoney(transaction.fee),
    align: 'right',
  },
  {
    header: 'Multa',
    cell: (transaction) => formatMoney(transaction.penalty),
    align: 'right',
  },
  {
    header: 'Lucro',
    cell: (transaction) =>
      transaction.profit === null ? '—' : formatMoney(transaction.profit),
    align: 'right',
  },
  {
    header: 'Variação do caixa',
    cell: (transaction) => formatSignedMoney(transaction.cash_change),
    align: 'right',
  },
];

const SUMMARY_ITEMS: { field: keyof TransactionSummary; label: string }[] = [
  { field: 'total_spent', label: 'Total pago em compras (valor + taxa)' },
  { field: 'total_received', label: 'Total recebido em vendas' },
  { field: 'total_fees', label: 'Total de taxas e comissões' },
  { field: 'total_penalties', label: 'Total de multas' },
  { field: 'total_profit', label: 'Lucro total' },
];

/** Jogadores que aparecem no histórico do clube, na ordem em que aparecem. */
function historyPlayers(transactions: Transaction[]) {
  return [
    ...new Map(
      transactions.map((transaction) => [
        transaction.player_id,
        transaction.player_name,
      ]),
    ),
  ];
}

/** Histórico do clube com filtros, os totais do `summary` da API e a exportação em CSV. */
export function TransactionsSection({ clubId }: { clubId: number }) {
  const [filters, setFilters] = useState<TransactionFilters>({ types: [] });
  const history = useTransactions(clubId, filters);
  const fullHistory = useTransactions(clubId, { types: [] });
  const exportCsv = useExportTransactions(clubId);

  function toggleType(type: TransactionType, checked: boolean) {
    setFilters({
      ...filters,
      types: checked
        ? TYPES.filter((item) => item === type || filters.types.includes(item))
        : filters.types.filter((item) => item !== type),
    });
  }

  function selectPlayer(value: string) {
    setFilters({
      ...filters,
      playerId: value === '' ? undefined : Number(value),
    });
  }

  const summary = history.error ? undefined : history.data?.summary;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <fieldset className="flex gap-4 py-2">
            <legend className="sr-only">Tipos</legend>
            {TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 text-sm font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  className="size-4"
                  checked={filters.types.includes(type)}
                  onChange={(event) => toggleType(type, event.target.checked)}
                />
                {TYPE_LABELS[type]}
              </label>
            ))}
          </fieldset>
          <div className="w-56">
            <FormField label="Jogador" htmlFor="history-player">
              <Select
                id="history-player"
                value={filters.playerId ?? ''}
                onChange={(event) => selectPlayer(event.target.value)}
              >
                <option value="">Todos</option>
                {historyPlayers(fullHistory.data?.data ?? []).map(
                  ([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ),
                )}
              </Select>
            </FormField>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => exportCsv.mutate(filters)}
          disabled={exportCsv.isPending}
        >
          {exportCsv.isPending ? 'Exportando…' : 'Exportar CSV'}
        </Button>
      </div>
      <Feedback
        message={
          exportCsv.error && { kind: 'error', text: exportCsv.error.message }
        }
      />
      <DataTable
        caption="Histórico de transações"
        columns={COLUMNS}
        rows={history.data?.data}
        rowKey={(transaction) => transaction.id}
        isLoading={history.isLoading}
        error={history.error}
        emptyMessage="Nenhuma transação encontrada."
      />
      {summary && (
        <dl
          aria-label="Totais do histórico"
          className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-5"
        >
          {SUMMARY_ITEMS.map(({ field, label }) => (
            <div key={field}>
              <dt className="text-slate-500">{label}</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {formatMoney(summary[field])}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
