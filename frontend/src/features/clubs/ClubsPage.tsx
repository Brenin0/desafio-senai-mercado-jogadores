import { useState } from 'react';
import type { ClubSort } from '../../api/clubs.ts';
import type { Club } from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { DataTable, type Column } from '../../components/DataTable.tsx';
import { Feedback, type FeedbackMessage } from '../../components/Feedback.tsx';
import { FormField } from '../../components/FormField.tsx';
import { Select } from '../../components/Input.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import { useClubs } from '../../hooks/useClubs.ts';
import { formatMoney } from '../../lib/format.ts';
import { ClubFormDialog } from './ClubFormDialog.tsx';

const SORT_OPTIONS: { value: ClubSort; label: string }[] = [
  { value: 'name', label: 'Nome' },
  { value: 'net_worth_desc', label: 'Patrimônio: maior primeiro' },
  { value: 'net_worth_asc', label: 'Patrimônio: menor primeiro' },
];

const COLUMNS: Column<Club>[] = [
  {
    header: 'Nome',
    cell: (club) => (
      <span className="font-medium text-slate-900">{club.name}</span>
    ),
  },
  { header: 'Sigla', cell: (club) => club.acronym },
  { header: 'Caixa', cell: (club) => formatMoney(club.cash), align: 'right' },
  {
    header: 'Valor do elenco',
    cell: (club) => formatMoney(club.squad_value),
    align: 'right',
  },
  {
    header: 'Patrimônio',
    cell: (club) => formatMoney(club.net_worth),
    align: 'right',
  },
];

/** Clubes na ordem devolvida por `GET /clubs`, sem reordenar na tela. */
export function ClubsPage() {
  const [sort, setSort] = useState<ClubSort>('name');
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const clubs = useClubs(sort);

  function openCreate() {
    setFeedback(null);
    setIsCreating(true);
  }

  function showSuccess(text: string) {
    setFeedback({ kind: 'success', text });
    setIsCreating(false);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clubes"
        actions={<Button onClick={openCreate}>Criar clube</Button>}
      />
      <div className="max-w-xs">
        <FormField label="Ordenar por" htmlFor="clubs-sort">
          <Select
            id="clubs-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as ClubSort)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <Feedback message={feedback} onClose={() => setFeedback(null)} />
      <DataTable
        caption="Lista de clubes"
        columns={COLUMNS}
        rows={clubs.data}
        rowKey={(club) => club.id}
        isLoading={clubs.isLoading}
        error={clubs.error}
        emptyMessage="Nenhum clube criado."
      />
      {isCreating && (
        <ClubFormDialog
          onClose={() => setIsCreating(false)}
          onSaved={showSuccess}
        />
      )}
    </div>
  );
}
