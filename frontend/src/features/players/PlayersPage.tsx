import { useState } from 'react';
import type { PlayerFilters } from '../../api/players.ts';
import type { Club, Player } from '../../api/types.ts';
import { Button } from '../../components/Button.tsx';
import { ConditionBadge } from '../../components/ConditionBadge.tsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';
import { DataTable, type Column } from '../../components/DataTable.tsx';
import { Feedback, type FeedbackMessage } from '../../components/Feedback.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import { Pagination } from '../../components/Pagination.tsx';
import { useClubs } from '../../hooks/useClubs.ts';
import { useDeletePlayer, usePlayers } from '../../hooks/usePlayers.ts';
import { formatMoney } from '../../lib/format.ts';
import { PlayerFiltersForm } from './PlayerFiltersForm.tsx';

const PAGE_SIZE = 10;

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
  return club ? <span title={club.name}>{club.acronym}</span> : '…';
}

export function PlayersPage() {
  const [filters, setFilters] = useState<PlayerFilters>({});
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const players = usePlayers({ ...filters, page, limit: PAGE_SIZE });
  const clubs = useClubs();
  const deletePlayer = useDeletePlayer();

  const clubById = new Map((clubs.data ?? []).map((club) => [club.id, club]));
  const rows = players.data?.data;
  const meta = players.data?.meta;

  function applyFilters(next: PlayerFilters) {
    setFilters(next);
    setPage(1);
  }

  function openDelete(player: Player) {
    deletePlayer.reset();
    setFeedback(null);
    setPlayerToDelete(player);
  }

  function confirmDelete(player: Player) {
    deletePlayer.mutate(player.id, {
      onSuccess: () => {
        setFeedback({ kind: 'success', text: `${player.name} foi excluído.` });
        setPlayerToDelete(null);
        if (rows?.length === 1 && page > 1) {
          setPage(page - 1);
        }
      },
    });
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
      cell: (player) =>
        player.club_id === null && (
          <Button size="sm" variant="danger" onClick={() => openDelete(player)}>
            Excluir
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Jogadores" />
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
      {playerToDelete && (
        <ConfirmDialog
          title="Excluir jogador"
          confirmLabel="Excluir"
          isPending={deletePlayer.isPending}
          error={deletePlayer.error}
          onConfirm={() => confirmDelete(playerToDelete)}
          onCancel={() => setPlayerToDelete(null)}
        >
          Excluir <strong>{playerToDelete.name}</strong>? Ele sai da lista de
          jogadores.
        </ConfirmDialog>
      )}
    </div>
  );
}
