import { useState } from 'react';
import { Link } from 'react-router';
import type { PlayerFilters } from '../../api/players.ts';
import type { Club, Player } from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { ConditionBadge } from '../../components/ConditionBadge.tsx';
import { DataTable, type Column } from '../../components/DataTable.tsx';
import { Feedback, type FeedbackMessage } from '../../components/Feedback.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import { Pagination } from '../../components/Pagination.tsx';
import { useClubs } from '../../hooks/useClubs.ts';
import { usePlayers } from '../../hooks/usePlayers.ts';
import { formatMoney } from '../../lib/format.ts';
import { BuyDialog } from './BuyDialog.tsx';
import { ConditionDialog } from './ConditionDialog.tsx';
import { DeletePlayerDialog } from './DeletePlayerDialog.tsx';
import { PlayerFiltersForm } from './PlayerFiltersForm.tsx';
import { PlayerFormDialog } from './PlayerFormDialog.tsx';

const PAGE_SIZE = 10;

type PlayerDialogState =
  | { kind: 'create' }
  | { kind: 'edit' | 'condition' | 'delete' | 'buy'; player: Player };

function totalLabel(total: number): string {
  return total === 1
    ? '1 jogador encontrado'
    : `${total} jogadores encontrados`;
}

function clubCell(clubId: number | null, clubById: Map<number, Club>) {
  if (clubId === null) {
    return <span className="text-slate-500">Livre</span>;
  }
  const club = clubById.get(clubId);
  return club ? (
    <Link
      to={`/clubes/${club.id}`}
      title={club.name}
      className="text-blue-700 hover:underline"
    >
      {club.acronym}
    </Link>
  ) : (
    '…'
  );
}

export function PlayersPage() {
  const [filters, setFilters] = useState<PlayerFilters>({});
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [dialog, setDialog] = useState<PlayerDialogState | null>(null);

  const players = usePlayers({ ...filters, page, limit: PAGE_SIZE });
  const clubs = useClubs();

  const clubById = new Map((clubs.data ?? []).map((club) => [club.id, club]));
  const rows = players.data?.data;
  const meta = players.data?.meta;

  function applyFilters(next: PlayerFilters) {
    setFilters(next);
    setPage(1);
  }

  function openDialog(next: PlayerDialogState) {
    setFeedback(null);
    setDialog(next);
  }

  function closeDialog() {
    setDialog(null);
  }

  function showSuccess(text: string) {
    setFeedback({ kind: 'success', text });
    setDialog(null);
  }

  function handleDeleted(player: Player) {
    showSuccess(`${player.name} foi excluído.`);
    if (rows?.length === 1 && page > 1) {
      setPage(page - 1);
    }
  }

  const columns: Column<Player>[] = [
    {
      header: 'Nome',
      cell: (player) => (
        <span className="font-medium text-slate-900">{player.name}</span>
      ),
    },
    { header: 'Posição', cell: (player) => player.position },
    { header: 'Overall', cell: (player) => player.overall, align: 'right' },
    { header: 'Agilidade', cell: (player) => player.agility, align: 'right' },
    { header: 'Idade', cell: (player) => player.age, align: 'right' },
    {
      header: 'Condição',
      cell: (player) => <ConditionBadge condition={player.condition} />,
    },
    {
      header: 'Valor base',
      cell: (player) => formatMoney(player.base_value),
      align: 'right',
    },
    {
      header: 'Valor de mercado',
      cell: (player) => formatMoney(player.market_value),
      align: 'right',
    },
    { header: 'Clube', cell: (player) => clubCell(player.club_id, clubById) },
    {
      header: 'Ações',
      cell: (player) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openDialog({ kind: 'edit', player })}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openDialog({ kind: 'condition', player })}
          >
            Condição
          </Button>
          {player.club_id === null && (
            <>
              <Button
                size="sm"
                onClick={() => openDialog({ kind: 'buy', player })}
              >
                Comprar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => openDialog({ kind: 'delete', player })}
              >
                Excluir
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Jogadores"
        actions={
          <Button onClick={() => openDialog({ kind: 'create' })}>
            Cadastrar jogador
          </Button>
        }
      />
      <PlayerFiltersForm clubs={clubs.data ?? []} onApply={applyFilters} />
      <Feedback message={feedback} onClose={() => setFeedback(null)} />
      <DataTable
        caption="Lista de jogadores"
        columns={columns}
        rows={rows}
        rowKey={(player) => player.id}
        isLoading={players.isLoading}
        error={players.error}
        emptyMessage="Nenhum jogador encontrado."
      />
      {meta && (
        <Pagination
          page={page}
          totalPages={meta.total_pages}
          totalLabel={totalLabel(meta.total_items)}
          onPageChange={setPage}
        />
      )}
      {dialog?.kind === 'create' && (
        <PlayerFormDialog onClose={closeDialog} onSaved={showSuccess} />
      )}
      {dialog?.kind === 'edit' && (
        <PlayerFormDialog
          player={dialog.player}
          onClose={closeDialog}
          onSaved={showSuccess}
        />
      )}
      {dialog?.kind === 'condition' && (
        <ConditionDialog
          player={dialog.player}
          onClose={closeDialog}
          onSaved={showSuccess}
        />
      )}
      {dialog?.kind === 'buy' && (
        <BuyDialog player={dialog.player} onClose={closeDialog} />
      )}
      {dialog?.kind === 'delete' && (
        <DeletePlayerDialog
          player={dialog.player}
          onClose={closeDialog}
          onDeleted={() => handleDeleted(dialog.player)}
        />
      )}
    </div>
  );
}
